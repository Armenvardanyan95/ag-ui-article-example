// Takes screenshots of the running app for the article.
// Start the app first with `npm run dev`, then run `npm run screenshots`.

import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL ?? 'http://localhost:4200';
const OUT_DIR = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));

const questions = [
  ['weekend', 'Is this weekend good for a barbecue?'],
  ['run', 'When is the best time for a run tomorrow?'],
  ['history', 'How was August compared to usual?'],
  ['compare', 'Compare Yerevan and Tbilisi for the next three days'],
  ['next-month', 'What is the weather usually like here in early November?'],
  ['client-tools', 'Show me London on the dashboard, in Fahrenheit'],
];

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

await openApp();
await page.screenshot({ path: OUT_DIR + 'dashboard.png' });
console.log('dashboard.png');

for (const [name, question] of questions) {
  await openApp();
  await page.getByLabel('Message').fill(question);
  await page.getByLabel('Message').press('Enter');
  await page.getByLabel('Stop').waitFor({ state: 'visible', timeout: 10_000 });
  await waitUntilIdle();
  await page.screenshot({ path: OUT_DIR + `${name}.png` });
  console.log(`${name}.png`);
}

await browser.close();

// The stop button shows while the agent runs. Client tools chain several runs,
// so we wait until the send button has stayed visible for a few seconds.
async function waitUntilIdle() {
  for (;;) {
    await page.getByLabel('Send').waitFor({ state: 'visible', timeout: 120_000 });
    await page.waitForTimeout(3000);
    if (await page.getByLabel('Send').isVisible()) return;
  }
}

async function openApp() {
  await page.goto(APP_URL);
  await page.locator('.temperature').waitFor({ timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
}
