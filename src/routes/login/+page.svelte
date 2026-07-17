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
			Hier siehst du, wann unser Gemeinschaftsraum belegt ist, und kannst dich selbst eintragen.
			Das Passwort steht in der WhatsApp-Gruppe des Hauses.
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
