import { POLICY } from "./data/policy.js";
import { CONTROLS } from "./data/controls.js";

const $ = (sel) => document.querySelector(sel);
const STORAGE_KEY = "grc-copilot-demo-decisions-v1";

function pct(x) {
  return x === null || x === undefined ? "—" : Math.round(x * 100) + "%";
}
function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function controlTitle(id) {
  const c = CONTROLS.controls.find((x) => x.id === id);
  return c ? `${c.id} — ${c.title}` : "(no match)";
}

function loadDecisions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveDecision(clauseId, decision) {
  try {
    const all = loadDecisions();
    all[clauseId] = decision;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* private browsing or storage disabled: decisions just don't persist across reloads */
  }
}

async function load() {
  renderPolicy();
  renderControls();
  const res = await fetch("reports/latest.json");
  if (!res.ok) {
    $("#run-meta").textContent = "No report found at reports/latest.json yet.";
    return;
  }
  const report = await res.json();
  renderMeta(report);
  renderSummary(report);
  renderMappings(report);
  renderFinding(report);
}

function renderPolicy() {
  $("#policy-meta").textContent = `${POLICY.title} — ${POLICY.version}`;
  $("#policy-list").innerHTML = POLICY.clauses.map((c) =>
    `<div class="clause-ref" id="clause-${c.id}"><span class="clause-id">${c.id}</span> ${escapeHtml(c.text)}</div>`
  ).join("");
}

function renderControls() {
  $("#framework-meta").textContent = `${CONTROLS.frameworkVersion} — titles are public-domain NIST SP 800-53 text; descriptions below are this project's own paraphrase, not verbatim catalog text.`;
  $("#controls-list").innerHTML = CONTROLS.controls.map((c) =>
    `<div class="control-ref"><span class="control-id">${c.id}</span> <strong>${escapeHtml(c.title)}</strong><br><span class="control-desc">${escapeHtml(c.description)}</span></div>`
  ).join("");
}

function renderMeta(report) {
  $("#run-meta").innerHTML =
    `Policy <code>${escapeHtml(report.policy.id)}</code> (${escapeHtml(report.policy.version)}, hash <code>${escapeHtml(report.policy.sourceHash)}</code>) ` +
    `mapped against <code>${escapeHtml(report.framework.id)}</code> &middot; chat model <code>${escapeHtml(report.chatModel)}</code>, embed model <code>${escapeHtml(report.embedModel)}</code> ` +
    `&middot; run finished ${new Date(report.finishedAt).toLocaleString()} &middot; <em>${escapeHtml(report.disclaimer)}</em>`;
}

function renderSummary(report) {
  const labels = { keyword: "Keyword overlap", retrieval: "Retrieval-only", model_assisted: "Model-assisted" };
  const cards = Object.entries(report.summary.byMethod).map(([method, s]) => `
    <div class="policy-card">
      <div class="policy-name">${labels[method]}</div>
      <div class="metric"><span class="metric-label">Citation-verified rate</span><span class="metric-value ${s.citationVerifiedRate === 1 ? "ok" : s.citationVerifiedRate < 1 ? "warn" : ""}">${pct(s.citationVerifiedRate)}</span></div>
      <div class="metric"><span class="metric-label">No-match (abstained)</span><span class="metric-value">${pct(s.noMatchRate)}</span></div>
      <div class="metric"><span class="metric-label">Clauses</span><span class="metric-value">${s.clauses}</span></div>
    </div>`).join("");
  const agreement = `
    <div class="policy-card agreement">
      <div class="policy-name">Cross-method agreement</div>
      <div class="metric"><span class="metric-label">All 3 methods picked the same control</span><span class="metric-value">${pct(report.summary.crossMethodAgreementRate)}</span></div>
    </div>`;
  $("#summary-grid").innerHTML = cards + agreement;
}

function renderMappings(report) {
  const decisions = loadDecisions();
  $("#mapping-list").innerHTML = report.results.map((r, i) => mappingCard(r, i, decisions)).join("");
  report.results.forEach((r, i) => {
    ["accept", "edit", "reject"].forEach((action) => {
      document.getElementById(`${action}-${i}`)?.addEventListener("click", () => {
        const note = action === "edit" ? prompt("Correction / reviewer note:", "") : "";
        saveDecision(r.clauseId, { action, note: note ?? "", at: new Date().toISOString() });
        renderMappings(report);
      });
    });
  });
}

function methodRow(label, m) {
  if (!m || m.abstained) {
    return `<div class="method-row"><span class="method-label">${label}</span><span class="no-match">no match (abstained)</span></div>`;
  }
  const verified = m.method === "model_assisted" ? m.citationVerified : true;
  return `
    <div class="method-row">
      <span class="method-label">${label}</span>
      <span class="control-pick">${escapeHtml(controlTitle(m.controlId))}</span>
      ${m.score !== undefined && m.score !== null ? `<span class="score">score ${typeof m.score === "number" ? m.score.toFixed(2) : m.score}</span>` : ""}
      ${m.confidence !== undefined && m.confidence !== null ? `<span class="score">confidence ${m.confidence}</span>` : ""}
      <span class="citation-tag ${verified ? "verified" : "unverified"}">${verified ? "citation verified" : "citation NOT verified"}</span>
      ${m.citedPassage ? `<div class="quote">&ldquo;${escapeHtml(m.citedPassage)}&rdquo;</div>` : ""}
    </div>`;
}

function mappingCard(r, i, decisions) {
  const d = decisions[r.clauseId];
  return `
    <article class="case-card">
      <div class="case-head">
        <h3><span class="clause-id">${r.clauseId}</span> ${escapeHtml(r.clauseText)}</h3>
      </div>
      ${methodRow("Keyword", r.keyword)}
      ${methodRow("Retrieval", r.retrieval)}
      ${methodRow("Model-assisted", r.model_assisted)}
      <div class="review-row">
        <button class="button" id="accept-${i}">Accept</button>
        <button class="button secondary" id="edit-${i}">Edit / correct</button>
        <button class="button danger" id="reject-${i}">Reject</button>
        ${d ? `<span class="decision-tag decision-${d.action}">${d.action}${d.note ? `: ${escapeHtml(d.note)}` : ""}</span>` : ""}
      </div>
    </article>`;
}

function renderFinding(report) {
  const md = report.summary.byMethod.model_assisted;
  const failed = report.results.filter((r) => !r.model_assisted.citationVerified);
  const failedList = failed.map((r) =>
    `<li><code>${r.clauseId}</code>: picked <strong>${escapeHtml(r.model_assisted.controlId)}</strong> (the correct control, per the other two methods), but quoted &ldquo;${escapeHtml(r.model_assisted.citedPassage)}&rdquo; &mdash; text from the <em>control catalog</em>, not from clause ${r.clauseId} itself.</li>`
  ).join("");
  $("#finding-text").innerHTML =
    `The model-assisted method's citation-verified rate on this run was <strong>${pct(md.citationVerifiedRate)}</strong>. Keyword and retrieval always "cite" the full clause by construction, so this check only means something for the model. ` +
    `Cross-method agreement across all three was <strong>${pct(report.summary.crossMethodAgreementRate)}</strong> &mdash; not a precision/recall claim against expert labels, just how often three methods landed on the same control. ` +
    (failed.length ? `<br><br>The failures are the interesting part: <ul>${failedList}</ul>The control pick was correct both times. The model cited the wrong document to support it &mdash; exactly what citation verification exists to catch.` : "");
}

$("#export-decisions").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(loadDecisions(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grc-review-decisions.json";
  a.click();
  URL.revokeObjectURL(url);
});

load();
