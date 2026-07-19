<script lang="ts">
	import '@fontsource-variable/fraunces/index.css';
	import '@fontsource-variable/nunito-sans/index.css';
	import '../app.css';
	import { setContext } from 'svelte';
	import { page } from '$app/state';
	import {
		BOOKING_DIALOG_KEY,
		type BookingDialogContext,
		type EditPayload
	} from '$lib/booking-dialog';
	import BookingDialog from '$lib/components/BookingDialog.svelte';
	import IcsDialog from '$lib/components/IcsDialog.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import { todayInBerlin } from '$lib/time';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	const isLoginPage = $derived(page.url.pathname === '/login');
	const icsUrl = $derived(data.icsPath ? new URL(data.icsPath, page.url.origin).href : null);

	// Seiten öffnen den Eintragen-/Bearbeiten-Dialog über diesen Context
	let dialog = $state<BookingDialog>();
	let icsDialog = $state<IcsDialog>();
	setContext<BookingDialogContext>(BOOKING_DIALOG_KEY, {
		open: (date: string) => dialog?.open(date),
		openEdit: (payload: EditPayload) => dialog?.openEdit(payload)
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
				<span class="site-name">Gemeinschaftsraum</span>
			</a>
			<div class="header-actions">
				{#if icsUrl}
					<button
						type="button"
						class="button-quiet ics-button"
						onclick={() => icsDialog?.open()}
						aria-label="Kalender-Abo"
						title="Belegungen im Handy-Kalender abonnieren"
					>
						📅
					</button>
				{/if}
				<a
					href="/neu"
					class="button header-cta"
					aria-label="Neuer Eintrag"
					onclick={(e) => {
						e.preventDefault();
						dialog?.open(todayInBerlin());
					}}
				>
					<span aria-hidden="true">+</span>
					<span class="cta-label">Eintragen</span>
				</a>
			</div>
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
	{#if icsUrl}
		<IcsDialog bind:this={icsDialog} {icsUrl} />
	{/if}
{/if}

<Toasts />

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
		min-width: 0;
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 640;
		color: var(--color-text);
		text-decoration: none;
	}

	.site-logo {
		font-size: 1.5em;
		flex-shrink: 0;
	}

	/* Titel darf im Notfall kürzen statt den Header zu sprengen */
	.site-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.ics-button {
		padding-inline: var(--space-3);
		font-size: 1.1rem;
	}

	/* Auf schmalen Screens: Titel etwas kleiner, CTA nur als „+" */
	@media (max-width: 420px) {
		.site-title {
			font-size: var(--text-base);
		}

		.header-cta {
			padding-inline: var(--space-4);
		}

		.cta-label {
			display: none;
		}
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
