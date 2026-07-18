<script lang="ts">
	import { enhance } from '$app/forms';
	import { forgetBooking, isMyBooking, tokenForBooking } from '$lib/my-bookings';
	import { addToast } from '$lib/toast.svelte';
	import { formatDate, formatDayLong, formatTime, toBerlinDate } from '$lib/time';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const booking = $derived(data.booking);

	let confirming = $state(false);
	let hydrated = $state(false);
	let mine = $state(false);
	let editHref = $state('');
	$effect(() => {
		hydrated = true;
		mine = isMyBooking(booking.id);
		const token = tokenForBooking(booking.id);
		editHref = token ? `/eintrag/${booking.id}/bearbeiten?token=${token}` : '';
	});

	const crossesMidnight = $derived(toBerlinDate(booking.startsAt) !== toBerlinDate(booking.endsAt));
	const isPhoneNumber = $derived(/^[\d\s+/()-]{5,}$/.test(booking.contact));
</script>

<svelte:head>
	<title>{booking.title} – Gemeinschaftsraum</title>
</svelte:head>

<article class="detail">
	<a href="/?tag={data.weekDate}" class="back-link">‹ Zur Übersicht</a>

	{#if data.justSaved}
		<p class="saved-notice" role="status">✓ Deine Änderungen sind gespeichert.</p>
	{/if}

	<div class="detail-card">
		<header>
			<p class="detail-badge" class:is-public={booking.isPublic}>
				{booking.isPublic ? '● Öffentlich – komm gern dazu!' : '🔒 Privat – bitte nicht stören'}
			</p>
			<h1>{booking.title}</h1>
		</header>

		<dl>
			<div>
				<dt>Wann</dt>
				<dd>
					{formatDayLong(booking.startsAt)}
					{#if booking.openEnd}
						ab {formatTime(booking.startsAt)} Uhr <span class="hint">(offenes Ende)</span>
					{:else}
						{formatTime(booking.startsAt)} – {formatTime(booking.endsAt)} Uhr
						{#if crossesMidnight}<span class="hint">(endet am Folgetag)</span>{/if}
					{/if}
				</dd>
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

		<form
			class="detail-actions"
			method="post"
			action="?/loeschen"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'redirect') {
						forgetBooking(booking.id);
					} else if (result.type === 'failure') {
						addToast(
							(result.data?.formError as string) ?? 'Löschen hat leider nicht geklappt.',
							'error'
						);
					}
					await update();
				};
			}}
		>
			{#if !hydrated}
				<!-- Ohne JS: direkter Submit (Auth-Guard sichert das Löschen ab) -->
				<button type="submit" class="button-danger">Eintrag löschen</button>
			{:else if mine}
				<a href={editHref} class="button">Bearbeiten</a>
				<button type="submit" class="button-danger">Löschen</button>
			{:else if confirming}
				<p class="confirm-text">
					Das ist {booking.name}s Eintrag – wirklich löschen? Bitte nur, wenn ihr euch einig seid.
				</p>
				<div class="confirm-buttons">
					<button type="submit" class="button-danger">Ja, löschen</button>
					<button type="button" class="button-quiet" onclick={() => (confirming = false)}>
						Abbrechen
					</button>
				</div>
			{:else}
				<button type="button" class="button-quiet" onclick={() => (confirming = true)}>
					Eintrag löschen
				</button>
			{/if}
		</form>

		<footer>
			<p>
				Eingetragen am {formatDate(booking.createdAt)}.
				{#if mine}
					Das ist dein Eintrag – dieses Gerät hat ihn gespeichert.
				{:else}
					Dein Eintrag? Dann findest du Bearbeiten & Löschen auf dem Handy, mit dem du ihn angelegt
					hast.
				{/if}
			</p>
		</footer>
	</div>
</article>

<style>
	.detail {
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

	.saved-notice {
		color: var(--color-free);
		background: var(--color-free-soft);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
		font-weight: 700;
	}

	.detail-card {
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: clamp(1.25rem, 4vw, 2rem);
		display: grid;
		gap: var(--space-4);
	}

	.detail-badge {
		font-size: var(--text-sm);
		font-weight: 800;
		color: var(--color-text-soft);
	}

	.detail-badge.is-public {
		color: var(--color-free);
	}

	h1 {
		font-size: var(--text-xl);
	}

	dl {
		display: grid;
		gap: var(--space-3);
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

	.detail-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
	}

	.confirm-text {
		flex-basis: 100%;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-error);
		background: var(--color-error-soft);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
	}

	.confirm-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	footer {
		border-top: 1.5px solid var(--color-border);
		padding-block-start: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-soft);
	}
</style>
