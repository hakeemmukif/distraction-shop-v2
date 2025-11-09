// Browser injection script for manual screenshot capture
// Injected automatically by monitor-routes.mjs
// Keyboard shortcut: Cmd+Shift+S (Mac) or Ctrl+Shift+S (Windows/Linux)

(function() {
  'use strict';

  const TRIGGER_URL = 'http://localhost:9876/trigger';

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();

      fetch(TRIGGER_URL, { method: 'POST' })
        .then(response => response.json())
        .then(() => {
          showToast('Screenshot captured', 'success');
        })
        .catch(err => {
          console.error('Screenshot trigger error:', err);
          showToast('Screenshot failed', 'error');
        });
    }
  });

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = `📸 ${message}`;

    const bgColor = type === 'success' ? '#10b981' : '#ef4444';

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
      animation: slideIn 0.3s ease;
      pointer-events: none;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  console.log('📸 Screenshot monitor active - Press Cmd+Shift+S to capture');
})();
