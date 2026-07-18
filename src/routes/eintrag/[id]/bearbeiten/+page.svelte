<script lang="ts">
	import { enhance } from '$app/forms';
	import BookingFormFields from '$lib/components/BookingFormFields.svelte';
	import { rememberBooking } from '$lib/my-bookings';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);

	// Wer über den geheimen Link hier landet (z. B. anderes Gerät), dessen Gerät
	// merkt sich den Eintrag ab jetzt ebenfalls
	$effect(() => {
		rememberBooking(data.bookingId, data.token);
	});

	const values = $derived(form?.values ?? data.values);
	const fieldErrors = $derived(
		form && 'fieldErrors' in form && form.fieldErrors ? form.fieldErrors : {}
	);
	const formError = $derived(form && 'formError' in form ? form.formError : undefined);
</script>

<svelte:head>
	<title>Eintrag bearbeiten – Gemeinschaftsraum</title>
</svelte:head>

<div class="form-page">
	<a href="/eintrag/{data.bookingId}" class="back-link">‹ Zum Eintrag</a>
	<h1>Eintrag bearbeiten</h1>

	<form
		method="post"
		action="?/speichern&token={data.token}"
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
				{submitting ? 'Wird gespeichert …' : 'Änderungen speichern'}
			</button>
		</div>
	</form>

	<details class="danger-zone">
		<summary>Eintrag löschen</summary>
		<div class="danger-body">
			<p>Der Eintrag wird endgültig gelöscht und der Zeitraum wieder freigegeben.</p>
			<form method="post" action="?/loeschen&token={data.token}" use:enhance>
				<button type="submit" class="button-danger">Ja, endgültig löschen</button>
			</form>
		</div>
	</details>
</div>

<style>
	.form-page {
		max-width: 34rem;
		margin-inline: auto;
		display: grid;
		gap: var(--space-4);
		padding-block-start: var(--space-4);
	}

	.back-link {
		font-size: var(--text-sm);
		font-weight: 700;
		justify-self: start;
	}

	h1 {
		font-size: var(--text-hero);
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

	.danger-zone {
		border: 1.5px solid var(--color-error);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
	}

	.danger-zone summary {
		font-weight: 700;
		color: var(--color-error);
		cursor: pointer;
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	.danger-body {
		display: grid;
		gap: var(--space-3);
		padding-block: var(--space-2) var(--space-3);
	}

	.danger-body form {
		all: unset;
	}
</style>
