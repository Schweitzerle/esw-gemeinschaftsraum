<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import type { EditPayload } from '$lib/booking-dialog';
	import BookingFormFields from '$lib/components/BookingFormFields.svelte';
	import { declineIdentityThisSession, saveIdentity, shouldAskToRemember } from '$lib/my-identity';
	import { addToast } from '$lib/toast.svelte';
	import type { FieldErrors } from '$lib/validation/booking';

	let dialogEl: HTMLDialogElement;
	let formEl = $state<HTMLFormElement>();
	let bodyEl = $state<HTMLElement>();
	let submitting = $state(false);
	// Nachfrage „Name & Kontakt merken?" vor dem Speichern
	let askRemember = $state(false);
	let pending = $state<{ name: string; contact: string }>({ name: '', contact: '' });
	// Inhalt nur bei offenem Dialog rendern, damit die Feld-IDs die /neu-Seite nicht doppeln
	let isOpen = $state(false);
	let mode = $state<'create' | 'edit'>('create');
	let editTarget = $state<{ id: number; token: string } | undefined>(undefined);
	let values = $state<Record<string, string>>({});
	let fieldErrors = $state<FieldErrors>({});
	let formError = $state<string | undefined>(undefined);

	// Beim Bearbeiten postet das Formular an die speichern-Action des Eintrags,
	// beim Erstellen an /neu — beide liefern dieselbe Erfolgs-/Fehlerform.
	const action = $derived(
		mode === 'edit' && editTarget
			? `/eintrag/${editTarget.id}/bearbeiten?/speichern&token=${editTarget.token}`
			: '/neu'
	);

	function reset(): void {
		fieldErrors = {};
		formError = undefined;
		askRemember = false;
		isOpen = true;
		dialogEl.showModal();
	}

	export function open(date: string): void {
		mode = 'create';
		editTarget = undefined;
		values = { date };
		reset();
	}

	export function openEdit(payload: EditPayload): void {
		mode = 'edit';
		editTarget = { id: payload.id, token: payload.token };
		values = payload.values;
		reset();
	}

	function close(): void {
		dialogEl.close();
	}

	function onBackdropClick(event: MouseEvent): void {
		// Klick auf den Backdrop (= das dialog-Element selbst) schließt
		if (event.target === dialogEl) close();
	}

	/**
	 * Vor dem Speichern kurz fragen, ob dieses Gerät Name + Kontakt merken soll.
	 * Nur beim ersten Mal bzw. bei geänderten Daten; sonst direkt absenden.
	 */
	function onSubmitClick(event: MouseEvent): void {
		if (!formEl) return;
		const fd = new FormData(formEl);
		const name = String(fd.get('name') ?? '').trim();
		const contact = String(fd.get('contact') ?? '').trim();
		if (shouldAskToRemember(name, contact)) {
			event.preventDefault();
			pending = { name, contact };
			askRemember = true;
		}
	}

	function confirmRemember(): void {
		saveIdentity(pending.name, pending.contact);
		askRemember = false;
		formEl?.requestSubmit();
	}

	function skipRemember(): void {
		declineIdentityThisSession();
		askRemember = false;
		formEl?.requestSubmit();
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
				<h2 id="dialog-titel">
					{mode === 'edit' ? 'Eintrag bearbeiten' : 'Raum reservieren'}
				</h2>
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
				{action}
				bind:this={formEl}
				use:enhance={() => {
					submitting = true;
					return async ({ result }) => {
						submitting = false;
						if (result.type === 'redirect') {
							if (mode === 'edit') {
								// Auf dem Kalender bleiben, nicht zur Detailseite springen
								close();
								await invalidateAll();
								addToast('Änderungen gespeichert.', 'success');
							} else {
								close();
								await goto(result.location);
							}
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
					<button type="submit" disabled={submitting} onclick={onSubmitClick}>
						{#if submitting}
							Wird gespeichert …
						{:else if mode === 'edit'}
							Änderungen speichern
						{:else}
							Eintragen
						{/if}
					</button>
					<button type="button" class="button-quiet" onclick={close}>Abbrechen</button>
				</div>
			</form>

			{#if askRemember}
				<div class="remember-overlay">
					<div class="remember-pop" role="dialog" aria-label="Name und Kontakt merken?">
						<p>
							Soll dieses Gerät <strong>Name & Kontakt</strong> merken, damit du sie beim nächsten Eintrag
							nicht neu eintippen musst?
						</p>
						<p class="remember-note">Bleibt nur auf deinem Gerät – nichts geht an andere.</p>
						<div class="remember-actions">
							<button type="button" onclick={confirmRemember}>Ja, merken</button>
							<button type="button" class="button-quiet" onclick={skipRemember}>
								Nein, danke
							</button>
						</div>
					</div>
				</div>
			{/if}
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

	.remember-overlay {
		position: fixed;
		inset: 0;
		z-index: 10;
		display: grid;
		place-items: center;
		padding: var(--space-4);
		background: oklch(15% 0.02 55 / 0.5);
		backdrop-filter: blur(2px);
	}

	.remember-pop {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised);
		padding: clamp(1.25rem, 4vw, 1.75rem);
		width: min(24rem, 100%);
		display: grid;
		gap: var(--space-3);
	}

	.remember-note {
		font-size: var(--text-sm);
		color: var(--color-text-soft);
	}

	.remember-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}
</style>
