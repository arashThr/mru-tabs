# MRU Tab Switcher

Firefox-style "Ctrl+Tab" for Chrome. Chrome reserves the real Ctrl+Tab /
Ctrl+Shift+Tab shortcuts for its own next/previous-tab behavior, so this
extension uses **Ctrl + `** (backtick, next to Tab) instead:

- **Tap it quickly** (press Ctrl+`, release right away) → switches straight to
  the previously-used tab. Tap again → toggles back.
- **Hold Ctrl and tap `` ` `` repeatedly** (or use the Up/Down arrow keys) → a
  compact overlay lists a "🔍 Search tabs…" entry at the top followed by the
  last 9 other tabs in most-recently-used order (the tab you're currently on
  isn't listed), and moves the highlight through them, wrapping at the ends.
  Shift+`` ` `` or the Up arrow moves backwards.
- **Release Ctrl** while a tab is highlighted → switches to it.
- **Release Ctrl** while "🔍 Search tabs…" is highlighted → opens a search box.
  Type part of a tab's title to find it (searches all open tabs in the
  window, not just the last 10). Arrow keys move the selection, Enter
  switches, Escape cancels.

The MRU order updates every time you land on a tab, so the two most recent
tabs keep swapping with each quick tap, exactly like Firefox. Tabs opened in
the background (e.g. Ctrl+click a link) are inserted into the list right
after the tab you're on, in the order they were opened, so they're just below
your current tab without becoming active.

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
