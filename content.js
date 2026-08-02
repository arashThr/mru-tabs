// Content script: detects Ctrl+` cycling and renders a preview overlay,
// without switching tabs until Ctrl is released (Firefox Ctrl+Tab style).
// Hold Shift too (Ctrl+Shift+`) to cycle backwards.
(() => {
  let session = null; // { items: [{id,title,favIconUrl}], index }
  let overlayHost = null;

  function buildOverlay(items, index) {
    removeOverlay();
    overlayHost = document.createElement("div");
    overlayHost.style.cssText =
      "all:initial; position:fixed; inset:0; z-index:2147483647; display:flex;" +
      "align-items:center; justify-content:center; pointer-events:none;";
    const shadow = overlayHost.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      .panel { display:flex; flex-direction:column; gap:2px; min-width:260px;
        max-width:420px; background:rgba(20,20,20,0.92); border-radius:10px;
        padding:8px; box-shadow:0 8px 30px rgba(0,0,0,0.5); font-family:sans-serif; }
      .item { display:flex; align-items:center; gap:10px; padding:6px 10px;
        border-radius:6px; color:#eee; box-sizing:border-box; }
      .item.active { background:rgba(77,163,255,0.25); outline:2px solid #4da3ff; }
      .item img { width:18px; height:18px; flex:none; }
      .item span { font-size:13px; overflow:hidden; text-overflow:ellipsis;
        white-space:nowrap; }
    `;
    const panel = document.createElement("div");
    panel.className = "panel";
    items.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "item" + (i === index ? " active" : "");
      const img = document.createElement("img");
      img.src = item.favIconUrl || "";
      const span = document.createElement("span");
      span.textContent = item.title;
      row.append(img, span);
      panel.appendChild(row);
    });
    shadow.append(style, panel);
    document.documentElement.appendChild(overlayHost);
  }

  function updateOverlay(index) {
    if (!overlayHost) return;
    overlayHost.shadowRoot.querySelectorAll(".item").forEach((el, i) => {
      el.classList.toggle("active", i === index);
    });
  }

  function removeOverlay() {
    if (overlayHost) {
      overlayHost.remove();
      overlayHost = null;
    }
  }

  function endSession(commit) {
    if (session && commit) {
      const chosen = session.items[session.index];
      chrome.runtime.sendMessage({ type: "commit", tabId: chosen.id });
    }
    session = null;
    removeOverlay();
  }

  function step(reverse) {
    const n = session.items.length;
    session.index = (session.index + (reverse ? -1 : 1) + n) % n;
    updateOverlay(session.index);
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.code !== "Backquote" || !e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return; // ignore OS auto-repeat while key is held down

      if (!session) {
        chrome.runtime.sendMessage({ type: "get-mru" }, (resp) => {
          if (chrome.runtime.lastError) return;
          if (!resp || !resp.items || resp.items.length < 2) return;
          session = { items: resp.items, index: 1 };
          buildOverlay(session.items, session.index);
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
      if (e.key === "Control" && session) endSession(true);
    },
    true,
  );

  window.addEventListener("blur", () => endSession(true));
})();
