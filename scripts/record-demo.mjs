// Records a demo of the app, cuts out the time spent waiting for the agent, and makes a GIF.
// Start the app first with `npm run dev`, then run `npm run demo`. Needs ffmpeg on the PATH.

import { execFileSync } from 'node:child_process';
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL ?? 'http://localhost:4200';
const OUT_DIR = fileURLToPath(new URL('../docs/demo/', import.meta.url));
const VIEWPORT = { width: 1280, height: 800 };

const questions = [
  "What's the weather in Yerevan right now?",
  'Is this weekend good for hiking in Dilijan?',
  'Compare Yerevan, Gyumri and Jermuk for the next three days',
  'When is the best time for a walk around Lake Sevan tomorrow?',
  'How was July in Yerevan compared to usual?',
  'Show Gyumri on the dashboard',
];

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VIEWPORT, recordVideo: { dir: OUT_DIR, size: VIEWPORT } });
const page = await context.newPage();
const start = Date.now();
const now = () => (Date.now() - start) / 1000;

// Time ranges (in seconds of video) to cut out.
const cuts = [];

await page.goto(APP_URL);
await page.locator('.temperature').waitFor();
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
cuts.push([0, now() - 0.5]);
await page.waitForTimeout(1500);

for (const question of questions) {
  await page.getByLabel('Message').click();
  await page.keyboard.type(question, { delay: 35 });
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.getByLabel('Stop').waitFor();
  await recordWaiting();
  await page.waitForTimeout(2500);
}

await page.waitForTimeout(1000);
const end = now();
await context.close();
await browser.close();

const [video] = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.webm'));
await rename(OUT_DIR + video, OUT_DIR + 'raw.webm');
makeVideos(keepRanges(cuts, end));

/**
 * While the agent runs, the chat shows "Thinking…" or a card saying it is loading. Both end with "…".
 * We cut those stretches, keeping half a second so the viewer sees that something is happening.
 * Client tools chain several runs, so we wait until the agent has been idle for a moment.
 */
async function recordWaiting() {
  let waitingSince;
  let idleSince;
  for (;;) {
    const waiting = await page.evaluate(() =>
      [...document.querySelectorAll('app-assistant .messages p')].some((p) => p.textContent.trim().endsWith('…')),
    );
    const running = await page.getByLabel('Stop').isVisible();
    const t = now();

    if (waiting && waitingSince === undefined) waitingSince = t;
    if (!waiting && waitingSince !== undefined) {
      if (t - waitingSince > 0.8) cuts.push([waitingSince + 0.5, t - 0.2]);
      waitingSince = undefined;
    }

    idleSince = running || waiting ? undefined : (idleSince ?? t);
    if (idleSince !== undefined && t - idleSince > 1.5) return;
    await page.waitForTimeout(100);
  }
}

function keepRanges(cutRanges, total) {
  const keep = [];
  let from = 0;
  for (const [a, b] of cutRanges.sort((x, y) => x[0] - y[0])) {
    if (a > from) keep.push([from, a]);
    from = Math.max(from, b);
  }
  keep.push([from, total]);
  return keep.filter(([a, b]) => b - a > 0.05);
}

function makeVideos(keep) {
  const select = keep.map(([a, b]) => `between(t,${a.toFixed(2)},${b.toFixed(2)})`).join('+');
  const trim = `select='${select}',setpts=N/FRAME_RATE/TB`;
  const ffmpeg = (...args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

  ffmpeg('-i', OUT_DIR + 'raw.webm', '-vf', trim, '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', OUT_DIR + 'demo.mp4');
  ffmpeg(
    '-i', OUT_DIR + 'demo.mp4',
    '-vf', 'fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
    OUT_DIR + 'demo.gif',
  );

  const kept = keep.reduce((sum, [a, b]) => sum + b - a, 0);
  console.log(`Recorded ${end.toFixed(0)}s, kept ${kept.toFixed(0)}s. Wrote docs/demo/demo.mp4 and demo.gif`);
}
