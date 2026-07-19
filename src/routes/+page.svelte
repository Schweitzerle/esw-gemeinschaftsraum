<script lang="ts">
	import { getContext } from 'svelte';
	import { goto, preloadData, pushState } from '$app/navigation';
	import { page } from '$app/state';
	import DetailDialog from '$lib/components/DetailDialog.svelte';
	import { formatDayLong, formatTime } from '$lib/time';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const dialog = getContext<{ open: (date: string) => void }>('booking-dialog');

	const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	interface DayEntry {
		id: number;
		title: string;
		name: string;
		isPublic: boolean;
		openEnd: boolean;
		startsAt: number;
		endsAt: number;
		continuesFromPrevDay: boolean;
		continuesIntoNextDay: boolean;
	}

	const isPastSelected = $derived(data.selected < data.today);

	function timeLabel(entry: DayEntry): string {
		const start = formatTime(entry.startsAt);
		const end = formatTime(entry.endsAt);
		if (entry.openEnd) return `ab ${start} (offenes Ende)`;
		if (entry.continuesFromPrevDay) return `noch bis ${end}`;
		if (entry.continuesIntoNextDay) return `${start} – ${end} (Folgetag)`;
		return `${start} – ${end}`;
	}

	/** Freier Tag in der Zukunft: direkt den Eintragen-Dialog öffnen statt nur auszuwählen. */
	function onDayClick(event: MouseEvent, date: string, entryCount: number): void {
		if (entryCount === 0 && date >= data.today) {
			event.preventDefault();
			dialog.open(date);
		}
	}

	/** Eintrag-Details als Dialog statt Seitenwechsel (Shallow Routing). */
	async function openDetail(event: MouseEvent, href: string): Promise<void> {
		if (event.metaKey || event.ctrlKey || event.shiftKey) return;
		event.preventDefault();
		const result = await preloadData(href);
		if (result.type === 'loaded' && result.status === 200) {
			pushState(href, { detail: result.data as NonNullable<App.PageState['detail']> });
		} else {
			await goto(href);
		}
	}
</script>

<svelte:head>
	<title>Gemeinschaftsraum – Belegungsplan</title>
</svelte:head>

