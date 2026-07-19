<script lang="ts">
	import { onMount } from 'svelte';
	import DateField from '$lib/components/DateField.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import TimeSelect from '$lib/components/TimeSelect.svelte';
	import { loadIdentity } from '$lib/my-identity';
	import { berlinDateTimeToMs, formatDayLong, shiftDate, todayInBerlin } from '$lib/time';
	import { PAST_GRACE_MS, type FieldErrors } from '$lib/validation/booking';

	interface Props {
		values: Record<string, string>;
		fieldErrors: FieldErrors;
	}

	let { values, fieldErrors }: Props = $props();

	// Lokaler Zustand für die Felder, die Live-Hinweise brauchen (Datum/Zeit) bzw.
	// vorbefüllt werden (Name/Kontakt). Titel/Beschreibung bleiben unkontrolliert.
	// Bewusst nur der Anfangswert von `values` — der Dialog wird pro Öffnen neu gemountet.
	// svelte-ignore state_referenced_locally
	let title = $state(values.title ?? '');
	// svelte-ignore state_referenced_locally
	let date = $state(values.date ?? '');
	// svelte-ignore state_referenced_locally
	let startTime = $state(values.startTime ?? '');
	// svelte-ignore state_referenced_locally
	let endTime = $state(values.endTime ?? '');
	// svelte-ignore state_referenced_locally
	let name = $state(values.name ?? '');
	// svelte-ignore state_referenced_locally
	let contact = $state(values.contact ?? '');
	// svelte-ignore state_referenced_locally
	let isPublic = $state(values.isPublic === 'on');
	// svelte-ignore state_referenced_locally
	let description = $state(values.description ?? '');

	// Neuer Eintrag ohne Name/Kontakt: mit gemerkter Identität dieses Geräts vorbefüllen
	onMount(() => {
		if (!name && !contact) {
			const stored = loadIdentity();
			if (stored) {
				name = stored.name;
				contact = stored.contact;
			}
		}
	});

	// Liegt der gewählte Beginn (Datum + Von) bereits in der Vergangenheit?
	const startInPast = $derived(
		Boolean(date && startTime) && berlinDateTimeToMs(date, startTime) < Date.now() - PAST_GRACE_MS
	);

	// Endzeit ≤ Startzeit ⇒ Buchung läuft über Mitternacht (endet am Folgetag)
	const crossesMidnight = $derived(Boolean(startTime && endTime) && endTime <= startTime);
	const nextDayLabel = $derived(
		crossesMidnight && date ? formatDayLong(berlinDateTimeToMs(shiftDate(date, 1), '12:00')) : ''
	);

	function errorId(field: string): string | undefined {
		return fieldErrors[field as keyof FieldErrors] ? `fehler-${field}` : undefined;
	}
</script>

