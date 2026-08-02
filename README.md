# MRU Tab Switcher

Firefox-style "Ctrl+Tab" for Chrome. Chrome reserves the real Ctrl+Tab /
Ctrl+Shift+Tab shortcuts for its own next/previous-tab behavior, so this
extension uses **Ctrl + `** (backtick, next to Tab) instead:

- **Tap it quickly** (press Ctrl+`, release right away) → switches straight to
  the previously-used tab. Tap again → toggles back.
- **Hold Ctrl and tap `` ` `` repeatedly** → a compact overlay lists the last
  10 tabs in most-recently-used order and moves the highlight back one tab
  per tap, without actually switching yet.
- **Add Shift** (Ctrl+Shift+`) while held → cycles the highlight backwards
  instead of forwards.
- **Release Ctrl** → switches to whichever tab is highlighted.

The MRU order updates every time you land on a tab, so the two most recent
tabs keep swapping with each quick tap, exactly like Firefox.

## Load it

1. Open `chrome://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select this folder.
4. Reload any tabs that were already open (content scripts only attach to new
   page loads).

## Known limitations (kept simple on purpose)

- Doesn't work on `chrome://` pages, the Chrome Web Store, or the PDF viewer —
  Chrome doesn't allow extension content scripts there.
- Only watches the top-level page, not content inside cross-origin iframes.
- The preview shows tab title/favicon, not a live screenshot.
