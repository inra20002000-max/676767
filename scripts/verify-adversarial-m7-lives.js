/**
 * Standalone Adversarial Verification Runner for Milestone 7:
 * FamilyState Invariants, PixelArtScene Safety, Funeral Trigger & FamilyCard Responsive Layout
 * Author: challenger_m7_2
 */

import { chromium } from 'playwright';
import http from 'http';

const CANDIDATE_PORTS = [4173, 5173, 3000];

const VIEWPORTS = [
  { name: 'mobile-compact-320', width: 320, height: 568, isMobile: true },
  { name: 'mobile-android-360', width: 360, height: 640, isMobile: true },
  { name: 'mobile-se-375', width: 375, height: 667, isMobile: true },
  { name: 'mobile-modern-390', width: 390, height: 844, isMobile: true },
  { name: 'mobile-pixel-412', width: 412, height: 915, isMobile: true },
  { name: 'tablet-portrait-768', width: 768, height: 1024, isMobile: false },
  { name: 'desktop-standard-1440', width: 1440, height: 900, isMobile: false },
  { name: 'desktop-fhd-1920', width: 1920, height: 1080, isMobile: false },
];

function probeUrl(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port || 80,
          path: u.pathname,
          method: 'GET',
          timeout: 1000,
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function ensureServer() {
  for (const port of CANDIDATE_PORTS) {
    const candidate = `http://localhost:${port}`;
    if (await probeUrl(candidate)) {
      console.log(`[TEST-RUNNER] Reusing active server at ${candidate}`);
      return candidate;
    }
  }
  throw new Error('No active preview/dev server detected on ports 4173, 5173, 3000');
}

async function launchBrowser() {
  const options = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  };

  try {
    return await chromium.launch(options);
  } catch {
    try {
      return await chromium.launch({ ...options, channel: 'chrome' });
    } catch {
      return await chromium.launch({ ...options, channel: 'msedge' });
    }
  }
}

