<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
	let passwordVisible = $state(false);
	// Ohne JavaScript wäre der Schalter ein toter Knopf — dann bleibt er weg.
	let hydrated = $state(false);
	onMount(() => (hydrated = true));
</script>

<svelte:head>
	<title>Anmelden – Gemeinschaftsraum</title>
</svelte:head>

<main class="login-page">
	<div class="login-card">
		<h1>Gemeinschaftsraum</h1>
		<p class="login-intro">
			Hier siehst du, wann unser Gemeinschaftsraum belegt ist, und kannst dich selbst eintragen. Das
			Passwort steht in der WhatsApp-Gruppe des Hauses.
		</p>

		<form
			method="post"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
		>
			<label for="passwort">Haus-Passwort</label>
			<div class="password-field">
				<input
					id="passwort"
					name="passwort"
					type={passwordVisible ? 'text' : 'password'}
					required
					autocomplete="current-password"
					autocapitalize="off"
					autocorrect="off"
					spellcheck="false"
					aria-describedby={form?.error ? 'login-fehler' : undefined}
				/>
				{#if hydrated}
					<button
						type="button"
						class="toggle-visibility"
						aria-controls="passwort"
						aria-pressed={passwordVisible}
						title={passwordVisible ? 'Passwort verbergen' : 'Passwort anzeigen'}
						onclick={() => (passwordVisible = !passwordVisible)}
					>
						<span class="visually-hidden">
							{passwordVisible ? 'Passwort verbergen' : 'Passwort anzeigen'}
						</span>
						<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
							<path
								d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<circle
								cx="12"
								cy="12"
								r="2.75"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
							/>
							{#if passwordVisible}
								<path
									d="m4 20 16-16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
								/>
							{/if}
						</svg>
					</button>
				{/if}
			</div>

			{#if form?.error}
				<p class="form-error" id="login-fehler" role="alert">{form.error}</p>
			{/if}

			<button type="submit" disabled={submitting}>
				{submitting ? 'Einen Moment …' : 'Rein ins Haus'}
			</button>
		</form>

		<p class="login-footer">
			<a href="/datenschutz">Datenschutz</a>
		</p>
	</div>
</main>

<style>
	.login-page {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: clamp(0.75rem, 4vw, 2rem);
	}

	.login-card {
		width: min(26rem, 100%);
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised);
		padding: clamp(1.5rem, 5vw, 2.5rem);
		display: grid;
		gap: var(--space-4);
	}

	h1 {
		font-size: var(--text-xl);
	}

	.login-intro {
		color: var(--color-text-soft);
	}

	form {
		display: grid;
		gap: var(--space-3);
	}

	.password-field {
		position: relative;
		display: grid;
	}

	/* Platz für den Schalter, damit er nie über den Eingabetext liegt. */
	.password-field :global(input) {
		padding-right: 3rem;
	}

	.toggle-visibility {
		position: absolute;
		inset-block: 0;
		right: 0;
		width: 3rem;
		min-height: 100%;
		padding: 0;
		color: var(--color-text-soft);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.toggle-visibility:hover,
	.toggle-visibility[aria-pressed='true'] {
		color: var(--color-accent-strong);
	}

	.toggle-visibility svg {
		width: 1.375rem;
		height: 1.375rem;
	}

	.login-footer {
		font-size: var(--text-sm);
		text-align: center;
	}
</style>
