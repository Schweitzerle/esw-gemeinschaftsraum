<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import BookingFormFields from '$lib/components/BookingFormFields.svelte';
	import { addToast } from '$lib/toast.svelte';
	import type { FieldErrors } from '$lib/validation/booking';

	let dialogEl: HTMLDialogElement;
	let bodyEl = $state<HTMLElement>();
	let submitting = $state(false);
	// Inhalt nur bei offenem Dialog rendern, damit die Feld-IDs die /neu-Seite nicht doppeln
	let isOpen = $state(false);
	let values = $state<Record<string, string>>({});
	let fieldErrors = $state<FieldErrors>({});
	let formError = $state<string | undefined>(undefined);

	export function open(date: string): void {
		values = { date };
		fieldErrors = {};
		formError = undefined;
		isOpen = true;
		dialogEl.showModal();
	}

	function close(): void {
		dialogEl.close();
	}

	function onBackdropClick(event: MouseEvent): void {
		// Klick auf den Backdrop (= das dialog-Element selbst) schließt
		if (event.target === dialogEl) close();
	}
</script>

<dialog
	bind:this={dialogEl}
	onclick={onBackdropClick}
	onclose={() => (isOpen = false)}
	aria-labelledby="dialog-titel"
>
	{#if isOpen}
		<div class="dialog-body" bind:this={bodyEl}>
			<header>
				<h2 id="dialog-titel">Raum reservieren</h2>
				<button
					type="button"
					class="button-quiet close-button"
					onclick={close}
					aria-label="Schließen"
				>
					✕
				</button>
			</header>

			<form
				method="post"
				action="/neu"
				use:enhance={() => {
					submitting = true;
					return async ({ result }) => {
						submitting = false;
						if (result.type === 'redirect') {
							close();
							await goto(result.location);
						} else if (result.type === 'failure' && result.data) {
							values = (result.data.values as Record<string, string>) ?? values;
							fieldErrors = (result.data.fieldErrors as FieldErrors) ?? {};
							formError = (result.data.formError as string | undefined) ?? undefined;
							if (formError) {
								addToast(formError, 'error');
							}
							// Zum ersten Problemfeld scrollen, damit der Fehler sofort sichtbar ist
							await tick();
							bodyEl
								?.querySelector('[aria-invalid="true"]')
								?.scrollIntoView({ block: 'center', behavior: 'smooth' });
						} else if (result.type === 'error') {
							addToast('Das hat leider nicht geklappt. Probier es gleich nochmal.', 'error');
						}
					};
				}}
			>
				<BookingFormFields {values} {fieldErrors} />

				{#if formError}
					<p class="form-error" role="alert">{formError}</p>
				{/if}

				<div class="dialog-actions">
					<button type="submit" disabled={submitting}>
						{submitting ? 'Wird gespeichert …' : 'Eintragen'}
					</button>
					<button type="button" class="button-quiet" onclick={close}>Abbrechen</button>
				</div>
			</form>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		border: none;
		padding: 0;
		background: transparent;
		max-width: none;
		max-height: none;
		width: 100%;
		height: 100dvh;
		margin: 0;
		display: grid;
		align-items: end;
		justify-items: center;
		overscroll-behavior: contain;
	}

	dialog:not([open]) {
		display: none;
	}

	dialog::backdrop {
		background: oklch(15% 0.02 55 / 0.45);
		backdrop-filter: blur(2px);
	}

	.dialog-body {
		background: var(--color-surface);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		box-shadow: var(--shadow-raised);
		width: 100%;
		max-height: 92dvh;
		overflow-y: auto;
		padding: clamp(1rem, 4vw, 2rem);
		display: grid;
		gap: var(--space-4);
	}

	@media (min-width: 640px) {
		dialog {
			align-items: center;
			padding: var(--space-4);
		}

		.dialog-body {
			width: min(44rem, 100%);
			border-radius: var(--radius-lg);
			max-height: 90dvh;
		}
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	h2 {
		font-size: var(--text-xl);
	}

	.close-button {
		padding-inline: var(--space-3);
		flex-shrink: 0;
	}

	form {
		display: grid;
		gap: var(--space-4);
	}

	.dialog-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		position: sticky;
		bottom: calc(-1 * clamp(1rem, 4vw, 2rem));
		background: var(--color-surface);
		border-top: 1.5px solid var(--color-border);
		padding-block: var(--space-3);
		margin-block-end: calc(-1 * clamp(1rem, 4vw, 2rem) + var(--space-2));
	}
</style>
