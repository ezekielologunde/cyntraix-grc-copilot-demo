import { writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { POLICY } from "../data/policy.js";
import { CONTROLS } from "../data/controls.js";
import { keywordMap } from "../src/keyword.js";
import { embed, embedMap, EMBED_MODEL } from "../src/embed.js";
import { modelMap, MODEL } from "../src/model-map.js";

function sourceHash() {
  return createHash("sha256").update(JSON.stringify(POLICY)).digest("hex").slice(0, 16);
}

function summarize(allResults) {
  const byMethod = {};
  for (const method of ["keyword", "retrieval", "model_assisted"]) {
    const rows = allResults.map((r) => r[method]);
    const n = rows.length;
    const abstained = rows.filter((r) => r.abstained).length;
    const citationVerified = method === "model_assisted"
      ? rows.filter((r) => !r.abstained && r.citationVerified).length
      : rows.filter((r) => !r.abstained).length; // keyword/retrieval always cite verifiably by construction
    const answered = n - abstained;
    byMethod[method] = {
      clauses: n,
      abstainedCount: abstained,
      citationVerifiedRate: answered ? citationVerified / answered : null,
      noMatchRate: n ? abstained / n : null,
    };
  }
  const agreementCount = allResults.filter((r) =>
    r.keyword.controlId && r.keyword.controlId === r.retrieval.controlId && r.retrieval.controlId === r.model_assisted.controlId
  ).length;
  return { byMethod, crossMethodAgreementRate: allResults.length ? agreementCount / allResults.length : null };
}

async function main() {
  const startedAt = new Date().toISOString();
  console.error("embedding controls...");
  const controlEmbeddings = {};
  for (const c of CONTROLS.controls) {
    controlEmbeddings[c.id] = await embed(`${c.title} -- ${c.description}`);
  }

  const results = [];
  for (const clause of POLICY.clauses) {
    console.error(`mapping ${clause.id}...`);
    const kw = keywordMap(clause, CONTROLS.controls);
    const rt = await embedMap(clause, CONTROLS.controls, controlEmbeddings);
    const md = await modelMap(clause, CONTROLS.controls);
    results.push({ clauseId: clause.id, clauseText: clause.text, keyword: kw, retrieval: rt, model_assisted: md });
  }

  const report = {
    policy: { id: POLICY.id, version: POLICY.version, sourceHash: sourceHash() },
    framework: { id: CONTROLS.frameworkId, version: CONTROLS.frameworkVersion },
    embedModel: EMBED_MODEL,
    chatModel: MODEL,
    startedAt,
    finishedAt: new Date().toISOString(),
    clauseCount: POLICY.clauses.length,
    summary: summarize(results),
    results,
    disclaimer:
      "Development-scale run: " + POLICY.clauses.length + " synthetic policy clauses, eight-control demo subset, " +
      "one model, one run. Citation-verified rate and cross-method agreement are checkable by code; neither is a " +
      "precision/recall claim against expert-adjudicated ground truth, and nothing here is a compliance certification.",
  };

  mkdirSync("reports", { recursive: true });
  const fname = `reports/run-${startedAt.replace(/[:.]/g, "-")}.json`;
  writeFileSync(fname, JSON.stringify(report, null, 2));
  writeFileSync("reports/latest.json", JSON.stringify(report, null, 2));
  console.log(`wrote ${fname} and reports/latest.json`);
  console.log(JSON.stringify(report.summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
