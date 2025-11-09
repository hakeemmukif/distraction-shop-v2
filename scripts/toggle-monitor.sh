#!/bin/bash

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCREENSHOTS_DIR="$PROJECT_ROOT/.screenshots"
MONITOR_SCRIPT="$PROJECT_ROOT/scripts/monitor-routes.mjs"

case "$1" in
  start)
    if pgrep -f "monitor-routes.mjs" > /dev/null; then
      echo "⚠️  Monitor is already running"
      exit 1
    fi

    echo "🚀 Starting route monitor..."
    node "$MONITOR_SCRIPT" &

    sleep 2

    if pgrep -f "monitor-routes.mjs" > /dev/null; then
      echo "✅ Monitor started successfully"
      echo "📸 Press Cmd+Shift+S in browser to capture screenshots"
    else
      echo "❌ Failed to start monitor"
      echo "💡 Make sure your dev server is running: npm run dev"
      exit 1
    fi
    ;;

  stop)
    if ! pgrep -f "monitor-routes.mjs" > /dev/null; then
      echo "⚠️  Monitor is not running"
    else
      echo "🛑 Stopping monitor..."
      pkill -f "monitor-routes.mjs"
      sleep 1

      if [ -d "$SCREENSHOTS_DIR" ]; then
        rm -rf "${SCREENSHOTS_DIR}"/*
        echo "🗑️  Screenshots cleaned"
      fi

      echo "✅ Monitor stopped"
    fi
    ;;

  status)
    if pgrep -f "monitor-routes.mjs" > /dev/null; then
      echo "✅ Monitor is RUNNING"

      if [ -d "$SCREENSHOTS_DIR" ]; then
        screenshot_count=$(find "$SCREENSHOTS_DIR" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$screenshot_count" -gt 0 ]; then
          echo "📸 Screenshots captured: $screenshot_count"
          echo "📁 Location: $SCREENSHOTS_DIR"

          if [ -f "$SCREENSHOTS_DIR/latest.png" ]; then
            size=$(du -h "$SCREENSHOTS_DIR/latest.png" | cut -f1)
            echo "📄 Latest screenshot: $size"
          fi
        else
          echo "📸 No screenshots yet"
        fi
      fi
    else
      echo "❌ Monitor is NOT running"
      echo "💡 Start it with: npm run monitor:start"
    fi
    ;;

  clean)
    if [ -d "$SCREENSHOTS_DIR" ]; then
      rm -rf "${SCREENSHOTS_DIR}"/*
      echo "🗑️  All screenshots deleted"
    else
      echo "✅ No screenshots to clean"
    fi
    ;;

  *)
    echo "Usage: $0 {start|stop|status|clean}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the route monitoring system"
    echo "  stop    - Stop monitoring and clean screenshots"
    echo "  status  - Check if monitor is running"
    echo "  clean   - Delete all screenshots"
    echo ""
    echo "Or use npm scripts:"
    echo "  npm run monitor:start"
    echo "  npm run monitor:stop"
    echo "  npm run monitor:status"
    exit 1
    ;;
esac
