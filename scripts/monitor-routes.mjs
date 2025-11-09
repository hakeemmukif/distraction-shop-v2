#!/usr/bin/env node

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const screenshotsDir = join(projectRoot, '.screenshots');
const historyDir = join(screenshotsDir, 'history');
const latestPath = join(screenshotsDir, 'latest.png');

const DEV_SERVER_URL = 'http://localhost:3000';
const WS_PORT = 9876;

let browser = null;
let page = null;
let lastScreenshotHash = null;
let lastActivityTime = Date.now();
let currentRoute = '/';
let wsServer = null;

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

console.log('🚀 Starting route monitoring system...');
console.log(`📸 Screenshots will be saved to: ${screenshotsDir}`);
console.log('⌨️  Press Cmd+Shift+S in browser to manually capture\n');

async function computeImageHash(imagePath) {
  if (!existsSync(imagePath)) return null;
  const imageBuffer = readFileSync(imagePath);
  return crypto.createHash('sha256').update(imageBuffer).digest('hex');
}

async function captureScreenshot(action = 'route-change') {
  try {
    const timestamp = Date.now();
    const tempPath = join(screenshotsDir, `temp_${timestamp}.png`);

    await page.screenshot({ path: tempPath, fullPage: true });

    const newHash = await computeImageHash(tempPath);

    if (lastScreenshotHash && newHash === lastScreenshotHash) {
      console.log('⏭️  Screenshot identical to previous, skipping save');
      unlinkSync(tempPath);
      return false;
    }

    const routeName = currentRoute.replace(/^\//, '').replace(/\//g, '-') || 'root';
    const historyFilename = `${routeName}_${timestamp}_${action}.png`;
    const historyPath = join(historyDir, historyFilename);

    writeFileSync(latestPath, readFileSync(tempPath));
    writeFileSync(historyPath, readFileSync(tempPath));
    unlinkSync(tempPath);

    lastScreenshotHash = newHash;
    lastActivityTime = Date.now();

    const actionEmoji = action === 'manual-trigger' ? '👆' : action === 'route-change' ? '🔄' : '📄';
    console.log(`${actionEmoji} Captured: ${currentRoute} (${action}) at ${new Date(timestamp).toLocaleTimeString()}`);

    return true;
  } catch (error) {
    console.error('❌ Screenshot error:', error.message);
    return false;
  }
}

async function detectRouteChange() {
  try {
    const newRoute = await page.evaluate(() => window.location.pathname);
    if (newRoute !== currentRoute) {
      const oldRoute = currentRoute;
      currentRoute = newRoute;
      console.log(`🧭 Route changed: ${oldRoute} → ${currentRoute}`);
      await new Promise(resolve => setTimeout(resolve, 300));
      await captureScreenshot('route-change');
    }
  } catch (error) {
    console.error('Route detection error:', error.message);
  }
}

function startWebSocketServer() {
  wsServer = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/trigger') {
      console.log('📨 Manual capture triggered from browser');
      captureScreenshot('manual-trigger').then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Screenshot captured' }));
      });
    } else if (req.method === 'GET' && req.url === '/inject.js') {
      const injectScript = readFileSync(join(__dirname, 'browser-inject.js'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(injectScript);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  wsServer.listen(WS_PORT, () => {
    console.log(`🔌 Trigger server listening on http://localhost:${WS_PORT}`);
  });
}

function checkIdleTimeout() {
  const idleTime = Date.now() - lastActivityTime;
  if (idleTime > IDLE_TIMEOUT) {
    console.log('\n⏰ Idle timeout reached (10 minutes), stopping monitor...');
    cleanup();
    process.exit(0);
  }
}

async function injectCaptureScript() {
  try {
    await page.addInitScript(() => {
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
          e.preventDefault();
          fetch('http://localhost:9876/trigger', { method: 'POST' })
            .then(() => {
              const toast = document.createElement('div');
              toast.textContent = '📸 Screenshot captured';
              toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 24px;border-radius:8px;z-index:999999;font-family:system-ui;font-size:14px;box-shadow:0 4px 6px rgba(0,0,0,0.1);animation:slideIn 0.3s ease;';
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 2000);
            })
            .catch(err => console.error('Trigger error:', err));
        }
      });

      const style = document.createElement('style');
      style.textContent = '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
      document.head.appendChild(style);
    });
  } catch (error) {
    console.error('Script injection error:', error.message);
  }
}

async function startMonitoring() {
  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });

    page = await browser.newPage({
      viewport: { width: 1920, height: 1080 }
    });

    await injectCaptureScript();

    console.log(`🔗 Navigating to ${DEV_SERVER_URL}...`);
    await page.goto(DEV_SERVER_URL, { waitUntil: 'networkidle' });

    currentRoute = await page.evaluate(() => window.location.pathname);
    console.log(`✅ Connected to ${currentRoute}\n`);

    await captureScreenshot('initial-load');

    page.on('framenavigated', async () => {
      await detectRouteChange();
    });

    setInterval(detectRouteChange, 2000);

    setInterval(checkIdleTimeout, 30000);

    startWebSocketServer();

  } catch (error) {
    console.error('❌ Failed to start monitoring:', error.message);

    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.error('\n⚠️  Is your dev server running? Start it with: npm run dev\n');
    }

    cleanup();
    process.exit(1);
  }
}

function cleanup() {
  console.log('\n🧹 Cleaning up...');

  if (wsServer) {
    wsServer.close();
    console.log('🔌 Trigger server stopped');
  }

  if (browser) {
    browser.close().then(() => {
      console.log('🌐 Browser closed');
    });
  }

  try {
    const files = readdirSync(screenshotsDir);
    files.forEach(file => {
      const filePath = join(screenshotsDir, file);
      if (file.endsWith('.png')) {
        unlinkSync(filePath);
      }
    });

    const historyFiles = readdirSync(historyDir);
    historyFiles.forEach(file => {
      unlinkSync(join(historyDir, file));
    });

    console.log('🗑️  Screenshots cleaned (session-based)');
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping monitor...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught error:', error.message);
  cleanup();
  process.exit(1);
});

startMonitoring();
