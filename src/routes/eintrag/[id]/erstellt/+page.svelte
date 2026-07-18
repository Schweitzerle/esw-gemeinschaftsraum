<script lang="ts">
	import { page } from '$app/state';
	import { formatDayLong, formatTime } from '$lib/time';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

		<div class="edit-link-box">
			<h2>Wichtig: Speichere dir diesen Link!</h2>
			<p>
				Nur mit diesem geheimen Link kannst du deinen Eintrag später ändern oder löschen – es gibt
				keine Accounts und keinen anderen Weg. Schick ihn dir am besten selbst per WhatsApp.
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
		</div>

		<div class="success-actions">
			<a href="/" class="button">Zur Wochenübersicht</a>
			<a href={data.editPath} class="button button-quiet">Eintrag bearbeiten</a>
		</div>
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

	.edit-link-box {
		background: var(--color-accent-soft);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		display: grid;
		gap: var(--space-2);
	}

	.edit-link-box h2 {
		font-size: var(--text-lg);
	}

	.edit-link-box p {
		font-size: var(--text-sm);
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

	.success-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-block-start: var(--space-2);
	}
</style>
