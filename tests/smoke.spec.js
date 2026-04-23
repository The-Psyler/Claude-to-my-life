const { test, expect } = require('@playwright/test');

const BASE = '/Claude-to-my-life/';

// Wipe IndexedDB + onboarding flags so every test starts from a clean slate
async function resetState(page) {
    await page.goto(BASE);
    await page.evaluate(async () => {
        await new Promise(resolve => {
            const req = indexedDB.deleteDatabase('CTML');
            req.onsuccess = resolve;
            req.onerror   = resolve;
        });
        localStorage.removeItem('ctml_welcomeDismissed');
        localStorage.removeItem('ctml_howtoDismissed');
        localStorage.removeItem('ctml_theme');
        localStorage.removeItem('ctml_lang');
    });
    // Skip onboarding screens so tests land directly on home
    await page.evaluate(() => {
        localStorage.setItem('ctml_welcomeDismissed', 'true');
        localStorage.setItem('ctml_howtoDismissed',   'true');
    });
    await page.reload();
}

// ─── 1. Onboarding flow ──────────────────────────────────────────────────────

test('welcome screen shows on first visit and chains into how-to', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(async () => {
        await new Promise(resolve => {
            const req = indexedDB.deleteDatabase('CTML');
            req.onsuccess = resolve; req.onerror = resolve;
        });
        localStorage.removeItem('ctml_welcomeDismissed');
        localStorage.removeItem('ctml_howtoDismissed');
    });
    await page.reload();

    await expect(page.locator('#screen-welcome')).toHaveClass(/active/);
    await page.click('button:has-text("Continue")');
    await expect(page.locator('#screen-howto')).toHaveClass(/active/);
    await page.click('button:has-text("Got it")');
    await expect(page.locator('#screen-home')).toHaveClass(/active/);
});

// ─── 2. Morning Boot ─────────────────────────────────────────────────────────

test('Morning Boot sets focus and awards karma', async ({ page }) => {
    await resetState(page);

    // Navigate to Morning via mode card
    await page.click('#mode-card-morning');
    await expect(page.locator('#screen-morning')).toHaveClass(/active/);

    await page.fill('#morning-focus-input', 'Write the first chapter');
    await page.click('button:has-text("Start the day")');

    // Home screen should show the focus pill
    await expect(page.locator('#screen-home')).toHaveClass(/active/);
    await expect(page.locator('#home-focus-title')).toHaveText('Write the first chapter');

    // Karma should have increased (+5)
    const karma = await page.locator('#karma-display').textContent();
    expect(parseInt(karma)).toBeGreaterThan(0);
});

// ─── 3. Capture ──────────────────────────────────────────────────────────────

test('Capture saves an idea to the vault', async ({ page }) => {
    await resetState(page);

    // Do Morning Boot first (required before capture counts)
    await page.click('#mode-card-morning');
    await page.fill('#morning-focus-input', 'Test focus');
    await page.click('button:has-text("Start the day")');

    // Navigate to Capture
    await page.click('div.mode-card >> nth=1'); // second mode card = Capture
    await expect(page.locator('#screen-capture')).toHaveClass(/active/);

    await page.fill('#idea-title', 'My first idea');
    await page.click('button:has-text("Save to Vault")');

    // Go to Vault and verify the idea is there
    await page.click('#nav-vault');
    await expect(page.locator('#vault-table-body')).toContainText('My first idea');
});

// ─── 4. Full daily loop + locked state after reload ──────────────────────────

test('closing the day locks UI — locked state persists after F5', async ({ page }) => {
    await resetState(page);

    // Morning Boot
    await page.click('#mode-card-morning');
    await page.fill('#morning-focus-input', 'Ship it');
    await page.click('button:has-text("Start the day")');

    // Evening Wrap
    await page.click('div.mode-card >> nth=3'); // fourth mode card = Evening
    await expect(page.locator('#screen-evening')).toHaveClass(/active/);
    await page.fill('#evening-reflection-textarea', 'Good day, shipped the thing.');
    await page.click('#close-day-btn');

    // Wait for close day to fully persist (toast fires after saveState completes)
    await expect(page.locator('.toast.show')).toBeVisible();

    // Navigate home — locked state must apply immediately (no reload needed to prove applyLockedState works)
    await page.evaluate(() => navigateTo('home'));
    await expect(page.locator('#home-day-closed')).toBeVisible();
    const opacityBefore = await page.locator('#mode-card-morning').evaluate(el => el.style.opacity);
    expect(parseFloat(opacityBefore)).toBeLessThan(1);

    // F5 — locked state must survive a full reload (the renderPlaybook crash fix)
    await page.reload();
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-locked'), { timeout: 10000 });
    await expect(page.locator('#home-day-closed')).toBeVisible();
    const opacityAfter = await page.locator('#mode-card-morning').evaluate(el => el.style.opacity);
    expect(parseFloat(opacityAfter)).toBeLessThan(1);
});

// ─── 5. Locked state blocks capture with a toast ─────────────────────────────

test('capturing while day is locked shows an error toast', async ({ page }) => {
    await resetState(page);

    // Morning Boot
    await page.click('#mode-card-morning');
    await page.fill('#morning-focus-input', 'Ship it');
    await page.click('button:has-text("Start the day")');

    // Close the day — wait for save to complete before reloading
    await page.click('div.mode-card >> nth=3');
    await page.fill('#evening-reflection-textarea', 'Done.');
    await page.click('#close-day-btn');
    await expect(page.locator('.toast.show')).toBeVisible();
    await page.reload();
    // Wait for data-locked attribute — confirms loadState completed with dayLocked=true
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-locked'), { timeout: 10000 });

    // Call saveIdea() directly — button has pointer-events:none from CSS when locked
    await page.evaluate(() => {
        document.getElementById('idea-title').value = 'Should not save';
    });
    await page.evaluate(() => saveIdea());

    await expect(page.locator('.toast.show')).toContainText('locked');
});

// ─── 6. Close Day blocked before first Morning Boot ──────────────────────────

test('Close Day button is disabled before any Morning Boot', async ({ page }) => {
    await resetState(page);

    await page.click('div.mode-card >> nth=3'); // Evening
    await expect(page.locator('#close-day-btn')).toBeDisabled();
});
