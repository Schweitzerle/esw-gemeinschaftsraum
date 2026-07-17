<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Fehler – Gemeinschaftsraum</title>
</svelte:head>

<div class="error-box">
	<h1>{page.status === 404 ? 'Seite nicht gefunden' : 'Da ist etwas schiefgelaufen'}</h1>
	<p>
		{page.status === 404
			? 'Diese Seite gibt es nicht (mehr). Vielleicht wurde der Eintrag gelöscht?'
			: 'Probier es gleich nochmal – wenn es nicht klappt, melde dich in der WhatsApp-Gruppe.'}
	</p>
	<a href="/" class="button">Zur Wochenübersicht</a>
</div>

<style>
	.error-box {
		max-width: 32rem;
		margin-inline: auto;
		text-align: center;
		padding-block: var(--space-section);
		display: grid;
		gap: var(--space-4);
		justify-items: center;
	}

	h1 {
		font-size: var(--text-xl);
	}
</style>
