<script lang="ts">
	import { onMount } from 'svelte';
	import { monthGrid, monthLabel, shiftMonth, todayInBerlin } from '$lib/time';

	interface Props {
		id: string;
		name: string;
		value: string;
		/** Frühestes wählbares Datum (YYYY-MM-DD) */
		min: string;
		invalid?: boolean;
		describedby?: string;
	}

	let { id, name, value, min, invalid, describedby }: Props = $props();

	// Vor der Hydration (und ohne JS) bleibt das native Datumsfeld stehen
	let mounted = $state(false);
	onMount(() => (mounted = true));

	// Schreibbares $derived: folgt der Prop, lokale Auswahl überschreibt bis zur nächsten Prop-Änderung
	let selected = $derived(value);

	let open = $state(false);
	let viewDate = $state(todayInBerlin());
	let root = $state<HTMLElement>();

	const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	function germanLabel(date: string): string {
		if (!date) return 'Datum wählen';
		const [year, month, day] = date.split('-');
		return `${day}.${month}.${year}`;
	}

	function toggle(): void {
		viewDate = selected || todayInBerlin();
		open = !open;
	}

	function pick(date: string): void {
		selected = date;
		open = false;
	}

	function onDocumentClick(event: MouseEvent): void {
		if (open && root && !root.contains(event.target as Node)) {
			open = false;
		}
	}

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape' && open) {
			event.stopPropagation();
			open = false;
		}
	}
</script>

<svelte:document onclick={onDocumentClick} />

{#if mounted}
	<div class="date-field" bind:this={root}>
		<input type="hidden" {name} value={selected} />
		<button
			type="button"
			{id}
			class="date-button"
			class:invalid
			aria-haspopup="dialog"
			aria-expanded={open}
			aria-describedby={describedby}
			onclick={toggle}
		>
			<span>{germanLabel(selected)}</span>
			<span aria-hidden="true">📅</span>
		</button>

		{#if open}
			<div
				class="calendar"
				role="dialog"
				aria-label="Datum wählen"
				tabindex="-1"
				onkeydown={onKeydown}
			>
				<div class="calendar-header">
					<button
						type="button"
						class="cal-nav"
						onclick={() => (viewDate = shiftMonth(viewDate, -1))}
						aria-label="Voriger Monat">‹</button
					>
					<strong>{monthLabel(viewDate)}</strong>
					<button
						type="button"
						class="cal-nav"
						onclick={() => (viewDate = shiftMonth(viewDate, 1))}
						aria-label="Nächster Monat">›</button
					>
				</div>
				<div class="calendar-grid">
					{#each WEEKDAYS as weekday (weekday)}
						<span class="cal-weekday">{weekday}</span>
					{/each}
					{#each monthGrid(viewDate).flat() as day (day.date)}
						<button
							type="button"
							class="cal-day"
							class:cal-outside={!day.inMonth}
							class:cal-selected={day.date === selected}
							class:cal-today={day.date === todayInBerlin()}
							disabled={day.date < min}
							onclick={() => pick(day.date)}
						>
							{day.dayOfMonth}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{:else}
	<input
		type="date"
		{id}
		{name}
		required
		value={selected}
		{min}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedby}
	/>
{/if}

<style>
	.date-field {
		position: relative;
	}

	.date-button {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-2);
		min-height: 44px;
		padding: var(--space-2) var(--space-3);
		font: inherit;
		font-weight: 400;
		color: inherit;
		background: var(--color-surface-raised);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.date-button:hover {
		background: var(--color-surface-raised);
		border-color: var(--color-text-soft);
	}

	.date-button.invalid {
		border-color: var(--color-error);
	}

	.calendar {
		position: absolute;
		top: calc(100% + 6px);
		inset-inline-start: 0;
		z-index: 30;
		background: var(--color-surface-raised);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-raised);
		padding: var(--space-3);
		width: min(19rem, 88vw);
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		margin-block-end: var(--space-2);
	}

	.calendar-header strong {
		font-size: var(--text-sm);
	}

	.cal-nav {
		min-height: 36px;
		padding-inline: var(--space-3);
		background: transparent;
		color: var(--color-text);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.cal-nav:hover {
		background: var(--color-accent-soft);
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.cal-weekday {
		text-align: center;
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--color-text-soft);
		padding-block: var(--space-1);
	}

	.cal-day {
		min-height: 36px;
		padding: 0;
		background: transparent;
		color: var(--color-text);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
	}

	.cal-day:hover:not(:disabled) {
		background: var(--color-accent-soft);
	}

	.cal-day:disabled {
		color: var(--color-border);
		cursor: default;
	}

	.cal-outside {
		color: var(--color-text-soft);
		opacity: 0.6;
	}

	.cal-today {
		border: 1.5px solid var(--color-accent);
	}

	.cal-selected,
	.cal-selected:hover:not(:disabled) {
		background: var(--color-accent);
		color: var(--color-on-accent);
		font-weight: 800;
	}
</style>
