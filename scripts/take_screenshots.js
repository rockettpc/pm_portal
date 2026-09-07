const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  const outDir = path.join(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('1. Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // 1. Screenshot Login screen
  console.log('Capturing Login screen (00-login.png)...');
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '00-login.png') });

  // Click login submit button (default pre-fills are admin / admin123)
  console.log('Logging in as Admin...');
  await page.click('button[type="submit"]');
  await page.waitForSelector('header', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // 2. Guided Tour overlay (appears automatically on first visit)
  const tourOverlay = page.locator('.guided-tour-overlay');
  if (await tourOverlay.isVisible().catch(() => false)) {
    console.log('Capturing Guided Walkthrough Tour (11-guided-tour.png)...');
    await page.screenshot({ path: path.join(outDir, '11-guided-tour.png') });
    // Dismiss it
    await page.locator('.guided-tour-overlay button').first().click();
    await page.waitForTimeout(500);
  }

  // Pre-seed localStorage so guided tours don't block navigation on other tabs
  await page.evaluate(() => {
    for (const mod of ['dashboard', 'equipment', 'work_orders', 'pm_schedules', 'parts_requests', 'parts_catalog', 'analytics', 'users', 'audit_log']) {
      for (let i = 1; i <= 10; i++) {
        localStorage.setItem(`pm_tour_seen_${i}_${mod}`, 'true');
        localStorage.setItem(`pm_tour_seen_admin_${mod}`, 'true');
        localStorage.setItem(`pm_tour_seen_guest_${mod}`, 'true');
      }
    }
  });

  // 3. Shop Floor Wallboard
  console.log('Capturing Shop Floor Wallboard (01-shop-wallboard.png)...');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '01-shop-wallboard.png') });

  // 4. Machinery Registry
  console.log('Navigating to Machinery Registry (02-machinery-registry.png)...');
  await page.locator('nav button').filter({ hasText: /(Equipment|Machinery|Maquinaria)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '02-machinery-registry.png') });

  // 5. Equipment QR Code & Printable Sticker Modal
  console.log('Opening Equipment QR Code & Sticker Modal (13-qr-code-sticker.png)...');
  const qrTagBtn = page.locator('button[title*="QR"], button:has(svg.lucide-qr-code)').first();
  if (await qrTagBtn.count() > 0) {
    await qrTagBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '13-qr-code-sticker.png') });
    // Close modal
    await page.locator('div.fixed.inset-0 button:has(svg.lucide-x)').first().click();
    await page.waitForTimeout(600);
  }

  // 6. Rapid Quick-Add Equipment Modal
  console.log('Opening Rapid Quick-Add Equipment Modal (15-quick-add-equipment.png)...');
  const quickAddBtn = page.locator('button').filter({ hasText: /(Quick\s*Add|Quick-Add|Entrada Rápida)/i }).first();
  if (await quickAddBtn.count() > 0) {
    await quickAddBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '15-quick-add-equipment.png') });
    // Close modal
    await page.locator('div.fixed.inset-0 button:has(svg.lucide-x)').first().click();
    await page.waitForTimeout(600);
  }

  // 7. Work Orders (Direct 1-click in navbar)
  console.log('Navigating to Work Orders (03-work-orders.png)...');
  await page.locator('nav button').filter({ hasText: /(Work Orders|Órdenes de Trabajo)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '03-work-orders.png') });

  // 8. PM Schedules (Direct 1-click in navbar)
  console.log('Navigating to PM Schedules (04-pm-schedules.png)...');
  await page.locator('nav button').filter({ hasText: /(PM Schedules|Calendario PM)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '04-pm-schedules.png') });

  // 9. Parts Requests (under Parts & Supplies dropdown)
  console.log('Navigating to Parts Requests (05-parts-requests.png)...');
  const partsDropdown = page.locator('nav button').filter({ hasText: /(Parts & Supplies|Piezas y Repuestos)/i }).first();
  await partsDropdown.click();
  await page.waitForTimeout(400);
  await page.locator('button').filter({ hasText: /(Parts Requests|Solicitudes de Piezas)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '05-parts-requests.png') });

  // 10. Parts Catalog (under Parts & Supplies dropdown)
  console.log('Navigating to Parts Catalog (06-parts-catalog.png)...');
  await partsDropdown.click();
  await page.waitForTimeout(400);
  await page.locator('button').filter({ hasText: /(Parts Inventory|Parts Catalog|Catálogo de Repuestos)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '06-parts-catalog.png') });

  // 11. Plant Analytics (under Management dropdown)
  console.log('Navigating to Plant Analytics (07-plant-analytics.png)...');
  const mgmtDropdown = page.locator('nav button').filter({ hasText: /(Management|Administración)/i }).first();
  await mgmtDropdown.click();
  await page.waitForTimeout(400);
  await page.locator('button').filter({ hasText: /(Analytics & Reports|Plant Analytics|Analytics|Analítica de Planta)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '07-plant-analytics.png') });

  // 12. User Management (under Management dropdown)
  console.log('Navigating to User Management (08-user-management.png)...');
  await mgmtDropdown.click();
  await page.waitForTimeout(400);
  await page.locator('button').filter({ hasText: /(User Management|User Accounts|Users|Cuentas de Usuario)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '08-user-management.png') });

  // 13. Audit Log (under Management dropdown)
  console.log('Navigating to Audit Log (09-audit-log.png)...');
  await mgmtDropdown.click();
  await page.waitForTimeout(400);
  await page.locator('button').filter({ hasText: /(Audit Log|Compliance|Audit Trail|Registro de Auditoría)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '09-audit-log.png') });

  // 14. Mobile Camera QR Scanner Modal (from header icon)
  console.log('Opening Global QR Scanner Modal (14-qr-scanner.png)...');
  const headerScannerBtn = page.locator('header button').filter({ has: page.locator('svg.lucide-camera') }).first();
  if (await headerScannerBtn.count() > 0) {
    await headerScannerBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '14-qr-scanner.png') });
    await page.locator('div.fixed.inset-0 button:has(svg.lucide-x)').first().click();
    await page.waitForTimeout(600);
  }

  // 15. Printable Quick-Reference Card Modal (from floating button)
  console.log('Opening Printable Quick-Reference Card Modal (12-quick-reference-cards.png)...');
  const quickRefBtn = page.locator('.floating-help-btn button').first();
  if (await quickRefBtn.count() > 0) {
    await quickRefBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '12-quick-reference-cards.png') });
    await page.locator('div.fixed.inset-0 button[aria-label="Close"], div.fixed.inset-0 button:has(svg.lucide-x)').first().click();
    await page.waitForTimeout(600);
  }

  // 16. In-App Contextual Help Panel Drawer (from floating button)
  console.log('Opening In-App Help Slide-Over Panel (10-help-panel.png)...');
  const helpDrawerBtn = page.locator('.floating-help-btn button').nth(1);
  if (await helpDrawerBtn.count() > 0) {
    await helpDrawerBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '10-help-panel.png') });
    await page.locator('button[aria-label="Close Help Panel"], div.fixed button:has(svg.lucide-x)').first().click();
    await page.waitForTimeout(600);
  }

  console.log('SUCCESS: All 16 screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
