<script lang="ts">
	let { icsUrl }: { icsUrl: string } = $props();

	let dialogEl: HTMLDialogElement;
	let copied = $state(false);

	export function open(): void {
		copied = false;
		dialogEl.showModal();
	}

	async function copyLink(): Promise<void> {
		try {
			await navigator.clipboard.writeText(icsUrl);
			copied = true;
			setTimeout(() => (copied = false), 2500);
		} catch {
			// readonly-Feld bleibt als Fallback zum Selbst-Kopieren
		}
	}

	function onBackdropClick(event: MouseEvent): void {
		if (event.target === dialogEl) dialogEl.close();
	}
</script>

<dialog bind:this={dialogEl} onclick={onBackdropClick} aria-labelledby="ics-titel">
	<div class="dialog-body">
		<header>
			<h2 id="ics-titel">📅 Kalender-Abo</h2>
			<button
				type="button"
				class="button-quiet close-button"
				onclick={() => dialogEl.close()}
				aria-label="Schließen"
			>
				✕
			</button>
		</header>
		<p>
			Füge diese Adresse in deiner Kalender-App als <strong>Kalender-Abo</strong> hinzu, dann siehst du
			alle Belegungen direkt im Handy-Kalender (nur Titel und Zeiten, keine Kontaktdaten).
		</p>
		<div class="ics-row">
			<label class="visually-hidden" for="ics-url">Abo-Adresse</label>
			<input
				id="ics-url"
				type="text"
				readonly
				value={icsUrl}
				onfocus={(e) => e.currentTarget.select()}
			/>
			<button type="button" onclick={copyLink}>{copied ? '✓ Kopiert' : 'Kopieren'}</button>
		</div>
	</div>
</dialog>

<style>
	dialog {
		border: none;
		padding: var(--space-4);
		background: transparent;
		width: 100%;
		max-width: none;
		margin: auto;
		display: grid;
		justify-items: center;
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
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised);
		width: min(30rem, 100%);
		padding: clamp(1.25rem, 4vw, 2rem);
		display: grid;
		gap: var(--space-3);
		font-size: var(--text-sm);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	h2 {
		font-size: var(--text-lg);
	}

	.close-button {
		padding-inline: var(--space-3);
	}

	.ics-row {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.ics-row input {
		flex: 1;
		min-width: 12rem;
		font-size: var(--text-sm);
	}
</style>