{#if data.now.current}
	{@const endLabel = data.now.current.openEnd
		? 'offenes Ende'
		: `noch bis ${formatTime(data.now.current.endsAt)} Uhr`}
	<a
		href="/eintrag/{data.now.current.id}"
		class="now-banner is-busy"
		onclick={(e) => openDetail(e, `/eintrag/${data.now.current?.id}`)}
	>
		{#if data.now.current.isPublic}
			<strong>🎉 Jetzt gerade: {data.now.current.title}</strong>
			<span>Öffentlich – komm vorbei! ({endLabel})</span>
		{:else}
			<strong>🔒 Jetzt gerade: {data.now.current.title}</strong>
			<span>Privat – {endLabel}.</span>
		{/if}
	</a>
{:else if data.now.next}
	<p class="now-banner is-free">
		<strong>○ Gerade frei</strong>
		<span>– bis {formatTime(data.now.next.startsAt)} Uhr, dann: „{data.now.next.title}".</span>
	</p>
{:else}
	<p class="now-banner is-free">
		<strong>○ Der Raum ist frei</strong>
		<span>– für heute ist nichts mehr eingetragen.</span>
	</p>
{/if}

<div class="month-header">
	<h1>{data.label}</h1>
	<nav class="month-nav" aria-label="Monats-Navigation">
		<a
			class="button button-quiet nav-arrow"
			href="/?tag={data.prevMonth}"
			aria-label="Voriger Monat">‹</a
		>
		<a class="button button-quiet" href="/?tag={data.today}">Heute</a>
		<a
			class="button button-quiet nav-arrow"
			href="/?tag={data.nextMonth}"
			aria-label="Nächster Monat">›</a
		>
	</nav>
</div>

<div class="month" role="grid" aria-label="Belegung {data.label}">
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
					href="/?tag={day.date}"
					data-sveltekit-noscroll
					class="month-day"
					class:outside={!day.inMonth}
					class:today={day.date === data.today}
					class:selected={day.date === data.selected}
					aria-current={day.date === data.selected ? 'date' : undefined}
					onclick={(e) => onDayClick(e, day.date, day.entries.length)}
				>
					<span class="day-number">{day.dayOfMonth}</span>
					<span class="day-entries">
						{#each day.entries.slice(0, 2) as entry (entry.id)}
							<span class="day-chip">{formatTime(entry.startsAt)} {entry.title}</span>
							<span class="day-dot" aria-hidden="true"></span>
						{/each}
						{#if day.entries.length > 2}
							<span class="day-chip day-chip-more">+{day.entries.length - 2} weitere</span>
							<span class="day-dot" aria-hidden="true"></span>
						{/if}
						{#if day.entries.length > 0}
							<span class="visually-hidden">
								{day.entries.length}
								{day.entries.length === 1 ? 'Eintrag' : 'Einträge'}
							</span>
						{/if}
					</span>
				</a>
			{/each}
		</div>
	{/each}
</div>

{#snippet bookingCard(entry: DayEntry)}
	<li>
		<a
			href="/eintrag/{entry.id}"
			class="booking-card"
			onclick={(e) => openDetail(e, `/eintrag/${entry.id}`)}
		>
			<span class="booking-time">{timeLabel(entry)}</span>
			<span class="booking-title">{entry.title}</span>
			<span class="booking-meta">
				<span>{entry.name}</span>
				<span class="badge" class:badge-public={entry.isPublic}>
					{entry.isPublic ? '● Öffentlich – komm dazu' : '🔒 Privat'}
				</span>
			</span>
		</a>
	</li>
{/snippet}

<section class="day-panel" aria-label="Tagesübersicht">
	<header>
		<h2>
			{formatDayLong(data.dayStartMs)}
			{#if data.selected === data.today}<span class="today-badge">Heute</span>{/if}
		</h2>
		{#if !isPastSelected}
			<a
				href="/neu?datum={data.selected}"
				class="button"
				onclick={(e) => {
					e.preventDefault();
					dialog.open(data.selected);
				}}
			>
				+ Eintragen
			</a>
		{/if}
	</header>

	{#if data.dayEntries.length === 0}
		<p class="day-free">
			{isPastSelected
				? '○ Hier war nichts eingetragen.'
				: '○ Frei – der Raum gehört dir. Tipp auf „+ Eintragen" und er ist deiner.'}
		</p>
	{:else}
		<ul class="day-bookings">
			{#each data.dayEntries as entry (entry.id)}
				{@render bookingCard(entry)}
			{/each}
		</ul>
	{/if}
</section>

{#if data.upcoming.length > 0}
	<section class="upcoming" aria-label="Nächste Tage">
		<h2>Weiter geht's</h2>
		{#each data.upcoming as day (day.date)}
			<div class="upcoming-day">
				<h3>{formatDayLong(day.dayStartMs)}</h3>
				<ul class="day-bookings">
					{#each day.entries as entry (entry.id)}
						{@render bookingCard(entry)}
					{/each}
				</ul>
			</div>
		{/each}
	</section>
{/if}

{#if page.state.detail}
	<DetailDialog booking={page.state.detail.booking} onclose={() => history.back()} />
{/if}

<style>
	.now-banner {
		display: block;
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-4);
		margin-block: var(--space-2) var(--space-4);
		text-decoration: none;
		font-size: var(--text-sm);
	}

	.now-banner strong {
		font-size: var(--text-base);
		margin-inline-end: var(--space-1);
	}

	.now-banner.is-busy {
		background: var(--color-accent-soft);
		color: var(--color-text);
		border-inline-start: 4px solid var(--color-accent);
		box-shadow: var(--shadow-card);
	}

	.now-banner.is-free {
		background: var(--color-free-soft);
		color: var(--color-free);
	}

	.now-banner.is-free span {
		color: var(--color-text-soft);
	}

	.month-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
		margin-block-end: var(--space-3);
	}

	h1 {
		font-size: var(--text-xl);
	}

	.month-nav {
		display: flex;
		gap: var(--space-2);
	}

	.nav-arrow {
		padding-inline: var(--space-4);
		font-size: var(--text-lg);
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
		min-height: 52px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: var(--space-1);
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
		transition: border-color var(--duration-fast) var(--ease-out);
		overflow: hidden;
	}

	.month-day:hover {
		border-color: var(--color-accent);
	}

	.month-day.outside {
		color: var(--color-text-soft);
		background: var(--color-bg);
		border-style: dashed;
	}

	.month-day.selected {
		background: var(--color-accent-soft);
		border-color: var(--color-accent);
	}

	.month-day.today .day-number {
		background: var(--color-accent);
		color: var(--color-on-accent);
		border-radius: 999px;
		font-weight: 800;
	}

	.day-number {
		font-size: var(--text-sm);
		line-height: 1.5;
		min-width: 1.6em;
		text-align: center;
	}

	.day-entries {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		gap: 3px;
		width: 100%;
	}

	/* Mobil: Punkte, ab Tablet: Chips mit Zeit + Titel */
	.day-chip {
		display: none;
	}

	.day-dot {
		width: 7px;
		height: 7px;
		border-radius: 999px;
		background: var(--color-accent);
	}

	@media (min-width: 760px) {
		.month-day {
			min-height: 84px;
			align-items: stretch;
		}

		.day-number {
			align-self: flex-start;
		}

		.day-entries {
			flex-direction: column;
			gap: 2px;
		}

		.day-chip {
			display: block;
			font-size: 0.72rem;
			font-weight: 700;
			background: var(--color-accent-soft);
			border-inline-start: 3px solid var(--color-accent);
			border-radius: 4px;
			padding: 1px 4px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			text-align: start;
		}

		.month-day.selected .day-chip {
			background: var(--color-surface);
		}

		.day-chip-more {
			background: none;
			border: none;
			color: var(--color-text-soft);
		}

		.day-dot {
			display: none;
		}
	}

	.day-panel {
		margin-block-start: var(--space-6);
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		display: grid;
		gap: var(--space-3);
	}

	.day-panel header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.day-panel h2 {
		font-size: var(--text-lg);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.today-badge {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 800;
		background: var(--color-accent);
		color: var(--color-on-accent);
		border-radius: 999px;
		padding: 0 var(--space-3);
	}

	.day-free {
		color: var(--color-free);
		background: var(--color-free-soft);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.day-bookings {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-2);
	}

	.booking-card {
		display: grid;
		gap: var(--space-1);
		background: var(--color-accent-soft);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
		color: var(--color-text);
		text-decoration: none;
		border-inline-start: 4px solid var(--color-accent);
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.booking-card:hover {
		transform: translateX(2px);
		box-shadow: var(--shadow-card);
	}

	.booking-time {
		font-size: var(--text-sm);
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.booking-title {
		font-weight: 700;
		line-height: 1.3;
	}

	.booking-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
		align-items: center;
		font-size: var(--text-sm);
		color: var(--color-text-soft);
	}

	.badge {
		font-weight: 700;
	}

	.badge-public {
		color: var(--color-free);
	}

	.upcoming {
		margin-block-start: var(--space-6);
		display: grid;
		gap: var(--space-4);
	}

	.upcoming > h2 {
		font-size: var(--text-lg);
	}

	.upcoming-day {
		display: grid;
		gap: var(--space-2);
	}

	.upcoming-day h3 {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-soft);
	}
</style>
