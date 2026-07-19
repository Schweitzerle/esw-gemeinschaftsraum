import { chromium } from 'playwright';

const BASE = 'http://localhost:4189';
const OUT =
	'/tmp/claude-1000/-home-chweizerles-Documents-Stuff-WebDevProjects-ESW-Gemeinschaftsraum/a093beb3-fb21-4919-857e-d7af68d2899a/scratchpad';

function isoPlus(days) {
	const d = new Date(Date.now() + days * 86400000);
	return d.toISOString().slice(0, 10);
}

async function login(page) {
	await page.goto(`${BASE}/login`);
	await page.waitForSelector('body[data-hydrated]');
	await page.fill('#passwort', 'shot-pass');
	await page.click('button[type=submit]');
	await page.waitForURL(`${BASE}/`);
}

async function createViaNeu(page, { date, start, end, name, contact, title, isPublic }) {
	await page.goto(`${BASE}/neu?datum=${date}`);
	await page.waitForSelector('body[data-hydrated]');
	await page.fill('#title', title);
	await page.selectOption('#startTime', start);
	if (end) await page.selectOption('#endTime', end);
	await page.fill('#name', name);
	await page.fill('#contact', contact);
	if (isPublic) await page.check('#isPublic', { force: true });
	await page.click('main button[type=submit]');
	await page.waitForURL('**/erstellt?token=*');
}

const browser = await chromium.launch();

const seedCtx = await browser.newContext({ viewport: { width: 390, height: 900 } });
const seed = await seedCtx.newPage();
await login(seed);

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const startMinutes = now.getHours() * 60 + (now.getMinutes() < 30 ? 0 : 30);
const endMinutes = (startMinutes + 120) % (24 * 60);
const nowStart = `${pad(Math.floor(startMinutes / 60))}:${startMinutes % 60 === 30 ? '30' : '00'}`;
const nowEnd = `${pad(Math.floor(endMinutes / 60))}:${endMinutes % 60 === 30 ? '30' : '00'}`;

await createViaNeu(seed, { date: isoPlus(0), start: nowStart, end: nowEnd, name: 'Lena', contact: '0151 2345678', title: 'Spieleabend', isPublic: true });
await createViaNeu(seed, { date: isoPlus(1), start: '19:00', end: '22:00', name: 'Jonas', contact: '0151 9998887', title: 'Lerngruppe Statistik', isPublic: false });
await createViaNeu(seed, { date: isoPlus(1), start: '22:30', end: '01:00', name: 'Kim', contact: '0151 3332221', title: 'Absacker', isPublic: true });
await createViaNeu(seed, { date: isoPlus(2), start: '18:30', end: '23:00', name: 'Mira', contact: '0170 1112223', title: 'Geburtstagsfeier', isPublic: true });
await createViaNeu(seed, { date: isoPlus(5), start: '20:00', end: '', name: 'Ben', contact: '0151 4443332', title: 'Filmabend', isPublic: true });
await createViaNeu(seed, { date: isoPlus(6), start: '10:00', end: '12:00', name: 'Sophie', contact: '0151 7778889', title: 'Brunch', isPublic: false });
await seedCtx.close();

async function freshState() {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await login(page);
	const state = await ctx.storageState();
	await ctx.close();
	return state;
}
const state = await freshState();

async function shootHome(theme) {
	const ctx = await browser.newContext({ viewport: { width: 390, height: 1500 }, colorScheme: theme, storageState: state });
	const page = await ctx.newPage();
	await page.goto(`${BASE}/?tag=${isoPlus(0)}`);
	await page.waitForSelector('body[data-hydrated]');
	await page.waitForTimeout(300);
	await page.screenshot({ path: `${OUT}/agenda-${theme}.png`, fullPage: true });
	await ctx.close();
}

await shootHome('light');
await shootHome('dark');
await browser.close();
console.log('done');
