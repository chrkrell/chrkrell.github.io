const LIKED_KEY = "teamrif_liked_ideas";

let pendingReserveId = null;
let panelIdeaId = null;
let panelPreviousTitles = [];

function getLikedIds() {
  try { return JSON.parse(localStorage.getItem(LIKED_KEY) || "[]"); } catch { return []; }
}
function setLikedIds(ids) { localStorage.setItem(LIKED_KEY, JSON.stringify(ids)); }
function hasLiked(id) { return getLikedIds().includes(id); }
function toggleLikedId(id) {
  const ids = getLikedIds();
  setLikedIds(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText)
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  return Promise.resolve(fallbackCopy(text));
}
function fallbackCopy(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(el); el.focus(); el.select();
  try { document.execCommand("copy"); } catch {}
  document.body.removeChild(el);
}

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPost(url, body = {}) {
  const res = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || "Ukendt fejl"); }
  return res.json();
}

function escapeHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function escapeAttr(str) {
  return String(str).replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function renderIdeas(ideas) {
  const container = document.getElementById("ideas-list");
  if (!ideas.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🌱</span><p>Ingen ønsker endnu.<br>Vær den første til at tilføje et!</p></div>`;
    return;
  }
  container.innerHTML = ideas.map(renderIdeaCard).join("");
  attachIdeaEvents();
}

function renderIdeaCard(idea) {
  const liked = hasLiked(idea.id);

  const reserveBlock = idea.reserved_by
    ? `<div class="reserve-taken">
        <div class="reserve-taken-icon">📌</div>
        <div class="reserve-taken-info">
          <div class="reserve-taken-label">Reserveret</div>
          <div class="reserve-taken-name">${escapeHtml(idea.reserved_by)} har taget dette ønske</div>
        </div>
        <button class="btn-unreserve" data-id="${idea.id}">✕ Fjern reservation</button>
      </div>`
    : `<p class="action-help">Kunne du tænke dig at stå for et indslag om denne idé? Reserver den her.</p>
       <button class="btn-chip btn-reserve" data-id="${idea.id}">🙋 Reservér</button>`;

  return `
    <article class="idea-card" data-id="${idea.id}">
      <p class="idea-text">${escapeHtml(idea.text)}</p>

      <div class="action-block">
        <p class="action-help">Kunne du godt tænke dig at høre om denne idé på et teammøde? Giv den et like her.</p>
        <button class="btn-chip btn-like ${liked ? "liked" : ""}" data-id="${idea.id}">
          <span>${liked ? "♥" : "♡"}</span> ${idea.likes} ${liked ? "Fjern like" : "Like"}
        </button>
      </div>

      <div class="action-block">
        ${reserveBlock}
      </div>

      <div class="action-block">
        <p class="action-help">Kunne du godt tænke dig at reservere denne, men er i tvivl om, hvad du skal finde på? Tryk på knappen for at få sparring med AI, og få en prompt, du kan sætte ind i ØSA.</p>
        <button class="btn-chip btn-suggest" data-id="${idea.id}" data-text="${escapeAttr(idea.text)}">🧙‍♂️ Få hjælp fra AI</button>
      </div>
    </article>`;
}

function attachIdeaEvents() {
  document.querySelectorAll(".btn-like").forEach(btn => btn.addEventListener("click", handleLikeToggle));
  document.querySelectorAll(".btn-reserve").forEach(btn => btn.addEventListener("click", handleReserveClick));
  document.querySelectorAll(".btn-unreserve").forEach(btn => btn.addEventListener("click", handleUnreserve));
  document.querySelectorAll(".btn-suggest").forEach(btn => btn.addEventListener("click", handleSuggestClick));
}

async function handleLikeToggle(e) {
  const id = e.currentTarget.dataset.id;
  const isLiked = hasLiked(id);
  try {
    await apiPost(`/api/ideas/${id}/${isLiked ? "unlike" : "like"}`);
    toggleLikedId(id);
    showToast(isLiked ? "Like fjernet." : "Tak for dit like.");
    refreshIdeas();
  } catch { showToast("Der opstod en fejl. Prøv igen."); }
}

function handleReserveClick(e) {
  pendingReserveId = e.currentTarget.dataset.id;
  document.getElementById("reserve-name-input").value = "";
  document.getElementById("reserve-error").textContent = "";
  document.getElementById("reserve-modal").classList.add("open");
  setTimeout(() => document.getElementById("reserve-name-input").focus(), 50);
}

async function handleUnreserve(e) {
  const id = e.currentTarget.dataset.id;
  try {
    await apiPost(`/api/ideas/${id}/unreserve`);
    showToast("Reservation fjernet.");
    refreshIdeas();
  } catch { showToast("Der opstod en fejl. Prøv igen."); }
}

function closeModal() {
  document.getElementById("reserve-modal").classList.remove("open");
  pendingReserveId = null;
}
async function handleReserveConfirm() {
  const name = document.getElementById("reserve-name-input").value.trim();
  const errorEl = document.getElementById("reserve-error");
  errorEl.textContent = "";
  if (name.length < 2) { errorEl.textContent = "Det navn ser lidt for kort ud."; return; }
  try {
    await apiPost(`/api/ideas/${pendingReserveId}/reserve`, { name });
    closeModal(); showToast("Ønsket er nu reserveret."); refreshIdeas();
  } catch (err) { errorEl.textContent = err.message || "Kunne ikke reservere. Prøv igen."; }
}

function handleSuggestClick(e) {
  panelIdeaId = e.currentTarget.dataset.id;
  panelPreviousTitles = [];
  document.getElementById("panel-idea-text").textContent = `"${e.currentTarget.dataset.text}"`;
  setPanelOpen(true);
  fetchSuggestion();
}

function setPanelOpen(open) {
  document.getElementById("suggestions-panel").classList.toggle("open", open);
  document.getElementById("panel-overlay").classList.toggle("open", open);
}

async function fetchSuggestion() {
  document.getElementById("panel-body").innerHTML = `
    <div class="panel-loading"><div class="spinner"></div><span>Tænker på noget godt…</span></div>`;
  try {
    const data = await apiPost(`/api/ideas/${panelIdeaId}/suggestions`, { previous_titles: panelPreviousTitles });
    panelPreviousTitles.push(data.title);
    renderPanelSuggestion(data);
  } catch (err) {
    document.getElementById("panel-body").innerHTML = `
      <div class="panel-error">${err.message || "Der opstod en fejl. Prøv igen om lidt."}</div>
      <div style="text-align:center;margin-top:16px;">
        <button class="btn-new-suggestion" id="retry-btn">Prøv igen</button>
      </div>`;
    document.getElementById("retry-btn").addEventListener("click", fetchSuggestion);
  }
}

function renderPanelSuggestion(s) {
  document.getElementById("panel-body").innerHTML = `
    <div class="suggestion-card">
      <div class="suggestion-title">${escapeHtml(s.title)}</div>
      <div class="suggestion-field"><div class="suggestion-field-label">Om indslaget</div><div class="suggestion-field-value">${escapeHtml(s.description)}</div></div>
      <div class="suggestion-field"><div class="suggestion-field-label">Sådan kører du det (15–30 min)</div><div class="suggestion-field-value">${escapeHtml(s.how_to_run)}</div></div>
      <div class="suggestion-field"><div class="suggestion-field-label">Hvorfor det passer</div><div class="suggestion-field-value">${escapeHtml(s.why_it_fits)}</div></div>
      <div class="suggestion-field">
        <div class="suggestion-field-label">Prompt til ChatGPT</div>
        <div class="prompt-box" id="prompt-text">${escapeHtml(s.follow_up_prompt)}</div>
        <div class="copy-row">
          <button class="btn-copy" id="copy-btn"><span>⎘</span> Kopiér prompt</button>
          <span class="oesa-hint">og sæt det ind i <a href="https://oesa.1fm.dk/" target="_blank" rel="noopener noreferrer" class="oesa-link">ØSA</a></span>
        </div>
      </div>
    </div>
    <div style="text-align:center;margin-top:8px;">
      <button class="btn-new-suggestion" id="new-suggestion-btn">↻ Kom med et nyt forslag</button>
    </div>`;

  document.getElementById("copy-btn").addEventListener("click", () => {
    const text = document.getElementById("prompt-text").textContent;
    const btn = document.getElementById("copy-btn");
    copyToClipboard(text).then(() => {
      btn.innerHTML = "✓ Kopieret!"; btn.classList.add("copied"); showToast("Prompten er kopieret.");
      setTimeout(() => { btn.innerHTML = "<span>⎘</span> Kopiér prompt"; btn.classList.remove("copied"); }, 2000);
    });
  });
  document.getElementById("new-suggestion-btn").addEventListener("click", fetchSuggestion);
}

function initForm() {
  const input = document.getElementById("wish-input");
  const charCount = document.getElementById("char-count");
  const error = document.getElementById("field-error");
  const btn = document.getElementById("submit-btn");

  input.addEventListener("input", () => {
    charCount.textContent = `${input.value.length} / 200`;
    charCount.classList.toggle("warn", input.value.length > 180);
    error.textContent = "";
  });

  btn.addEventListener("click", async () => {
    const text = input.value.trim(); error.textContent = "";
    if (text.length < 5) { error.textContent = "Skriv lige et lidt længere ønske."; input.focus(); return; }
    btn.disabled = true; btn.textContent = "Gemmer…";
    try {
      await apiPost("/api/ideas", { text });
      input.value = ""; charCount.textContent = "0 / 200";
      showToast("Dit ønske er blevet gemt."); refreshIdeas();
    } catch { error.textContent = "Vi kunne ikke gemme dit ønske lige nu."; }
    finally { btn.disabled = false; btn.innerHTML = "<span>✦</span> Tilføj ønske"; }
  });

  document.querySelectorAll(".example-chip").forEach(chip => {
    chip.addEventListener("click", () => { input.value = chip.dataset.text; input.dispatchEvent(new Event("input")); input.focus(); });
  });
}

async function refreshIdeas() {
  try { renderIdeas(await apiGet("/api/ideas")); }
  catch { document.getElementById("ideas-list").innerHTML = `<div class="empty-state"><p>Kunne ikke hente ønsker. Prøv at genindlæse siden.</p></div>`; }
}

function init() {
  initForm(); refreshIdeas();
  document.getElementById("reserve-cancel-btn").addEventListener("click", closeModal);
  document.getElementById("reserve-confirm-btn").addEventListener("click", handleReserveConfirm);
  document.getElementById("reserve-modal").addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById("reserve-name-input").addEventListener("keydown", e => { if (e.key === "Enter") handleReserveConfirm(); if (e.key === "Escape") closeModal(); });
  document.getElementById("panel-close-btn").addEventListener("click", () => setPanelOpen(false));
  document.getElementById("panel-overlay").addEventListener("click", () => setPanelOpen(false));
}

document.addEventListener("DOMContentLoaded", init);
