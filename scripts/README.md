# Route Monitoring System

Intelligent screenshot capture system for automated frontend visibility with Claude Code.

## Quick Start

1. Start your dev server:
```bash
npm run dev
```

2. In a separate terminal, start the monitor:
```bash
npm run monitor:start
```

3. Browse your website normally in any browser

4. Press **Cmd+Shift+S** (Mac) or **Ctrl+Shift+S** (Windows) when you want Claude to see the current state

5. Ask Claude to analyze: "Claude, check the latest screenshot"

## How It Works

### Auto-Capture
- Route changes (page navigation)
- Initial page load
- URL changes

### Manual Capture
- **Keyboard shortcut**: Cmd+Shift+S (Mac) or Ctrl+Shift+S (Windows/Linux)
- Works anywhere on the page
- Captures: modals, dropdowns, form states, loading states, hover effects, animations

### Smart Detection
- Only saves screenshots if visual state changed (>5% difference)
- Prevents duplicate/identical screenshots
- Uses image hashing for comparison
- Saves disk space and keeps history relevant

## Commands

```bash
npm run monitor:start   # Start monitoring
npm run monitor:stop    # Stop and clean screenshots
npm run monitor:status  # Check running status
npm run monitor:clean   # Delete all screenshots
```

## File Structure

```
.screenshots/
├── latest.png                          # Always current view
└── history/
    ├── shop_1729750234_route-change.png
    ├── shop_1729750298_manual-trigger.png
    └── products-123_1729750310_manual-trigger.png
```

## Screenshot Naming Convention

Format: `{route}_{timestamp}_{action}.png`

- **route**: URL path (e.g., `shop`, `products-123`, `root`)
- **timestamp**: Unix timestamp in milliseconds
- **action**:
  - `route-change` - Auto-captured on navigation
  - `manual-trigger` - Captured via keyboard shortcut
  - `initial-load` - First capture when monitor starts

## Features

### Session-Based Cleanup
- All screenshots deleted when monitor stops
- No disk bloat
- Fresh start each session

### Idle Detection
- Auto-stops after 10 minutes of no activity
- Saves system resources
- Prevents forgotten background processes

### Visual Feedback
- Green toast notification when screenshot captured
- Console logs in monitor terminal
- Status command shows capture count

## Usage with Claude

### Example Workflow

1. You navigate to /shop page
2. Click "Add to Cart" button → modal opens
3. Press **Cmd+Shift+S** to capture modal state
4. Tell Claude: "check the cart modal styling"
5. Claude reads `.screenshots/latest.png` and sees the modal
6. Claude provides feedback on styling, layout, etc.

### Best Practices

- Only start monitor when working on frontend
- Stop monitor when working on backend (saves resources)
- Use manual trigger (Cmd+Shift+S) for specific states
- Ask Claude to check screenshots when you need feedback

## Technical Details

### Requirements
- Node.js (already installed)
- Playwright (installed automatically)
- Next.js dev server running on localhost:3000

### How Screenshot Capture Works

1. **Playwright headless browser**: Connects to localhost:3000
2. **Route detection**: Monitors window.location and Next.js router
3. **Trigger server**: HTTP server on port 9876 for keyboard shortcuts
4. **Script injection**: Injects keyboard listener into browser
5. **Image comparison**: Uses SHA-256 hashing to detect visual changes
6. **Smart saving**: Only saves if screenshot differs from previous

### Ports Used
- **3000**: Your Next.js dev server
- **9876**: Trigger server for manual captures

## Troubleshooting

### "Failed to start monitoring"
- Make sure dev server is running: `npm run dev`
- Check if port 3000 is available

### "Monitor is already running"
- Stop existing monitor: `npm run monitor:stop`
- Or check status: `npm run monitor:status`

### Keyboard shortcut not working
- Make sure monitor is running
- Check browser console for errors
- Try refreshing the page

### Screenshots not capturing
- Check monitor terminal for errors
- Verify trigger server is running (port 9876)
- Look for network errors in browser console

## Advanced Usage

### Custom Port
Edit `scripts/monitor-routes.mjs` line 16:
```javascript
const DEV_SERVER_URL = 'http://localhost:YOUR_PORT';
```

### Adjust Idle Timeout
Edit `scripts/monitor-routes.mjs` line 22:
```javascript
const IDLE_TIMEOUT = 20 * 60 * 1000; // 20 minutes
```

### Change Screenshot Quality
Edit the `captureScreenshot` function in `monitor-routes.mjs`:
```javascript
await page.screenshot({
  path: tempPath,
  fullPage: true,
  quality: 90 // JPEG quality (if using JPEG)
});
```

## Integration with Claude Code

Claude can automatically read screenshots from `.screenshots/latest.png` when you ask questions like:

- "Check the homepage styling"
- "Is the modal centered correctly?"
- "Review the form validation errors"
- "Analyze the loading state"

The monitor system gives Claude visual context without manual screenshot sending.
