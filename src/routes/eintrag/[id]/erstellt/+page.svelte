<script lang="ts">
	import { page } from '$app/state';
	import { rememberBooking } from '$lib/my-bookings';
	import { formatDayLong, formatTime } from '$lib/time';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Dieses Gerät merkt sich den Eintrag → später direkt bearbeitbar, ohne Link
	$effect(() => {
		rememberBooking(data.booking.id, data.token);
	});

	const editUrl = $derived(new URL(data.editPath, page.url.origin).href);

	let copied = $state(false);
	let copyFailed = $state(false);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(editUrl);
			copied = true;
			copyFailed = false;
			setTimeout(() => (copied = false), 2500);
		} catch {
			copyFailed = true;
		}
	}
</script>

<svelte:head>
	<title>Gespeichert – Gemeinschaftsraum</title>
</svelte:head>

<div class="success-page">
	<div class="success-card">
		<p class="success-emoji" aria-hidden="true">🎉</p>
		<h1>Eingetragen!</h1>
		<p>
			<strong>{data.booking.title}</strong> am {formatDayLong(data.booking.startsAt)}
			{#if data.booking.openEnd}
				ab {formatTime(data.booking.startsAt)} Uhr (offenes Ende) steht jetzt im Plan.
			{:else}
				von {formatTime(data.booking.startsAt)} bis {formatTime(data.booking.endsAt)} Uhr steht jetzt
				im Plan.
			{/if}
		</p>

		<p class="hint-box">
			💡 Dieses Handy merkt sich deinen Eintrag. Du kannst ihn jederzeit direkt in der Übersicht
			bearbeiten oder löschen – ganz ohne Link oder Passwort.
		</p>

		<div class="success-actions">
			<a href="/" class="button">Zur Übersicht</a>
			<a href={data.editPath} class="button button-quiet">Jetzt bearbeiten</a>
		</div>

		<details class="other-device">
			<summary>Von einem anderen Handy bearbeiten?</summary>
			<p>
				Auf anderen Geräten kennt die Seite deinen Eintrag nicht. Willst du ihn auch dort ändern
				können, speicher dir diesen geheimen Link (z. B. per WhatsApp an dich selbst):
			</p>
			<div class="edit-link-row">
				<label class="visually-hidden" for="edit-link">Dein Bearbeitungs-Link</label>
				<input
					id="edit-link"
					type="text"
					readonly
					value={editUrl}
					onfocus={(e) => e.currentTarget.select()}
				/>
				<button type="button" onclick={copyLink}>
					{copied ? '✓ Kopiert' : 'Kopieren'}
				</button>
			</div>
			{#if copyFailed}
				<p class="field-error">
					Kopieren hat nicht geklappt – markiere den Link oben und kopiere ihn von Hand.
				</p>
			{/if}
		</details>
	</div>
</div>

<style>
	.success-page {
		max-width: 34rem;
		margin-inline: auto;
		padding-block-start: var(--space-6);
	}

	.success-card {
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: clamp(1.25rem, 4vw, 2rem);
		display: grid;
		gap: var(--space-3);
	}

	.success-emoji {
		font-size: 2.5rem;
	}

	h1 {
		font-size: var(--text-hero);
	}

	.hint-box {
		background: var(--color-accent-soft);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
	}

	.success-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-block-start: var(--space-1);
	}

	.other-device {
		margin-block-start: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-soft);
	}

	.other-device summary {
		cursor: pointer;
		font-weight: 700;
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	.other-device p {
		margin-block: var(--space-1) var(--space-2);
	}

	.edit-link-row {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.edit-link-row input {
		flex: 1;
		min-width: 12rem;
		font-size: var(--text-sm);
	}
</style>
