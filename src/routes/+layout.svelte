<script lang="ts">
	import '@fontsource-variable/fraunces/index.css';
	import '@fontsource-variable/nunito-sans/index.css';
	import '../app.css';
	import { setContext } from 'svelte';
	import { page } from '$app/state';
	import BookingDialog from '$lib/components/BookingDialog.svelte';
	import { todayInBerlin } from '$lib/time';

	let { children } = $props();

	const isLoginPage = $derived(page.url.pathname === '/login');

	// Seiten (z. B. der Kalender) öffnen den Eintragen-Dialog über diesen Context
	let dialog = $state<BookingDialog>();
	setContext('booking-dialog', {
		open: (date: string) => dialog?.open(date)
	});

	// Marker für E2E-Tests: erst nach der Hydration in Formulare tippen
	$effect(() => {
		document.body.dataset.hydrated = 'true';
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

{#if isLoginPage}
	{@render children()}
{:else}
	<div class="shell">
		<header class="site-header">
			<a href="/" class="site-title">
				<span class="site-logo" aria-hidden="true">🛋️</span>
				<span>Gemeinschaftsraum</span>
			</a>
			<a
				href="/neu"
				class="button header-cta"
				onclick={(e) => {
					e.preventDefault();
					dialog?.open(todayInBerlin());
				}}
			>
				+ Eintragen
			</a>
		</header>

		<main class="site-main">
			{@render children()}
		</main>

		<footer class="site-footer">
			<p>Unsere Haus-Seite – von Bewohnern für Bewohner.</p>
			<a href="/datenschutz">Datenschutz</a>
		</footer>
	</div>

	<BookingDialog bind:this={dialog} />
{/if}

<style>
	.shell {
		max-width: 68rem;
		margin-inline: auto;
		padding-inline: clamp(0.75rem, 3vw, 2rem);
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	.site-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding-block: var(--space-4);
	}

	.site-title {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 640;
		color: var(--color-text);
		text-decoration: none;
	}

	.site-logo {
		font-size: 1.5em;
	}

	.header-cta {
		flex-shrink: 0;
	}

	.site-main {
		flex: 1;
		padding-block-end: var(--space-section);
	}

	.site-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		border-top: 1.5px solid var(--color-border);
		padding-block: var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-soft);
	}
</style>
