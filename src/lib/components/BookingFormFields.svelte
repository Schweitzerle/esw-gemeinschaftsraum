<script lang="ts">
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

<div class="field-row">
	<div class="field">
		<label for="date">Datum *</label>
		<input
			id="date"
			name="date"
			type="date"
			required
			value={values.date ?? ''}
			aria-invalid={fieldErrors.date ? 'true' : undefined}
			aria-describedby={errorId('date')}
		/>
		{@render fieldError('date')}
	</div>
	<div class="field">
		<label for="startTime">Von *</label>
		<input
			id="startTime"
			name="startTime"
			type="time"
			required
			value={values.startTime ?? ''}
			aria-invalid={fieldErrors.startTime ? 'true' : undefined}
			aria-describedby={errorId('startTime')}
		/>
		{@render fieldError('startTime')}
	</div>
	<div class="field">
		<label for="endTime">Bis *</label>
		<input
			id="endTime"
			name="endTime"
			type="time"
			required
			value={values.endTime ?? ''}
			aria-invalid={fieldErrors.endTime ? 'true' : undefined}
			aria-describedby={errorId('endTime')}
		/>
		{@render fieldError('endTime')}
	</div>
</div>

<p class="field-hint">
	Endet deine Feier nach Mitternacht? Einfach die Endzeit am Folgetag eintragen (z. B. 22:00 bis
	02:00).
</p>

<p class="quiet-hours">
	🌙 Ab 22 Uhr gilt im Haus Ruhezeit – feiern ist okay, aber bitte denkt drinnen wie draußen an die
	Nachbarn.
</p>

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
		<label for="room">Zimmer / Wohnung *</label>
		<input
			id="room"
			name="room"
			type="text"
			required
			maxlength="20"
			placeholder="z. B. 204"
			value={values.room ?? ''}
			aria-invalid={fieldErrors.room ? 'true' : undefined}
			aria-describedby={errorId('room')}
		/>
		{@render fieldError('room')}
	</div>
</div>

<div class="field">
	<label for="contact">Kontakt *</label>
	<input
		id="contact"
		name="contact"
		type="text"
		required
		maxlength="100"
		placeholder="Handynummer o. Ä. – falls es mal zu laut wird"
		value={values.contact ?? ''}
		aria-invalid={fieldErrors.contact ? 'true' : undefined}
		aria-describedby={errorId('contact')}
	/>
	{@render fieldError('contact')}
</div>

<div class="field toggle-field">
	<label class="toggle-label" for="isPublic">
		<input id="isPublic" name="isPublic" type="checkbox" checked={values.isPublic === 'on'} />
		<span>
			<strong>Öffentlich – andere dürfen dazukommen</strong>
			<small>
				Öffentlich heißt: Mitbewohner sind eingeladen, spontan vorbeizuschauen. Privat heißt: ihr
				bleibt unter euch (der Eintrag ist trotzdem für alle sichtbar).
			</small>
		</span>
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

	.field-row {
		display: grid;
		gap: var(--space-3);
	}

	@media (min-width: 480px) {
		.field-row {
			grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		}
	}

	.field-hint {
		font-size: var(--text-sm);
		color: var(--color-text-soft);
	}

	.quiet-hours {
		font-size: var(--text-sm);
		background: var(--color-accent-soft);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
	}

	.toggle-field .toggle-label {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
		font-weight: 400;
		font-size: var(--text-base);
		cursor: pointer;
	}

	.toggle-label input {
		width: 1.4rem;
		height: 1.4rem;
		margin-block-start: 0.15rem;
		accent-color: var(--color-accent);
		flex-shrink: 0;
	}

	.toggle-label small {
		display: block;
		color: var(--color-text-soft);
		margin-block-start: var(--space-1);
	}
</style>
