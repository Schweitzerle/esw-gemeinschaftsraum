<script lang="ts">
	import { formatDayLong, formatDayMonth, formatTime } from '$lib/time';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface DayBooking {
		startsAt: number;
		endsAt: number;
		continuesFromPrevDay: boolean;
		continuesIntoNextDay: boolean;
	}

	function timeLabel(booking: DayBooking): string {
		const start = formatTime(booking.startsAt);
		const end = formatTime(booking.endsAt);
		if (booking.continuesFromPrevDay) return `noch bis ${end}`;
		if (booking.continuesIntoNextDay) return `${start} – ${end} (Folgetag)`;
		return `${start} – ${end}`;
	}

	const weekLabel = $derived(
		`${formatDayMonth(data.weekStartMs)} – ${formatDayMonth(data.weekEndMs)}`
	);
</script>

<svelte:head>
	<title>Belegungsplan – Gemeinschaftsraum</title>
</svelte:head>

<div class="week-header">
	<h1>Wer ist im Raum?</h1>
	<p class="week-label">Woche vom {weekLabel}</p>

	<nav class="week-nav" aria-label="Wochen-Navigation">
		<a class="button button-quiet" href="/?datum={data.prevDate}">‹ Zurück</a>
		<a class="button button-quiet" href="/?datum={data.today}">Heute</a>
		<a class="button button-quiet" href="/?datum={data.nextDate}">Weiter ›</a>
		<form method="get" action="/" class="week-jump">
			<label class="visually-hidden" for="datum">Zu Datum springen</label>
			<input type="date" id="datum" name="datum" value={data.date} />
			<button type="submit" class="button-quiet">Los</button>
		</form>
	</nav>
</div>

<div class="week">
	{#each data.days as day (day.date)}
		{@const isToday = day.date === data.today}
		<section class="day" class:today={isToday} aria-labelledby="tag-{day.date}">
			<h2 id="tag-{day.date}">
				{formatDayLong(day.startMs)}
				{#if isToday}<span class="today-badge">Heute</span>{/if}
			</h2>

			{#if day.bookings.length === 0}
				<p class="day-free">○ Frei – der Raum gehört dir</p>
			{:else}
				<ul class="day-bookings">
					{#each day.bookings as booking (`${booking.id}-${day.date}`)}
						<li>
							<a href="/eintrag/{booking.id}" class="booking-card">
								<span class="booking-time">{timeLabel(booking)}</span>
								<span class="booking-title">{booking.title}</span>
								<span class="booking-meta">
									<span>{booking.name}</span>
									<span class="badge" class:badge-public={booking.isPublic}>
										{booking.isPublic ? '● Öffentlich – komm dazu' : '🔒 Privat'}
									</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</div>

<style>
	.week-header {
		padding-block: var(--space-4) var(--space-6);
	}

	h1 {
		font-size: var(--text-hero);
	}

	.week-label {
		color: var(--color-text-soft);
		margin-block: var(--space-1) var(--space-4);
	}

	.week-nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
	}

	.week-jump {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		margin-inline-start: auto;
	}

	.week-jump input {
		width: auto;
	}

	.week {
		display: grid;
		gap: var(--space-3);
	}

	@media (min-width: 700px) {
		.week {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1100px) {
		.week {
			grid-template-columns: repeat(7, 1fr);
			gap: var(--space-2);
		}
	}

	.day {
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		display: grid;
		gap: var(--space-2);
		align-content: start;
	}

	.day.today {
		border-color: var(--color-accent);
		border-width: 2px;
		box-shadow: var(--shadow-card);
	}

	.day h2 {
		font-size: var(--text-base);
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
</style>
