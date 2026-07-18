<script lang="ts">
	import { dismissToast, toasts } from '$lib/toast.svelte';

	let container = $state<HTMLElement>();

	// Als Popover landen die Toasts im Top Layer — sichtbar auch ÜBER offenen
	// <dialog>-Modalen (position:fixed allein läge darunter).
	$effect(() => {
		if (!container?.showPopover) return;
		if (toasts.length > 0 && !container.matches(':popover-open')) {
			container.showPopover();
		} else if (toasts.length === 0 && container.matches(':popover-open')) {
			container.hidePopover();
		}
	});
</script>

<div class="toasts" aria-live="polite" popover="manual" bind:this={container}>
	{#each toasts as toast (toast.id)}
		<div class="toast toast-{toast.type}" role={toast.type === 'error' ? 'alert' : 'status'}>
			<span class="toast-icon" aria-hidden="true">{toast.type === 'error' ? '⚠️' : '✓'}</span>
			<p>{toast.message}</p>
			<button type="button" onclick={() => dismissToast(toast.id)} aria-label="Meldung schließen">
				✕
			</button>
		</div>
	{/each}
</div>

<style>
	.toasts {
		position: fixed;
		top: var(--space-3);
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		display: grid;
		gap: var(--space-2);
		width: min(28rem, calc(100vw - 2 * var(--space-3)));
		pointer-events: none;
		/* Popover-Defaults neutralisieren (margin/border/padding/inset) */
		margin: 0;
		border: none;
		padding: 0;
		inset: var(--space-3) auto auto 50%;
		background: transparent;
		overflow: visible;
	}

	/* Geschlossenes Popover verstecken (Author-CSS überschreibt sonst das UA-Default).
	   Browser ohne Popover-Support droppen diese Regel → Fallback wie bisher. */
	.toasts:not(:popover-open) {
		display: none;
	}

	.toast {
		pointer-events: auto;
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		background: var(--color-surface-raised);
		border: 1.5px solid var(--color-border);
		border-inline-start: 4px solid var(--color-accent);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-raised);
		padding: var(--space-3);
		font-size: var(--text-sm);
	}

	.toast-error {
		border-inline-start-color: var(--color-error);
	}

	.toast-success {
		border-inline-start-color: var(--color-free);
	}

	.toast p {
		flex: 1;
		font-weight: 600;
	}

	.toast button {
		background: none;
		color: var(--color-text-soft);
		min-height: auto;
		padding: 0 var(--space-1);
		font-weight: 400;
	}

	.toast button:hover {
		background: none;
		color: var(--color-text);
	}
</style>
