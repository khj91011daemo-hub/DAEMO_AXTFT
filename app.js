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
  downloadBtn: document.getElementById("downloadBtn"),
  toast: document.getElementById("toast"),
  sharedBanner: document.getElementById("sharedBanner"),
  sharedBannerText: document.getElementById("sharedBannerText"),
  editBtn: document.getElementById("editSharedBtn"),
  previewLoading: document.getElementById("previewLoading"),
  panes: document.getElementById("panes"),
  editorPane: document.getElementById("editorPane"),
  divider: document.getElementById("divider"),
  featurePreviewBtn: document.getElementById("featurePreview"),
};

let mode = "html";
let renderTimer = null;
let previewLoadingTimer = null;
let previewSlowTimer = null;
let lastShareTitle = "";

function encodeState(code, m, title) {
  const json = JSON.stringify(title ? { c: code, m, t: title } : { c: code, m });
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

function hidePreviewLoading() {
  clearTimeout(previewSlowTimer);
  els.previewLoading.classList.remove("show");
}

function showPreviewLoading() {
  els.previewLoading.textContent = "미리보기를 불러오는 중...";
  els.previewLoading.classList.add("show");
  clearTimeout(previewSlowTimer);
  previewSlowTimer = setTimeout(() => {
    els.previewLoading.textContent =
      "아직 로딩 중이에요. 코드 안의 외부 스크립트/이미지 주소가 사내망에서 차단되었을 수 있어요.";
  }, 3000);
}

function render() {
  const code = els.editor.value;
  if (mode === "html") {
    showPreviewLoading();
    els.previewFrame.srcdoc = code;
  } else {
    hidePreviewLoading();
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
  const title = window.prompt(
    "공유할 제목을 입력하세요 (SharePoint/팀즈에 붙여넣기 좋게 링크 앞에 붙습니다. 비워두려면 그대로 확인)",
    lastShareTitle
  );
  if (title === null) return; // user cancelled

  lastShareTitle = title.trim();
  const encoded = encodeState(els.editor.value, mode, lastShareTitle);
  const url = `${location.origin}${location.pathname}#s=${encoded}`;
  const text = lastShareTitle ? `[${lastShareTitle}] ${url}` : url;

  try {
    await navigator.clipboard.writeText(text);
    showToast("공유 링크가 복사되었습니다. 팀즈 채널이나 SharePoint에 붙여넣으세요.");
  } catch (e) {
    window.prompt("아래 내용을 복사하세요:", text);
  }
}

function slugifyForFilename(title) {
  const trimmed = (title || "").trim();
  if (!trimmed) return "code-preview";
  return trimmed.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_").slice(0, 60);
}

function downloadAsFile() {
  const code = els.editor.value;
  const ext = mode === "markdown" ? "md" : "html";
  const mimeType = mode === "markdown" ? "text/markdown" : "text/html";
  const filename = `${slugifyForFilename(lastShareTitle)}.${ext}`;

  const blob = new Blob([code], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(`${filename} 다운로드되었습니다.`);
}

function loadFromHash() {
  const hash = location.hash;
  if (hash.startsWith("#s=")) {
    const state = decodeState(hash.slice(3));
    if (state) {
      els.editor.value = state.c;
      if (state.t) lastShareTitle = state.t;
      els.sharedBannerText.textContent = state.t
        ? `공유된 미리보기입니다 (${state.t}). 자유롭게 수정할 수 있어요.`
        : "공유된 미리보기입니다. 자유롭게 수정할 수 있어요.";
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

function enableDividerResize() {
  const MIN_PANE = 160;
  let dragging = false;

  els.divider.addEventListener("mousedown", (e) => {
    dragging = true;
    els.divider.classList.add("dragging");
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = els.panes.getBoundingClientRect();
    const dividerWidth = els.divider.getBoundingClientRect().width;
    const maxWidth = rect.width - dividerWidth - MIN_PANE;
    const width = Math.min(maxWidth, Math.max(MIN_PANE, e.clientX - rect.left));
    els.editorPane.style.flex = `0 0 ${width}px`;
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    els.divider.classList.remove("dragging");
    document.body.style.userSelect = "";
  });
}

els.featurePreviewBtn.addEventListener("click", () => {
  els.featurePreviewBtn.classList.add("active");
});
enableDividerResize();

els.previewFrame.addEventListener("load", hidePreviewLoading);
els.modeHtmlBtn.addEventListener("click", () => setMode("html"));
els.modeMdBtn.addEventListener("click", () => setMode("markdown"));
els.editor.addEventListener("input", scheduleRender);
els.shareBtn.addEventListener("click", copyShareLink);
els.downloadBtn.addEventListener("click", downloadAsFile);
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