{#snippet fieldError(field: keyof FieldErrors)}
	{#if fieldErrors[field]}
		<p class="field-error" id="fehler-{field}">{fieldErrors[field]?.[0]}</p>
	{/if}
{/snippet}

<div class="field">
	<label for="title">Titel / Anlass *</label>
	<input
		id="title"
		name="title"
		type="text"
		required
		maxlength="80"
		placeholder="z. B. Spieleabend, Geburtstag, Lerngruppe"
		bind:value={title}
		aria-invalid={fieldErrors.title ? 'true' : undefined}
		aria-describedby={errorId('title')}
	/>
	{@render fieldError('title')}
</div>

<div class="field-row time-row">
	<div class="field">
		<label for="date">Datum *</label>
		<DateField
			id="date"
			name="date"
			bind:value={date}
			min={todayInBerlin()}
			invalid={Boolean(fieldErrors.date)}
			describedby={errorId('date')}
		/>
		{@render fieldError('date')}
	</div>
	<div class="field">
		<label for="startTime">Von *</label>
		<TimeSelect
			id="startTime"
			name="startTime"
			bind:value={startTime}
			invalid={Boolean(fieldErrors.startTime)}
			describedby={errorId('startTime')}
		/>
		{@render fieldError('startTime')}
	</div>
	<div class="field">
		<label for="endTime">
			Bis
			<InfoTip
				text="Ohne Endzeit gilt „offenes Ende“ – wir reservieren dann 4 Stunden. Endet ihr nach Mitternacht, wähl einfach die Uhrzeit am Folgetag."
			/>
		</label>
		<TimeSelect
			id="endTime"
			name="endTime"
			bind:value={endTime}
			allowEmpty
			invalid={Boolean(fieldErrors.endTime)}
			describedby={errorId('endTime')}
		/>
		{@render fieldError('endTime')}
	</div>
</div>

{#if startInPast}
	<p class="field-hint warn" role="status">
		⚠ Dieser Beginn liegt in der Vergangenheit – bitte wähl Datum und „Von“ neu.
	</p>
{/if}
{#if crossesMidnight}
	<p class="field-hint" role="status">
		🌙 Endet am Folgetag{nextDayLabel ? ` (${nextDayLabel})` : ''} um {endTime} Uhr.
	</p>
{/if}

<p class="quiet-hours">🌙 Ab 22 Uhr bitte an die Ruhezeiten im Haus denken.</p>

<div class="field-row">
	<div class="field">
		<label for="name">Dein Name *</label>
		<input
			id="name"
			name="name"
			type="text"
			required
			maxlength="50"
			autocomplete="name"
			bind:value={name}
			aria-invalid={fieldErrors.name ? 'true' : undefined}
			aria-describedby={errorId('name')}
		/>
		{@render fieldError('name')}
	</div>
	<div class="field">
		<label for="contact">
			Kontakt *
			<InfoTip
				text="Handynummer oder Ähnliches – damit man dich erreichen kann, falls es z. B. zu laut wird. Sichtbar erst in der Detailansicht eines Eintrags."
			/>
		</label>
		<input
			id="contact"
			name="contact"
			type="text"
			required
			maxlength="100"
			placeholder="z. B. 0151 2345678"
			bind:value={contact}
			aria-invalid={fieldErrors.contact ? 'true' : undefined}
			aria-describedby={errorId('contact')}
		/>
		{@render fieldError('contact')}
	</div>
</div>

<div class="field switch-field">
	<div class="switch-info">
		<span class="switch-text">
			Öffentlich – andere dürfen dazukommen
			<InfoTip
				text="Öffentlich heißt: Mitbewohner sind eingeladen, spontan vorbeizuschauen. Privat heißt: ihr bleibt unter euch. Der Eintrag selbst ist immer für alle sichtbar."
			/>
		</span>
		<span class="switch-state" class:on={isPublic} aria-hidden="true">
			{#if isPublic}
				✓ Öffentlich – Mitbewohner dürfen dazukommen
			{:else}
				✕ Privat – ihr bleibt unter euch
			{/if}
		</span>
	</div>
	<label class="switch">
		<input
			type="checkbox"
			name="isPublic"
			id="isPublic"
			bind:checked={isPublic}
			aria-label="Öffentlich – andere dürfen dazukommen"
		/>
		<span class="switch-track" aria-hidden="true"></span>
	</label>
</div>

<div class="field">
	<label for="description">Kurzbeschreibung (optional)</label>
	<textarea
		id="description"
		name="description"
		rows="3"
		maxlength="500"
		placeholder="z. B. was ihr vorhabt, ob man etwas mitbringen soll …"
		bind:value={description}
		aria-invalid={fieldErrors.description ? 'true' : undefined}
		aria-describedby={errorId('description')}></textarea>
	{@render fieldError('description')}
</div>

<style>
	.field {
		display: grid;
		gap: var(--space-1);
	}

	.field label {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.field-row {
		display: grid;
		gap: var(--space-3);
	}

	@media (min-width: 560px) {
		.field-row {
			grid-template-columns: 1fr 1fr;
		}

		.time-row {
			grid-template-columns: 1.3fr 1fr 1fr;
		}
	}

	.field-hint {
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-text-soft);
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
	}

	.field-hint.warn {
		color: var(--color-error);
		background: var(--color-error-soft);
		border-color: transparent;
	}

	.quiet-hours {
		font-size: var(--text-sm);
		color: var(--color-text-soft);
	}

	.switch-field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		background: var(--color-surface-raised);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
	}

	.switch-info {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.switch-text {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 600;
	}

	.switch-state {
		font-size: var(--text-sm);
		font-weight: 800;
		color: var(--color-error);
	}

	.switch-state.on {
		color: var(--color-free);
	}

	.switch {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
		cursor: pointer;
	}

	.switch input {
		position: absolute;
		opacity: 0;
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	.switch-track {
		width: 3rem;
		height: 1.7rem;
		border-radius: 999px;
		background: var(--color-error);
		transition: background var(--duration-fast) var(--ease-out);
		position: relative;
	}

	.switch-track::after {
		content: '';
		position: absolute;
		top: 0.2rem;
		inset-inline-start: 0.2rem;
		width: 1.3rem;
		height: 1.3rem;
		border-radius: 999px;
		background: var(--color-surface-raised);
		box-shadow: var(--shadow-card);
		transition: translate var(--duration-fast) var(--ease-out);
	}

	.switch input:checked + .switch-track {
		background: var(--color-free);
	}

	.switch input:checked + .switch-track::after {
		translate: 1.3rem 0;
	}

	.switch input:focus-visible + .switch-track {
		outline: 3px solid var(--color-focus);
		outline-offset: 2px;
	}
</style>
