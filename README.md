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







Quickly switch between most-recently-used tabs with Ctrl+`.

---

MRU Tab Switcher brings Firefox-style most-recently-used tab switching to Chrome.

Chrome reserves the real Ctrl+Tab / Ctrl+Shift+Tab shortcuts, so this extension uses **Ctrl + `** (the backtick key next to Tab) instead.

How it works:
• Quick tap Ctrl+` → instantly switch to the previously used tab. Tap again to toggle back.
• Hold Ctrl and press ` repeatedly (or use ↑/↓ arrows) → a compact overlay appears showing your last 9 tabs in most-recently-used order, plus a “🔍 Search tabs…” entry at the top.
• Release Ctrl on a highlighted tab to switch to it.
• Release Ctrl on “Search tabs…” to open a full search box that finds any open tab by title.

The MRU order updates every time you activate a tab, so the two most recent tabs keep swapping with each quick tap — just like Firefox. Tabs opened in the background are inserted right after the current tab so they stay easily reachable.

Simple, fast, and focused on the one thing it does best: switching tabs the way you expect.



I have moved from Firefox to Brave as my main browser. My main reason was that it has many of the base feature that I expect from a browser. While in Firefox I had to download an extension for that, Brave supports those out of the box. Also, Brave search and Leo has worked better comapred to DuckDuckGo for me.

There's only one thing to complain, and that's the tab switch: In Firefox, when I press `Ctrl+Tab` I get this clean cyclic tab switch feature that helps to easily move back and fourth between the tabs that I open. It is an MRU style cycle and I use that a lot. For example when I open multiple tabs from links on a page, by pressing Ctrl+Tab, I end up on the page I opened last. I press again, and I'm on my search page again.

The good news is that also get to move linearly between tabs by pressing Ctrl+PageUp and PageDown.

Now Brave also have "Cycle through the most recently used tabs with Ctrl-Tab", but by no means it's close to what Firefox provides: There is no preview and no it also mess up the PageUp/Down navigation.

This feature was so important for me that I started looking into the Brave code and I finally found the problem. I posted my finding in the issue that was related to this feature. Sadly, no progress on that, and to be honest, I'm not motivated enough to go and build Brave locally for such a relatively small problem.

So instead one evening I paired with Claude and created an extension: 