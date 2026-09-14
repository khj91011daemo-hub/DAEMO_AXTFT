const DEFAULT_HTML = `<!doctype html>
<html>
  <body style="font-family:sans-serif;padding:24px;">
    <h1>안녕하세요 👋</h1>
    <p>왼쪽에 HTML 또는 Markdown 코드를 붙여넣으면 여기에 바로 미리보기가 나타납니다.</p>
  </body>
</html>`;

const els = {
  editor: document.getElementById("editor"),
  previewFrame: document.getElementById("previewFrame"),
  markdownPreview: document.getElementById("markdownPreview"),
  modeHtmlBtn: document.getElementById("modeHtml"),
  modeMdBtn: document.getElementById("modeMarkdown"),
  shareBtn: document.getElementById("shareBtn"),
  clearBtn: document.getElementById("clearBtn"),
  toast: document.getElementById("toast"),
  sharedBanner: document.getElementById("sharedBanner"),
  editBtn: document.getElementById("editSharedBtn"),
};

let mode = "html";
let renderTimer = null;

function encodeState(code, m) {
  const json = JSON.stringify({ c: code, m });
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeState(hash) {
  try {
    const b64 = hash.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function setMode(newMode) {
  mode = newMode;
  els.modeHtmlBtn.classList.toggle("active", mode === "html");
  els.modeMdBtn.classList.toggle("active", mode === "markdown");
  els.previewFrame.style.display = mode === "html" ? "block" : "none";
  els.markdownPreview.style.display = mode === "markdown" ? "block" : "none";
  render();
}

function render() {
  const code = els.editor.value;
  if (mode === "html") {
    els.previewFrame.srcdoc = code;
  } else {
    const rawHtml = window.marked.parse(code);
    const clean = window.DOMPurify.sanitize(rawHtml);
    els.markdownPreview.innerHTML = clean;
  }
  try {
    localStorage.setItem("codePreviewDraft", JSON.stringify({ c: code, m: mode }));
  } catch (e) {
    /* storage unavailable, ignore */
  }
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 250);
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 1800);
}

async function copyShareLink() {
  const encoded = encodeState(els.editor.value, mode);
  const url = `${location.origin}${location.pathname}#s=${encoded}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast("공유 링크가 복사되었습니다. 팀즈 채널에 붙여넣으세요.");
  } catch (e) {
    window.prompt("아래 링크를 복사하세요:", url);
  }
}

function loadFromHash() {
  const hash = location.hash;
  if (hash.startsWith("#s=")) {
    const state = decodeState(hash.slice(3));
    if (state) {
      els.editor.value = state.c;
      setMode(state.m === "markdown" ? "markdown" : "html");
      els.sharedBanner.classList.add("show");
      return true;
    }
  }
  return false;
}

function loadDraft() {
  try {
    const raw = localStorage.getItem("codePreviewDraft");
    if (raw) {
      const state = JSON.parse(raw);
      els.editor.value = state.c;
      setMode(state.m === "markdown" ? "markdown" : "html");
      return true;
    }
  } catch (e) {
    /* ignore */
  }
  return false;
}

els.modeHtmlBtn.addEventListener("click", () => setMode("html"));
els.modeMdBtn.addEventListener("click", () => setMode("markdown"));
els.editor.addEventListener("input", scheduleRender);
els.shareBtn.addEventListener("click", copyShareLink);
els.clearBtn.addEventListener("click", () => {
  els.editor.value = "";
  render();
  els.editor.focus();
});
els.editBtn.addEventListener("click", () => {
  els.sharedBanner.classList.remove("show");
  history.replaceState(null, "", location.pathname);
  els.editor.focus();
});

function loadInitialState() {
  if (!loadFromHash() && !loadDraft()) {
    els.editor.value = DEFAULT_HTML;
    setMode("html");
  }
}

window.addEventListener("hashchange", () => {
  els.sharedBanner.classList.remove("show");
  loadInitialState();
});

(function init() {
  if (window.microsoftTeams) {
    Promise.resolve(window.microsoftTeams.app.initialize()).catch(() => {
      /* not running inside Teams, ignore */
    });
  }

  loadInitialState();
})();
