<script lang="ts">
	import DateField from '$lib/components/DateField.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import TimeSelect from '$lib/components/TimeSelect.svelte';
	import { todayInBerlin } from '$lib/time';
	import type { FieldErrors } from '$lib/validation/booking';

	interface Props {
		values: Record<string, string>;
		fieldErrors: FieldErrors;
	}

	let { values, fieldErrors }: Props = $props();

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
		value={values.title ?? ''}
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
			value={values.date ?? ''}
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
			value={values.startTime ?? ''}
			invalid={Boolean(fieldErrors.startTime)}
			describedby={errorId('startTime')}
		/>
		{@render fieldError('startTime')}
	</div>
	<div class="field">
		<label for="endTime">
			Bis
			<InfoTip
				text="Ohne Endzeit gilt „offenes Ende“ – wir reservieren dann 6 Stunden. Endet ihr nach Mitternacht, wähl einfach die Uhrzeit am Folgetag."
			/>
		</label>
		<TimeSelect
			id="endTime"
			name="endTime"
			value={values.endTime ?? ''}
			allowEmpty
			invalid={Boolean(fieldErrors.endTime)}
			describedby={errorId('endTime')}
		/>
		{@render fieldError('endTime')}
	</div>
</div>

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
			value={values.name ?? ''}
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
			value={values.contact ?? ''}
			aria-invalid={fieldErrors.contact ? 'true' : undefined}
			aria-describedby={errorId('contact')}
		/>
		{@render fieldError('contact')}
	</div>
</div>

<div class="field switch-field">
	<span class="switch-text">
		Öffentlich – andere dürfen dazukommen
		<InfoTip
			text="Öffentlich heißt: Mitbewohner sind eingeladen, spontan vorbeizuschauen. Privat heißt: ihr bleibt unter euch. Der Eintrag selbst ist immer für alle sichtbar."
		/>
	</span>
	<label class="switch">
		<input
			type="checkbox"
			name="isPublic"
			id="isPublic"
			checked={values.isPublic === 'on'}
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
		aria-invalid={fieldErrors.description ? 'true' : undefined}
		aria-describedby={errorId('description')}>{values.description ?? ''}</textarea
	>
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

	.switch-text {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 600;
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
		background: var(--color-border);
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