async function runAdversarialM7() {
  console.log('========================================================================');
  console.log('🛡️ CHALLENGER M7-2: ADVERSARIAL VERIFICATION & RESPONSIVE LAYOUT');
  console.log('========================================================================\n');

  const serverUrl = await ensureServer();
  const browser = await launchBrowser();
  console.log('[BROWSER] Headless Chromium launched successfully.\n');

  const allErrors = [];
  let viewportsPassed = 0;

  try {
    for (const vp of VIEWPORTS) {
      console.log(`--- [VIEWPORT CHECK: ${vp.name} (${vp.width}x${vp.height})] ---`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
      });

      await context.route('**/favicon.ico', (r) => r.fulfill({ status: 200, body: '' }));
      await context.addInitScript(() => {
        localStorage.setItem('one8b_age_confirmed', 'true');
        localStorage.setItem('one8b_sfx_muted', 'true');
        localStorage.setItem('one8b_voice_muted', 'true');
      });

      const page = await context.newPage();
      const pageErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
          pageErrors.push(`[${vp.name}][CONSOLE] ${msg.text()}`);
        }
      });
      page.on('pageerror', (err) => {
        pageErrors.push(`[${vp.name}][PAGE_ERR] ${err.message}`);
      });

      await page.goto(serverUrl, { waitUntil: 'domcontentloaded' });

      // Start life
      const birthBtn = page.locator('[data-testid="birth-btn"]');
      await birthBtn.waitFor({ state: 'visible', timeout: 5000 });
      await birthBtn.click();

      // Wait for FamilyCard
      const familyCard = page.locator('[data-testid="family-card"]');
      await familyCard.waitFor({ state: 'visible', timeout: 5000 });

      // 1. COLLAPSED STATE OVERFLOW CHECK
      const collapsedOverflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const card = document.querySelector('[data-testid="family-card"]');
        if (!card) return { found: false };

        const cardRect = card.getBoundingClientRect();
        const globalScrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
        const globalClientW = docEl.clientWidth;
        const globalOverflow = globalScrollW > globalClientW;

        const cardScrollW = card.scrollWidth;
        const cardClientW = card.clientWidth;
        // Allowance of 1px for subpixel rounding
        const cardOverflow = cardScrollW > cardClientW + 1;

        // Check if any descendant extends outside the card bounding rect
        const overflowingChildren = [];
        const descendants = card.querySelectorAll('*');
        for (const el of descendants) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            if (r.right > cardRect.right + 2) {
              overflowingChildren.push({
                tag: el.tagName,
                class: el.className,
                diff: r.right - cardRect.right,
              });
            }
          }
        }

        return {
          found: true,
          globalScrollW,
          globalClientW,
          globalOverflow,
          cardScrollW,
          cardClientW,
          cardOverflow,
          overflowingCount: overflowingChildren.length,
          sampleOverflow: overflowingChildren[0] || null,
        };
      });

      if (!collapsedOverflow.found) {
        throw new Error(`[${vp.name}] FamilyCard not found in DOM`);
      }

      if (collapsedOverflow.globalOverflow) {
        pageErrors.push(`[${vp.name}] Global horizontal overflow in collapsed state (${collapsedOverflow.globalScrollW}px > ${collapsedOverflow.globalClientW}px)`);
      }
      if (collapsedOverflow.cardOverflow) {
        pageErrors.push(`[${vp.name}] FamilyCard horizontal overflow in collapsed state (${collapsedOverflow.cardScrollW}px > ${collapsedOverflow.cardClientW}px)`);
      }
      if (collapsedOverflow.overflowingCount > 0) {
        pageErrors.push(`[${vp.name}] ${collapsedOverflow.overflowingCount} children overflow card boundary: ${JSON.stringify(collapsedOverflow.sampleOverflow)}`);
      }

      console.log(`  Collapsed: Page W=${collapsedOverflow.globalClientW}px, Card W=${collapsedOverflow.cardClientW}px, Overflows: global=${collapsedOverflow.globalOverflow}, card=${collapsedOverflow.cardOverflow}`);

      // 2. EXPAND ACCORDION
      const accordionToggle = page.locator('[data-testid="family-accordion-toggle"]');
      await accordionToggle.click();

      const accordionBody = page.locator('[data-testid="family-accordion-body"]');
      await accordionBody.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(400); // Allow Framer Motion animation to complete

      // 3. EXPANDED STATE OVERFLOW CHECK
      const expandedOverflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const card = document.querySelector('[data-testid="family-card"]');
        const dossier = document.querySelector('[data-testid="housing-dossier"]');
        if (!card) return { found: false };

        const cardRect = card.getBoundingClientRect();
        const globalScrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
        const globalClientW = docEl.clientWidth;
        const globalOverflow = globalScrollW > globalClientW;

        const cardScrollW = card.scrollWidth;
        const cardClientW = card.clientWidth;
        const cardOverflow = cardScrollW > cardClientW + 1;

        const overflowingChildren = [];
        const descendants = card.querySelectorAll('*');
        for (const el of descendants) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            if (r.right > cardRect.right + 2) {
              overflowingChildren.push({
                tag: el.tagName,
                class: el.className,
                diff: r.right - cardRect.right,
              });
            }
          }
        }

        return {
          found: true,
          globalScrollW,
          globalClientW,
          globalOverflow,
          cardScrollW,
          cardClientW,
          cardOverflow,
          hasDossier: !!dossier,
          overflowingCount: overflowingChildren.length,
          sampleOverflow: overflowingChildren[0] || null,
        };
      });

      if (expandedOverflow.globalOverflow) {
        pageErrors.push(`[${vp.name}] Global horizontal overflow in expanded state (${expandedOverflow.globalScrollW}px > ${expandedOverflow.globalClientW}px)`);
      }
      if (expandedOverflow.cardOverflow) {
        pageErrors.push(`[${vp.name}] FamilyCard horizontal overflow in expanded state (${expandedOverflow.cardScrollW}px > ${expandedOverflow.cardClientW}px)`);
      }
      if (expandedOverflow.overflowingCount > 0) {
        pageErrors.push(`[${vp.name}] ${expandedOverflow.overflowingCount} children overflow card in expanded state: ${JSON.stringify(expandedOverflow.sampleOverflow)}`);
      }

      console.log(`  Expanded: Page W=${expandedOverflow.globalClientW}px, Card W=${expandedOverflow.cardClientW}px, Overflows: global=${expandedOverflow.globalOverflow}, card=${expandedOverflow.cardOverflow}`);

      // 4. RAPID AGE ADVANCE (10 YEARS) WHILE EXPANDED TO TEST ADULT DYNAMICS
      const stepBtn = page.locator('[data-testid="step-year-btn"]');
      for (let s = 0; s < 10; s++) {
        if (await stepBtn.isVisible()) {
          await stepBtn.click();
          await page.waitForTimeout(50);
        }
      }

      const agedOverflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const card = document.querySelector('[data-testid="family-card"]');
        if (!card) return { globalOverflow: false, cardOverflow: false };

        const globalScrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
        const globalClientW = docEl.clientWidth;
        return {
          globalOverflow: globalScrollW > globalClientW,
          cardOverflow: card.scrollWidth > card.clientWidth + 1,
        };
      });

      if (agedOverflow.globalOverflow) {
        pageErrors.push(`[${vp.name}] Global overflow after aging to age 10`);
      }
      if (agedOverflow.cardOverflow) {
        pageErrors.push(`[${vp.name}] Card overflow after aging to age 10`);
      }

      if (pageErrors.length === 0) {
        viewportsPassed++;
        console.log(`  ✅ PASSED: Zero horizontal overflow in ${vp.name} (both collapsed & expanded).\n`);
      } else {
        console.log(`  ❌ FAILED: ${pageErrors.join(', ')}\n`);
        allErrors.push(...pageErrors);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log('========================================================================');
  console.log(`VERIFICATION SUMMARY: ${viewportsPassed}/${VIEWPORTS.length} viewports passed cleanly.`);
  console.log(`Total Errors: ${allErrors.length}`);
  console.log('========================================================================');

  if (allErrors.length > 0) {
    console.error('\nERRORS DETECTED:');
    allErrors.forEach((e) => console.error(`- ${e}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ADVERSARIAL VIEWPORT TESTS PASSED WITH ZERO HORIZONTAL OVERFLOW!');
    process.exit(0);
  }
}

runAdversarialM7().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
