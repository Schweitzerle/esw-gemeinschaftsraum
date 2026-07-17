<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
</script>

<svelte:head>
	<title>Monatsübersicht – Gemeinschaftsraum</title>
</svelte:head>

<div class="month-header">
	<h1>{data.label}</h1>
	<nav class="month-nav" aria-label="Monats-Navigation">
		<a class="button button-quiet" href="/monat?datum={data.prevDate}">‹ Zurück</a>
		<a class="button button-quiet" href="/monat?datum={data.today}">Heute</a>
		<a class="button button-quiet" href="/monat?datum={data.nextDate}">Weiter ›</a>
		<a class="button button-quiet" href="/?datum={data.date}">Wochenansicht</a>
	</nav>
</div>

<div class="month" role="grid" aria-label="Monatsübersicht {data.label}">
	<div class="month-row weekdays" role="row">
		{#each WEEKDAYS as day (day)}
			<span role="columnheader">{day}</span>
		{/each}
	</div>
	{#each data.weeks as week, i (i)}
		<div class="month-row" role="row">
			{#each week as day (day.date)}
				<a
					role="gridcell"
					href="/?datum={day.date}"
					class="month-day"
					class:outside={!day.inMonth}
					class:today={day.date === data.today}
					class:busy={day.count > 0}
				>
					<span class="day-number">{day.dayOfMonth}</span>
					{#if day.count > 0}
						<span class="day-count">
							{day.count}
							<span class="visually-hidden">
								{day.count === 1 ? 'Eintrag' : 'Einträge'}
							</span>
						</span>
					{/if}
				</a>
			{/each}
		</div>
	{/each}
</div>

<p class="month-hint">Tag antippen, um die Woche mit Details zu sehen.</p>

<style>
	.month-header {
		padding-block: var(--space-4) var(--space-6);
		display: grid;
		gap: var(--space-4);
	}

	h1 {
		font-size: var(--text-hero);
	}

	.month-nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.month {
		display: grid;
		gap: var(--space-1);
	}

	.month-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--space-1);
	}

	.weekdays span {
		text-align: center;
		font-size: var(--text-sm);
		font-weight: 800;
		color: var(--color-text-soft);
		padding-block: var(--space-1);
	}

	.month-day {
		min-height: 56px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
	}

	.month-day:hover {
		border-color: var(--color-accent);
	}

	.month-day.outside {
		color: var(--color-text-soft);
		background: var(--color-bg);
		border-style: dashed;
	}

	.month-day.today {
		border-color: var(--color-accent);
		border-width: 2px;
		font-weight: 800;
	}

	.month-day.busy {
		background: var(--color-accent-soft);
	}

	.day-number {
		font-size: var(--text-sm);
	}

	.day-count {
		font-size: 0.7rem;
		font-weight: 800;
		background: var(--color-accent);
		color: var(--color-on-accent);
		border-radius: 999px;
		min-width: 1.2rem;
		text-align: center;
		padding-inline: 0.25rem;
	}

	.month-hint {
		margin-block-start: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-soft);
	}
</style>
