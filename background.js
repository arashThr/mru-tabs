// Background service worker: keeps a most-recently-used (MRU) tab order per window.
//
// State is kept in memory (fast) and mirrored to chrome.storage.session so it
// survives the service worker being unloaded (MV3 workers stop after ~30s idle).

const MAX_ITEMS = 10; // how many recent tabs to show in the switcher

let mru = new Map(); // windowId -> [tabId, ...] most-recent-first
const hasSessionStorage = !!(chrome.storage && chrome.storage.session);
const ready = load().catch((err) => {
  console.error("[mru-tab] failed to initialize:", err);
});

function ensureWindow(windowId) {
  if (!mru.has(windowId)) mru.set(windowId, []);
  return mru.get(windowId);
}

function touchTab(windowId, tabId) {
  const list = ensureWindow(windowId);
  const idx = list.indexOf(tabId);
  if (idx !== -1) list.splice(idx, 1);
  list.unshift(tabId);
}

function removeTab(tabId) {
  for (const list of mru.values()) {
    const idx = list.indexOf(tabId);
    if (idx !== -1) list.splice(idx, 1);
  }
}

async function load() {
  if (hasSessionStorage) {
    const data = await chrome.storage.session.get("mru");
    if (data.mru) {
      for (const [windowId, list] of Object.entries(data.mru)) {
        mru.set(Number(windowId), list);
      }
      return;
    }
  }
  // First run (or no storage.session support): seed from open windows/tabs.
  const wins = await chrome.windows.getAll({ populate: true });
  for (const win of wins) {
    if (!win.tabs) continue;
    const active = win.tabs.find((t) => t.active);
    const rest = win.tabs.filter((t) => !t.active).map((t) => t.id);
    mru.set(win.id, active ? [active.id, ...rest] : rest);
  }
  await persist();
}

async function persist() {
  if (!hasSessionStorage) return;
  const obj = {};
  for (const [windowId, list] of mru) obj[windowId] = list;
  try {
    await chrome.storage.session.set({ mru: obj });
  } catch (err) {
    console.error("[mru-tab] persist() failed:", err);
  }
}

async function withReady(fn) {
  await ready;
  await fn();
  await persist();
}

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  withReady(() => touchTab(windowId, tabId));
});

chrome.tabs.onCreated.addListener((tab) => {
  withReady(() => {
    const list = ensureWindow(tab.windowId);
    if (!list.includes(tab.id)) list.push(tab.id);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  withReady(() => removeTab(tabId));
});

chrome.tabs.onAttached.addListener((tabId, info) => {
  withReady(() => {
    for (const [windowId, list] of mru) {
      const idx = list.indexOf(tabId);
      if (idx !== -1 && windowId !== info.newWindowId) list.splice(idx, 1);
    }
    const list = ensureWindow(info.newWindowId);
    if (!list.includes(tabId)) list.push(tabId);
  });
});

chrome.windows.onRemoved.addListener((windowId) => {
  withReady(() => {
    mru.delete(windowId);
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "get-mru") {
    (async () => {
      try {
        await ready;
        const windowId = sender.tab.windowId;
        const list = ensureWindow(windowId);
        const items = [];
        for (const id of list.slice(0, MAX_ITEMS)) {
          try {
            const t = await chrome.tabs.get(id);
            items.push({
              id,
              title: t.title || t.url || "Tab",
              favIconUrl: t.favIconUrl || "",
            });
          } catch {
            const idx = list.indexOf(id);
            if (idx !== -1) list.splice(idx, 1);
          }
        }
        await persist();
        sendResponse({ items });
      } catch (err) {
        console.error("[mru-tab] get-mru handler failed:", err);
        sendResponse({ items: [] });
      }
    })();
    return true; // async response
  }

  if (msg.type === "commit") {
    (async () => {
      try {
        await ready;
        await chrome.tabs.update(msg.tabId, { active: true });
      } catch (err) {
        console.error("[mru-tab] commit handler failed:", err);
      }
      sendResponse({ ok: true });
    })();
    return true; // async response
  }
});
