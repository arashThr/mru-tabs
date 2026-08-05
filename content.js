// Content script: detects Ctrl+` cycling and renders a preview overlay,
// without switching tabs until Ctrl is released (Firefox Ctrl+Tab style).
// Hold Shift too (Ctrl+Shift+`) to cycle backwards.
// Cycling past the last tab switches to a type-ahead search box.
(() => {
  let session = null; // { mode: 'cycle'|'search', ... }
  let overlayHost = null;
  let opening = false; // true while the first get-mru request is in flight

  const BASE_STYLE = `
    .panel { display:flex; flex-direction:column; gap:2px; min-width:260px;
      max-width:420px; background:rgba(20,20,20,0.95); border-radius:10px;
      padding:8px; box-shadow:0 8px 30px rgba(0,0,0,0.5); font-family:sans-serif;
      pointer-events:auto; }
    .item { display:flex; align-items:center; gap:10px; padding:6px 10px;
      border-radius:6px; color:#eee; box-sizing:border-box; }
    .item.active { background:rgba(77,163,255,0.25); outline:2px solid #4da3ff;
      outline-offset:-2px; }
    .item img { width:18px; height:18px; flex:none; }
    .item span { font-size:13px; overflow:hidden; text-overflow:ellipsis;
      white-space:nowrap; flex:1; }
    .item .tag { font-size:11px; color:#9ad; flex:none; }
    input { font-size:14px; padding:6px 8px; border-radius:6px; border:1px solid #555;
      background:#111; color:#eee; outline:none; }
    .results { display:flex; flex-direction:column; gap:2px; max-height:50vh;
      overflow-y:auto; }
  `;

  const SEARCH_ITEM = {
    id: null,
    title: "\uD83D\uDD0D Search tabs\u2026",
    favIconUrl: "",
    isSearch: true,
  };

  function renderItems(container, items, activeIndex) {
    container.innerHTML = "";
    items.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "item" + (i === activeIndex ? " active" : "");
      if (!item.isSearch) {
        const img = document.createElement("img");
        img.src = item.favIconUrl || "";
        row.appendChild(img);
      }
      const span = document.createElement("span");
      span.textContent = item.title;
      row.appendChild(span);
      if (item.isCurrent) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = "current";
        row.appendChild(tag);
      }
      container.appendChild(row);
    });
  }

  function removeOverlay() {
    if (overlayHost) {
      overlayHost.remove();
      overlayHost = null;
    }
  }

  function newOverlayShadow() {
    removeOverlay();
    overlayHost = document.createElement("div");
    overlayHost.style.cssText =
      "all:initial; position:fixed; inset:0; z-index:2147483647; display:flex;" +
      "align-items:center; justify-content:center; pointer-events:none;";
    const shadow = overlayHost.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = BASE_STYLE;
    shadow.appendChild(style);
    document.documentElement.appendChild(overlayHost);
    return shadow;
  }

  // Returns the same on-screen panel if one is already showing (so switching
  // from the cycle list into search re-uses it instead of popping up a new
  // dialog), otherwise creates a fresh overlay + panel.
  function ensurePanel() {
    const shadow = overlayHost ? overlayHost.shadowRoot : newOverlayShadow();
    let panel = shadow.querySelector(".panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "panel";
      shadow.appendChild(panel);
    }
    return panel;
  }

  // ---- Cycle mode: preview list, moves with each Ctrl+` press ----

  function buildCycleOverlay() {
    const shadow = newOverlayShadow();
    const panel = document.createElement("div");
    panel.className = "panel";
    const list = document.createElement("div");
    list.className = "results";
    panel.appendChild(list);
    shadow.appendChild(panel);
    session.listEl = list;
    renderItems(list, session.items, session.index);
  }

  function step(reverse) {
    const n = session.items.length;
    session.index = (session.index + (reverse ? -1 : 1) + n) % n;
    renderItems(session.listEl, session.items, session.index);
  }

  function endCycle(commit) {
    const chosen = commit ? session.items[session.index] : null;
    if (chosen && chosen.isSearch) {
      // Keep showing the same tabs (minus the Search row itself) until the
      // user actually types something.
      const carryItems = session.items.filter((it) => !it.isSearch);
      enterSearchMode(carryItems);
      return;
    }
    session = null;
    removeOverlay();
    if (chosen) {
      chrome.runtime.sendMessage({ type: "commit", tabId: chosen.id });
    }
  }

  // ---- Search mode: type-ahead over all tabs in the window ----

  function enterSearchMode(baseItems) {
    // Reuse the panel and its existing item list (if any) as-is; only an
    // input box gets added above it. Nothing changes on screen until typing.
    const panel = ensurePanel();
    let list = panel.querySelector(".results");
    if (!list) {
      list = document.createElement("div");
      list.className = "results";
      panel.appendChild(list);
    }
    // Lock the panel's size to its current dimensions so it doesn't
    // grow/shrink as search results (and their text lengths) change while
    // typing.
    const lockedHeight = list.getBoundingClientRect().height;
    if (lockedHeight > 0) list.style.height = `${lockedHeight}px`;
    const lockedWidth = panel.getBoundingClientRect().width;
    if (lockedWidth > 0) panel.style.width = `${lockedWidth}px`;
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search tabs\u2026";
    panel.insertBefore(input, list);

    session = {
      mode: "search",
      query: "",
      baseItems: baseItems || [],
      results: baseItems || [],
      resultIndex: 0,
      listEl: list,
    };

    input.addEventListener("input", () => {
      session.query = input.value;
      if (!input.value.trim()) {
        session.results = session.baseItems;
        session.resultIndex = 0;
        renderItems(session.listEl, session.results, session.resultIndex);
        return;
      }
      runSearch(input.value);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        endSearch(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        endSearch(true);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSearchIndex(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSearchIndex(-1);
      }
    });
    input.focus();
  }

  function runSearch(query) {
    session.query = query;
    chrome.runtime.sendMessage({ type: "search-tabs", query }, (resp) => {
      if (!session || session.mode !== "search") return; // session ended meanwhile
      // Cap to the same number of rows the default panel shows, so the
      // fixed-height list never needs to scroll.
      const limit = session.baseItems.length || 1;
      session.results = ((resp && resp.items) || []).slice(0, limit);
      session.resultIndex = 0;
      renderItems(session.listEl, session.results, session.resultIndex);
    });
  }

  function moveSearchIndex(delta) {
    const n = session.results.length;
    if (!n) return;
    session.resultIndex = (session.resultIndex + delta + n) % n;
    renderItems(session.listEl, session.results, session.resultIndex);
  }

  function endSearch(commit) {
    if (commit && session.results.length) {
      const chosen = session.results[session.resultIndex];
      chrome.runtime.sendMessage({ type: "commit", tabId: chosen.id });
    }
    session = null;
    removeOverlay();
  }

  // ---- Global shortcut handling ----

  window.addEventListener(
    "keydown",
    (e) => {
      if (
        session &&
        session.mode === "cycle" &&
        (e.code === "ArrowUp" || e.code === "ArrowDown")
      ) {
        e.preventDefault();
        e.stopPropagation();
        step(e.code === "ArrowUp");
        return;
      }
      if (e.code !== "Backquote" || !e.ctrlKey) return;
      if (session && session.mode === "search") return; // let the input handle its own keys
      e.preventDefault();
      e.stopPropagation();

      if (!session) {
        if (opening) return; // first press's request is still in flight
        opening = true;
        chrome.runtime.sendMessage({ type: "get-mru" }, (resp) => {
          opening = false;
          if (chrome.runtime.lastError) return;
          if (!resp || !resp.items || resp.items.length < 2) return;
          // Current tab sits at the top of the list as a visual anchor;
          // Search sits at the very end. Cycling forward through the other
          // tabs eventually reaches Search, then wraps back to the current
          // tab at the top.
          const [current, ...others] = resp.items;
          session = {
            mode: "cycle",
            items: [{ ...current, isCurrent: true }, ...others, SEARCH_ITEM],
            index: 1,
          };
          buildCycleOverlay();
        });
      } else {
        step(e.shiftKey);
      }
    },
    true,
  );

  window.addEventListener(
    "keyup",
    (e) => {
      if (e.key === "Control" && session && session.mode === "cycle") {
        endCycle(true);
      }
    },
    true,
  );

  window.addEventListener("blur", () => {
    if (!session) return;
    if (session.mode === "cycle") endCycle(true);
    else endSearch(false);
  });
})();
