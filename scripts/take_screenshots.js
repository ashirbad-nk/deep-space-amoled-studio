const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8123;
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = '/home/ashirbad/.gemini/antigravity-cli/brain/2da4ec04-d301-4ff2-9e95-528b0136d9cf';

// Simple static file server
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(filePath).pipe(res);
});

async function main() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Server listening on http://localhost:${PORT}`);

  const browser = await chromium.launch({
    executablePath: '/home/ashirbad/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 }
  ];

  for (const vp of viewports) {
    console.log(`\nCapturing viewports for ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    // 1. Landing Page
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Wait for animations & thumbnails

    const scrollInfo = await page.evaluate(() => {
      const el = document.getElementById('screen-discovery');
      const body = document.body;
      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        screenDiscoveryScrollHeight: el ? el.scrollHeight : 0,
        screenDiscoveryClientHeight: el ? el.clientHeight : 0,
        bodyScrollHeight: body.scrollHeight,
        bodyClientHeight: body.clientHeight,
        hasVerticalScroll: el ? (el.scrollHeight > el.clientHeight) : false
      };
    });
    console.log(`  [Scroll Check] Viewport ${vp.width}x${vp.height} -> Discovery ScrollHeight: ${scrollInfo.screenDiscoveryScrollHeight}px, ClientHeight: ${scrollInfo.screenDiscoveryClientHeight}px, HasScroll: ${scrollInfo.hasVerticalScroll}`);

    const landingPath = path.join(OUTPUT_DIR, `screenshot_${vp.name}_landing.png`);
    await page.screenshot({ path: landingPath, fullPage: false });
    console.log(`✓ Saved landing screenshot: ${landingPath}`);

    // 2. Switch to Studio Screen
    await page.click('#btn-enter-studio');
    await page.waitForTimeout(600);

    // Ensure Step 1 (Color Grade & Look) drawer is active
    await page.evaluate(() => {
      const drawer = document.getElementById('drawer-grade');
      const tab = document.querySelector('.step-tab[data-drawer="drawer-grade"]');
      if (drawer && !drawer.classList.contains('active')) {
        drawer.classList.add('active');
      }
      if (tab) {
        tab.classList.add('active');
      }
      const topBar = document.querySelector('.top-bar');
      if (topBar) {
        const bottom = Math.round(topBar.getBoundingClientRect().bottom);
        document.documentElement.style.setProperty('--top-bar-bottom', `${bottom}px`);
      }
    });
    await page.waitForTimeout(400);

    const studioPath = path.join(OUTPUT_DIR, `screenshot_${vp.name}_studio_drawer.png`);
    await page.screenshot({ path: studioPath, fullPage: false });
    console.log(`✓ Saved studio drawer screenshot: ${studioPath}`);

    // Check geometry telemetry
    const topBarBox = await page.evaluate(() => {
      const tb = document.querySelector('.top-bar');
      const drawer = document.getElementById('drawer-grade');
      const drawerBody = drawer ? drawer.querySelector('.drawer-body') : null;
      const tbRect = tb ? tb.getBoundingClientRect() : null;
      const dRect = drawer ? drawer.getBoundingClientRect() : null;
      return {
        topBarBottom: tbRect ? Math.round(tbRect.bottom) : 0,
        drawerTop: dRect ? Math.round(dRect.top) : 0,
        overlap: dRect && tbRect ? (dRect.top < tbRect.bottom) : false,
        drawerBodyScrollHeight: drawerBody ? drawerBody.scrollHeight : 0,
        drawerBodyClientHeight: drawerBody ? drawerBody.clientHeight : 0,
        drawerHasScroll: drawerBody ? (drawerBody.scrollHeight > drawerBody.clientHeight) : false
      };
    });
    console.log(`  Top bar bottom: ${topBarBox.topBarBottom}px | Drawer top: ${topBarBox.drawerTop}px | Overlapping: ${topBarBox.overlap} | Drawer ScrollHeight: ${topBarBox.drawerBodyScrollHeight}px, ClientHeight: ${topBarBox.drawerBodyClientHeight}px, Drawer HasScroll: ${topBarBox.drawerHasScroll}`);

    await context.close();
  }

  await browser.close();
  server.close();
  console.log('\nAll screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error taking screenshots:', err);
  server.close();
  process.exit(1);
});
