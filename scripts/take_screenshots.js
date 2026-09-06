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

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // 1. Screenshot Login screen
  console.log('Capturing Login screen...');
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '00-login.png') });

  // Click login submit button (default pre-fills are admin / admin123)
  console.log('Logging in as Admin...');
  await page.click('button[type="submit"]');

  // Wait for header/navbar to appear
  await page.waitForSelector('header', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // 2. Shop Floor Wallboard (default view for admin)
  console.log('Capturing Shop Floor Wallboard...');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '01-shop-wallboard.png') });

  // 3. Machinery Registry
  console.log('Navigating to Machinery Registry...');
  const machineryBtn = page.locator('nav button').filter({ hasText: /(Equipment Registry|Machinery|Equipment|Maquinaria)/i }).first();
  await machineryBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '02-machinery-registry.png') });

  // 4. Work Orders
  console.log('Navigating to Work Orders...');
  const maintenanceDropdown = page.locator('nav button').filter({ hasText: /(Maintenance|Mantenimiento)/i }).first();
  await maintenanceDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('button').filter({ hasText: /(Work Orders|Órdenes de Trabajo)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '03-work-orders.png') });

  // 5. PM Schedules
  console.log('Navigating to PM Schedules...');
  await maintenanceDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('button').filter({ hasText: /(PM Schedules|Calendario PM)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '04-pm-schedules.png') });

  // 6. Parts Requests
  console.log('Navigating to Parts Requests...');
  const partsDropdown = page.locator('nav button').filter({ hasText: /(Parts & Supplies|Piezas y Repuestos)/i }).first();
  await partsDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('button').filter({ hasText: /(Parts Requests|Solicitudes de Piezas)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '05-parts-requests.png') });

  // 7. Parts Catalog / Inventory
  console.log('Navigating to Parts Inventory...');
  await partsDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('button').filter({ hasText: /(Parts Inventory|Parts Catalog|Catálogo de Repuestos)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '06-parts-catalog.png') });

  // 8. Plant Analytics
  console.log('Navigating to Plant Analytics...');
  const mgmtDropdown = page.locator('nav button').filter({ hasText: /(Management|Administración)/i }).first();
  await mgmtDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('button').filter({ hasText: /(Analytics & Reports|Plant Analytics|Analytics|Analítica de Planta)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '07-plant-analytics.png') });

  // 9. User Management & Scoping
  console.log('Navigating to User Management...');
  await mgmtDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('button').filter({ hasText: /(User Management|User Accounts|Users|Cuentas de Usuario)/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '08-user-management.png') });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
