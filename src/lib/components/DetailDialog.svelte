<script lang="ts">
	import { formatDate, formatDayLong, formatTime, toBerlinDate } from '$lib/time';

	interface DetailBooking {
		title: string;
		description: string | null;
		name: string;
		contact: string;
		isPublic: boolean;
		openEnd: boolean;
		startsAt: number;
		endsAt: number;
		createdAt: number;
	}

	interface Props {
		booking: DetailBooking;
		onclose: () => void;
	}

	let { booking, onclose }: Props = $props();

	let dialogEl: HTMLDialogElement;

	$effect(() => {
		dialogEl.showModal();
	});

	const crossesMidnight = $derived(toBerlinDate(booking.startsAt) !== toBerlinDate(booking.endsAt));
	const isPhoneNumber = $derived(/^[\d\s+/()-]{5,}$/.test(booking.contact));

	function timeLabel(): string {
		if (booking.openEnd) return `ab ${formatTime(booking.startsAt)} Uhr (offenes Ende)`;
		const suffix = crossesMidnight ? ' (endet am Folgetag)' : '';
		return `${formatTime(booking.startsAt)} – ${formatTime(booking.endsAt)} Uhr${suffix}`;
	}

	function onBackdropClick(event: MouseEvent): void {
		if (event.target === dialogEl) dialogEl.close();
	}
</script>

<dialog bind:this={dialogEl} onclick={onBackdropClick} {onclose} aria-labelledby="detail-titel">
	<div class="dialog-body">
		<header>
			<p class="detail-badge" class:is-public={booking.isPublic}>
				{booking.isPublic ? '● Öffentlich – komm gern dazu!' : '🔒 Privat – bitte nicht stören'}
			</p>
			<button
				type="button"
				class="button-quiet close-button"
				onclick={() => dialogEl.close()}
				aria-label="Schließen"
			>
				✕
			</button>
		</header>

		<h2 id="detail-titel">{booking.title}</h2>

		<dl>
			<div>
				<dt>Wann</dt>
				<dd>{formatDayLong(booking.startsAt)} {timeLabel()}</dd>
			</div>
			<div>
				<dt>Wer</dt>
				<dd>{booking.name}</dd>
			</div>
			<div>
				<dt>Kontakt</dt>
				<dd>
					{#if isPhoneNumber}
						<a href="tel:{booking.contact.replace(/[\s/()-]/g, '')}">{booking.contact}</a>
					{:else}
						{booking.contact}
					{/if}
					<span class="hint">– falls es zu laut wird, sag kurz Bescheid</span>
				</dd>
			</div>
			{#if booking.description}
				<div>
					<dt>Beschreibung</dt>
					<dd class="description">{booking.description}</dd>
				</div>
			{/if}
		</dl>

		<footer>
			Eingetragen am {formatDate(booking.createdAt)}. Dein Eintrag? Ändern und Löschen geht mit
			deinem geheimen Bearbeitungs-Link.
		</footer>
	</div>
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
		padding: clamp(1.25rem, 4vw, 2rem);
		display: grid;
		gap: var(--space-3);
	}

	@media (min-width: 640px) {
		dialog {
			align-items: center;
			padding: var(--space-4);
		}

		.dialog-body {
			width: min(32rem, 100%);
			border-radius: var(--radius-lg);
		}
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.close-button {
		padding-inline: var(--space-3);
		flex-shrink: 0;
	}

	.detail-badge {
		font-size: var(--text-sm);
		font-weight: 800;
		color: var(--color-text-soft);
	}

	.detail-badge.is-public {
		color: var(--color-free);
	}

	h2 {
		font-size: var(--text-xl);
	}

	dl {
		display: grid;
		gap: var(--space-3);
		margin: 0;
	}

	dt {
		font-size: var(--text-sm);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-soft);
	}

	dd {
		margin: 0;
	}

	.description {
		white-space: pre-line;
	}

	.hint {
		color: var(--color-text-soft);
		font-size: var(--text-sm);
	}

	footer {
		border-top: 1.5px solid var(--color-border);
		padding-block-start: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-soft);
	}
</style>
