<svelte:head>
	<title>Datenschutz – Gemeinschaftsraum</title>
</svelte:head>

<div class="privacy">
	<a href="/" class="back-link">‹ Zur Wochenübersicht</a>
	<h1>Datenschutz</h1>
	<p class="intro">
		Diese Seite ist ein privates, nicht-kommerzielles Tool für die Bewohner unseres Wohnheims. Kurz
		gesagt: Wir speichern nur, was du selbst einträgst – und löschen es automatisch wieder.
	</p>

	<h2>Welche Daten werden gespeichert?</h2>
	<p>
		Nur das, was du beim Eintragen selbst angibst: Titel/Anlass, Zeitraum, dein Name, deine
		Zimmer-/Wohnungsnummer, eine Kontaktmöglichkeit (z. B. Handynummer) und optional eine
		Beschreibung. Diese Angaben sind für alle sichtbar, die das Haus-Passwort kennen – also für die
		Bewohner des Hauses.
	</p>

	<h2>Wozu?</h2>
	<p>
		Damit alle sehen, wann der Gemeinschaftsraum belegt ist, und damit man dich erreichen kann,
		falls es z. B. zu laut wird. Das ist der einzige Zweck.
	</p>

	<h2>Wie lange?</h2>
	<p>
		Vergangene Einträge werden <strong>automatisch 30 Tage nach ihrem Ende gelöscht</strong>. Du
		kannst deinen Eintrag außerdem jederzeit selbst über deinen Bearbeitungs-Link löschen.
	</p>

	<h2>Cookies &amp; Tracking</h2>
	<p>
		Es gibt genau ein Cookie: die Anmeldung mit dem Haus-Passwort (gültig 180 Tage). Kein Tracking,
		keine Analyse-Tools, keine Werbung, keine externen Dienste – alle Schriften und Skripte kommen
		von diesem Server selbst.
	</p>

	<h2>Wer betreibt die Seite?</h2>
	<p>
		Ein Mitbewohner hostet die Seite privat auf seinem eigenen Server in eigener Verantwortung. Es
		gibt keine kommerziellen Interessen und keine Weitergabe von Daten an Dritte. Bei Fragen oder
		Löschwünschen melde dich einfach in der WhatsApp-Gruppe des Hauses.
	</p>
</div>

<style>
	.privacy {
		max-width: 40rem;
		margin-inline: auto;
		display: grid;
		gap: var(--space-3);
		padding-block-start: var(--space-4);
	}

	.back-link {
		font-size: var(--text-sm);
		font-weight: 700;
		justify-self: start;
	}

	h1 {
		font-size: var(--text-hero);
	}

	.intro {
		font-size: var(--text-lg);
		color: var(--color-text-soft);
	}

	h2 {
		font-size: var(--text-lg);
		margin-block-start: var(--space-3);
	}
</style>
