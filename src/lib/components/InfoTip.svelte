<script lang="ts">
	let { text }: { text: string } = $props();

	const tipId = `tip-${Math.random().toString(36).slice(2, 8)}`;
</script>

<span class="info-tip">
	<button type="button" aria-label="Mehr Infos" aria-describedby={tipId}>i</button>
	<span class="tip-bubble" role="tooltip" id={tipId}>{text}</span>
</span>

<style>
	.info-tip {
		position: relative;
		display: inline-flex;
		vertical-align: middle;
	}

	button {
		min-height: auto;
		width: 1.15rem;
		height: 1.15rem;
		padding: 0;
		border-radius: 999px;
		background: transparent;
		border: 1.5px solid var(--color-text-soft);
		color: var(--color-text-soft);
		font-size: 0.7rem;
		font-weight: 800;
		font-style: italic;
		line-height: 1;
	}

	button:hover {
		background: var(--color-accent-soft);
		border-color: var(--color-accent);
		color: var(--color-accent-strong);
	}

	.tip-bubble {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%) translateY(4px);
		width: max-content;
		max-width: min(18rem, 80vw);
		background: var(--color-text);
		color: var(--color-bg);
		font-size: var(--text-sm);
		font-weight: 500;
		line-height: 1.4;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-raised);
		opacity: 0;
		pointer-events: none;
		transition:
			opacity var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
		z-index: 20;
	}

	.info-tip:hover .tip-bubble,
	.info-tip:focus-within .tip-bubble {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}
</style>
