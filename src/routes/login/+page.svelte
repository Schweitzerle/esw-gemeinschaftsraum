<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
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
			<input
				id="passwort"
				name="passwort"
				type="password"
				required
				autocomplete="current-password"
				aria-describedby={form?.error ? 'login-fehler' : undefined}
			/>

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

	.login-footer {
		font-size: var(--text-sm);
		text-align: center;
	}
</style>
