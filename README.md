# Cyntraix GRC Copilot Demo

Interactive portfolio demo by Ezekiel Ologunde. Three policy-to-control mapping methods
compared on one synthetic policy document, every suggested mapping's citation checked
against the actual source text by code.

See [DESIGN.md](DESIGN.md) for the full scope, provenance, and limits.

## Run it yourself

Requires Node 20+ and a reachable Ollama instance with `qwen2.5-3b-cpu4` (chat) and
`nomic-embed-text` (embeddings) pulled. Override with `OLLAMA_HOST`, `OLLAMA_MODEL`,
`OLLAMA_EMBED_MODEL`.

```
npm test        # unit tests: keyword scoring, citation verification -- no model needed
npm run eval     # runs all three methods over all clauses, writes reports/latest.json
npx serve .      # serve the static review page locally
```

The public page replays the **committed** `reports/latest.json` from an actual run. It
makes no live model call.

## The three methods

| Method | What it does | Can it fail citation verification? |
|---|---|---|
| `keyword` | Shared-significant-word overlap scoring, no model call | No &mdash; always cites the full clause, trivially true |
| `retrieval` | Cosine similarity between `nomic-embed-text` embeddings, no generative call | No &mdash; same reason |
| `model_assisted` | `qwen2.5-3b-cpu4` picks a control and quotes a supporting passage | Yes &mdash; the runner checks the quote is a literal substring of the clause before counting it verified |

## What this is not

Not a compliance certification or legal opinion. Not evidence of mapping *correctness*
in the adjudicated sense (no expert-labeled ground truth here; that's a later, separate
evaluation). Not connected to any real customer policy or framework license. The policy
document is an original synthetic example; the control titles are drawn from NIST
SP 800-53 Rev. 5, a public-domain US government publication, with this project's own
paraphrased descriptions, not verbatim catalog text.

## Why citation verification matters here

A model can say it found support for a mapping in the policy text without that support
actually existing &mdash; the same failure mode this portfolio's agent-security-eval
project documents for tool calls. Checking the quoted passage against the real clause
text, by code, is the only way to catch that without trusting the model's own account of
its reasoning.

## A finding from the real run

On the real 8-clause run (`reports/latest.json`), the model-assisted method picked the
same control as the other two methods on 6 of 8 clauses, and the *correct* control on
both of the remaining two (`P-5`, `P-6`, where keyword overlap picked the wrong one).
But on clauses `P-7` and `P-8`, citation verification failed even though the control
pick was correct: asked to quote the supporting passage from the policy clause, the
model instead quoted text from the **control catalog** it had just been shown --
`"Identify and log organization-defined events, including access control decisions, to
support audit and review"` (that's the control's own description, not anything in
clause P-7) and `"User-Installed Software"` (the control's title, not clause P-8's
text). The model got the right answer and cited the wrong document to support it. An
LLM-judge oracle, or a reviewer skimming the citation for plausibility rather than
checking it against the source, would likely have waved both through.
