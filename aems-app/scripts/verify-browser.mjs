#!/usr/bin/env node
/**
 * Headless browser verification for deployment edge cases.
 * Usage: APP_HOSTNAME=myapp.local node scripts/verify-browser.mjs
 *
 * Outputs a JSON array of { id, description, pass, detail } to stdout.
 * Exits 0 if all checks pass, 1 if any fail.
 *
 * Requires: npx playwright install chromium --with-deps
 */

import { chromium } from 'playwright';

const hostname = process.env.APP_HOSTNAME;
if (!hostname) {
  console.error('Error: APP_HOSTNAME environment variable is required.');
  process.exit(2);
}

const baseUrl = `https://${hostname}`;
const results = [];

function pass(id, description, detail = '') {
  results.push({ id, description, pass: true, detail });
}

function fail(id, description, detail = '') {
  results.push({ id, description, pass: false, detail });
}

async function run() {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      // Do NOT set ignoreHTTPSErrors — we want cert failures to surface.
      args: process.env.PLAYWRIGHT_CHROMIUM_NO_SANDBOX === '1'
        ? ['--no-sandbox', '--disable-setuid-sandbox']
        : [],
    });
  } catch (err) {
    console.error(`Failed to launch Chromium: ${err.message}`);
    console.error('Run: npx playwright install chromium --with-deps');
    process.exit(2);
  }

  const context = await browser.newContext({
    ignoreHTTPSErrors: false,
  });

  const consoleErrors = [];
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // ── [EC-TLS] Page loads without TLS certificate error ─────────────────────
  let rootResponse;
  try {
    rootResponse = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    pass('EC-TLS', 'TLS certificate is trusted by system (no cert error)');
  } catch (err) {
    fail('EC-TLS', 'TLS certificate is trusted by system (no cert error)',
      `Navigation failed: ${err.message}. Check mkcert cert is installed in system trust store.`);
    // Cannot continue browser checks without a working TLS connection.
    await browser.close();
    console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  }

  // ── [EC-APP-LOAD] HTTP 200 with HTML body on / ────────────────────────────
  const status = rootResponse ? rootResponse.status() : 0;
  const bodyText = await page.content();
  if (status === 200 && bodyText.includes('<html')) {
    pass('EC-APP-LOAD', 'Root path (/) returns HTTP 200 with HTML body', `status=${status}`);
  } else {
    fail('EC-APP-LOAD', 'Root path (/) returns HTTP 200 with HTML body',
      `status=${status}, body starts with: ${bodyText.slice(0, 120)}`);
  }

  // ── [EC-SECURITY-HEADERS] Required security headers present ───────────────
  const headers = rootResponse ? rootResponse.headers() : {};
  const missingHeaders = [];

  if (!headers['strict-transport-security']) missingHeaders.push('Strict-Transport-Security');
  if (
    !headers['x-frame-options'] ||
    !headers['x-frame-options'].toUpperCase().includes('DENY')
  ) {
    missingHeaders.push('X-Frame-Options: DENY');
  }
  if (!headers['x-content-type-options']) missingHeaders.push('X-Content-Type-Options');

  if (missingHeaders.length === 0) {
    pass('EC-SECURITY-HEADERS', 'Security headers present (HSTS, X-Frame-Options, X-Content-Type-Options)');
  } else {
    fail('EC-SECURITY-HEADERS', 'Security headers present (HSTS, X-Frame-Options, X-Content-Type-Options)',
      `Missing or incorrect: ${missingHeaders.join(', ')}. Check Traefik security middleware labels on client service.`);
  }

  // ── [EC-COOKIE-ATTRS] Session cookie has Secure + correct Domain ──────────
  // Touch the auth endpoint to trigger session cookie creation.
  try {
    await page.goto(`${baseUrl}/authjs/signin`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (_) {
    // Non-fatal — we still attempt cookie inspection.
  }
  const cookies = await context.cookies();
  // Auth.js sets a csrf-token cookie unconditionally when the signin page is visited,
  // even before login. Session cookies only appear after a completed login flow.
  const authCookie = cookies.find(
    (c) =>
      c.name.toLowerCase().includes('session') ||
      c.name.toLowerCase().includes('authjs') ||
      c.name.toLowerCase().startsWith('next-auth') ||
      c.name.toLowerCase().includes('csrf')
  );

  if (!authCookie) {
    fail('EC-COOKIE-ATTRS', 'Auth cookie has Secure flag and correct Domain',
      'No auth/csrf cookie found after visiting /authjs/signin. Auth may not be initialised or the page returned an error.');
  } else {
    const cookieIssues = [];
    if (!authCookie.secure) cookieIssues.push('missing Secure flag');
    if (!authCookie.domain || !authCookie.domain.includes(hostname)) {
      cookieIssues.push(`Domain is "${authCookie.domain}", expected to contain "${hostname}"`);
    }
    if (cookieIssues.length === 0) {
      pass('EC-COOKIE-ATTRS', 'Auth cookie has Secure flag and correct Domain',
        `cookie=${authCookie.name}, domain=${authCookie.domain}`);
    } else {
      fail('EC-COOKIE-ATTRS', 'Auth cookie has Secure flag and correct Domain',
        `cookie=${authCookie.name}: ${cookieIssues.join('; ')}. Check APP_HOSTNAME is not localhost and server sets Domain on cookies.`);
    }
  }

  // ── [EC-AUTH-PAGE] /authjs/signin loads without 500 ──────────────────────
  let authResponse;
  try {
    authResponse = await page.goto(`${baseUrl}/authjs/signin`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    const authStatus = authResponse ? authResponse.status() : 0;
    if (authStatus < 500) {
      pass('EC-AUTH-PAGE', '/authjs/signin loads without server error', `status=${authStatus}`);
    } else {
      fail('EC-AUTH-PAGE', '/authjs/signin loads without server error',
        `Got HTTP ${authStatus}. Run: docker compose logs server`);
    }
  } catch (err) {
    fail('EC-AUTH-PAGE', '/authjs/signin loads without server error',
      `Navigation failed: ${err.message}`);
  }

  // ── [EC-NO-CONSOLE-ERRORS] No JS console errors on initial load ───────────
  // Navigate back to / with a fresh page to capture load-time errors cleanly.
  const freshPage = await context.newPage();
  const freshErrors = [];
  freshPage.on('console', (msg) => {
    if (msg.type() === 'error') freshErrors.push(msg.text());
  });
  try {
    await freshPage.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (_) {
    // Non-fatal — we still report whatever errors were captured.
  }
  await freshPage.close();

  if (freshErrors.length === 0) {
    pass('EC-NO-CONSOLE-ERRORS', 'No JS console errors on initial page load');
  } else {
    fail('EC-NO-CONSOLE-ERRORS', 'No JS console errors on initial page load',
      `${freshErrors.length} error(s): ${freshErrors.slice(0, 3).join(' | ')}`);
  }

  await browser.close();
}

run()
  .then(() => {
    console.log(JSON.stringify(results, null, 2));
    const anyFailed = results.some((r) => !r.pass);
    process.exit(anyFailed ? 1 : 0);
  })
  .catch((err) => {
    console.error(`Unexpected error in verify-browser: ${err.message}`);
    process.exit(2);
  });
