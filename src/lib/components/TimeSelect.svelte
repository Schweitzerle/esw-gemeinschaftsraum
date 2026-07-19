<script lang="ts">
	interface Props {
		id: string;
		name: string;
		value: string;
		/** true = leere Auswahl erlaubt („offenes Ende") */
		allowEmpty?: boolean;
		emptyLabel?: string;
		invalid?: boolean;
		describedby?: string;
	}

	let {
		id,
		name,
		value = $bindable(),
		allowEmpty = false,
		emptyLabel = 'Offenes Ende',
		invalid,
		describedby
	}: Props = $props();

	const STEP_TIMES: string[] = [];
	for (let hour = 0; hour < 24; hour++) {
		for (const minute of ['00', '30']) {
			STEP_TIMES.push(`${String(hour).padStart(2, '0')}:${minute}`);
		}
	}

	// Vorhandene Einträge können krumme Zeiten haben — die eigene Zeit mit anbieten
	const options = $derived(
		value && !STEP_TIMES.includes(value) ? [...STEP_TIMES, value].sort() : STEP_TIMES
	);
</script>

<select
	{id}
	{name}
	required={!allowEmpty}
	bind:value
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedby}
>
	{#if allowEmpty}
		<option value="">{emptyLabel}</option>
	{:else if !value}
		<option value="" disabled>– wählen –</option>
	{/if}
	{#each options as time (time)}
		<option value={time}>{time} Uhr</option>
	{/each}
</select>

<style>
	select {
		width: 100%;
		min-height: 44px;
		padding: var(--space-2) var(--space-3);
		font: inherit;
		color: inherit;
		background: var(--color-surface-raised);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	select:focus-visible {
		border-color: var(--color-focus);
		outline-offset: 0;
	}
</style>
