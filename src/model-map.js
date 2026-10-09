// Method 3: model-assisted mapping. The only method that can fail citation
// verification, because it's the only one generating free text. The model is asked
// for a control ID, a confidence 0-1, and an exact quoted passage; this runner then
// checks the quote against the real clause text -- the model's claim is never trusted
// on its own.

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://192.168.1.246:11434";
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5-3b-cpu4";

function buildPrompt(clause, controls) {
  const catalog = controls.map((c) => `${c.id}: ${c.title} -- ${c.description}`).join("\n");
  return [
    "You are mapping one clause of a policy document to the single best-matching control below.",
    "Controls:",
    catalog,
    "",
    `Policy clause ${clause.id}: "${clause.text}"`,
    "",
    "Respond with ONLY a JSON object, no other text, in this exact shape:",
    '{"controlId": "<one of the control IDs above, or null if none fit>", "confidence": <0 to 1>, "quote": "<the exact substring of the policy clause above that supports your choice>"}',
  ].join("\n");
}

export function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// Exported so it can be unit-tested without a network call: the citation check is the
// one piece of this method's correctness that matters most and must never regress silently.
export function verifyCitation(clauseText, quote) {
  return typeof quote === "string" && quote.length > 0 && clauseText.includes(quote);
}

export async function modelMap(clause, controls) {
  const started = Date.now();
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: buildPrompt(clause, controls) }],
      stream: false,
      options: { temperature: 0.1 },
    }),
  });
  if (!res.ok) throw new Error(`ollama chat ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const latencyMs = Date.now() - started;
  const raw = data.message?.content ?? "";
  const parsed = extractJson(raw);

  if (!parsed || !parsed.controlId) {
    return { method: "model_assisted", controlId: null, confidence: parsed?.confidence ?? null, citedPassage: null, citationVerified: false, raw, latencyMs, abstained: true };
  }

  const quote = String(parsed.quote ?? "");
  const citationVerified = verifyCitation(clause.text, quote);
  const validControl = controls.some((c) => c.id === parsed.controlId);

  return {
    method: "model_assisted",
    controlId: validControl ? parsed.controlId : null,
    confidence: parsed.confidence ?? null,
    citedPassage: quote || null,
    citationVerified,
    invalidControlId: !validControl,
    raw,
    latencyMs,
    abstained: !validControl,
  };
}

export { MODEL, OLLAMA_HOST };
