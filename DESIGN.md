# Cyntraix GRC copilot demo — design

Status: build in progress, 2026-10-09. Vertical slice per
`independent-research-portfolio/engineering/cyntraix-grc.md`.

## What this is

A policy-to-control mapping comparison, run for real against one synthetic
access-control policy and eight public-domain NIST SP 800-53 Rev. 5 control
titles (a US government work, public domain). Three mapping methods are
compared on the identical input, and every suggested mapping's citation is
checked by code against the actual source text — never trusted as an LLM's
self-report:

1. **Keyword overlap** — naive shared-significant-word scoring between each
   policy clause and each control description. No model call.
2. **Retrieval-only ranking** — cosine similarity between `nomic-embed-text`
   embeddings of the clause and each control description (real embeddings,
   real vector math, local Ollama inference).
3. **Model-assisted mapping** — `qwen2.5-3b-cpu4` asked to pick a control and
   quote the exact passage in the clause supporting it. The runner verifies
   the quoted passage is a literal substring of the clause's source text; a
   mapping whose citation doesn't verify is flagged, not counted as correct.

## What this is not

- Not a compliance certification or legal opinion. A suggested mapping is a
  suggestion; nothing here replaces a qualified reviewer.
- Not evidence about mapping *correctness* in the adjudication sense (no
  precision/recall against expert-labeled ground truth — that requires the
  adjudicated evaluation set the engineering brief calls for later). What's
  measured here is citation verifiability and cross-method agreement, which
  is checkable by code without a human adjudicator.
- Not connected to any real customer policy, framework license, or Cyntraix
  client engagement. The policy document is an original synthetic example;
  the control set is a public-domain US government work (NIST SP 800-53),
  used here only as short, clearly-attributed titles, not the full catalog.
- No ingestion of arbitrary uploaded files in the public demo — a fixed,
  versioned synthetic policy and a fixed, versioned eight-control subset,
  so every citation claim is checkable against a document the visitor can
  also read on the page.

## Provenance and versioning

The policy document and control subset are both given explicit version
strings in `data/policy.js` and `data/controls.js`. A mapping's `sourceHash`
field records which policy version it was generated against (per the
engineering brief's "preserve source hashes" requirement), even though this
demo only ever has one frozen version to check against.

## Metrics (per method)

- **Citation-verified rate**: the fraction of suggested mappings whose
  quoted passage is a literal substring of the clause text it claims to
  cite. Keyword and retrieval methods always cite the clause itself (100%
  by construction); only the model-assisted method can fail this check.
- **Cross-method agreement**: the fraction of clauses where all three
  methods suggest the same control ID.
- **No-match rate**: clauses where a method's best score falls below a
  fixed threshold and it abstains rather than forcing a weak mapping.

## Repo layout

```
data/policy.js      one synthetic access-control policy, versioned, clause-by-clause
data/controls.js     eight NIST SP 800-53 control titles/descriptions, versioned
src/keyword.js        keyword-overlap mapper, no model call
src/embed.js           calls Ollama /api/embeddings for nomic-embed-text, cosine similarity
src/model-map.js       calls Ollama /api/chat for qwen2.5-3b-cpu4, verifies citations
eval/run.js             runs all three methods over all clauses, writes reports/latest.json
reports/                 committed frozen output of a real run
tests/                   citation-verification and keyword-scoring unit tests
index.html etc.          static review viewer: per-clause comparison, accept/edit/reject (local only), GitHub Pages
```

## Public demo

Same shape as the other three demos in this set: the public page replays
the committed `reports/latest.json` from an actual run. It makes no live
model call. Reviewer decisions (accept/edit/reject) are kept in the
visitor's own browser only, exportable as JSON, never submitted anywhere.
