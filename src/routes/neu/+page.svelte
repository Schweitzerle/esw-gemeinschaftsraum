<script lang="ts">
	import { enhance } from '$app/forms';
	import BookingFormFields from '$lib/components/BookingFormFields.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);

	const values = $derived(form?.values ?? { date: data.defaultDate });
	const fieldErrors = $derived(
		form && 'fieldErrors' in form && form.fieldErrors ? form.fieldErrors : {}
	);
	const formError = $derived(form && 'formError' in form ? form.formError : undefined);
</script>

<svelte:head>
	<title>Neuer Eintrag – Gemeinschaftsraum</title>
</svelte:head>

<div class="form-page">
	<h1>Raum reservieren</h1>
	<p class="form-intro">
		Trag dich ein, damit alle wissen, wann der Raum belegt ist. Nach dem Speichern bekommst du einen
		geheimen Link, mit dem du deinen Eintrag später ändern oder löschen kannst.
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
		<BookingFormFields {values} {fieldErrors} />

		{#if formError}
			<p class="form-error" role="alert">{formError}</p>
		{/if}

		<div class="form-actions">
			<button type="submit" disabled={submitting}>
				{submitting ? 'Wird gespeichert …' : 'Eintragen'}
			</button>
			<a href="/" class="button button-quiet">Abbrechen</a>
		</div>
	</form>
</div>

<style>
	.form-page {
		max-width: 34rem;
		margin-inline: auto;
		display: grid;
		gap: var(--space-4);
		padding-block-start: var(--space-4);
	}

	h1 {
		font-size: var(--text-hero);
	}

	.form-intro {
		color: var(--color-text-soft);
	}

	form {
		display: grid;
		gap: var(--space-4);
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: clamp(1rem, 4vw, 2rem);
	}

	.form-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}
</style>
