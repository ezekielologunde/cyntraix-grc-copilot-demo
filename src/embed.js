// Method 2: retrieval-only ranking. Real embeddings from a local Ollama instance
// (nomic-embed-text), real cosine similarity -- no generative model call, so there is
// no free-text output to verify; the citation is always the full clause, same as keyword.

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://192.168.1.246:11434";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

export async function embed(text) {
  const res = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) throw new Error(`ollama embeddings ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.embedding;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function embedMap(clause, controls, controlEmbeddings, threshold = 0.55) {
  const clauseVec = await embed(clause.text);
  let best = null;
  for (const c of controls) {
    const score = cosine(clauseVec, controlEmbeddings[c.id]);
    if (!best || score > best.score) best = { controlId: c.id, score };
  }
  if (!best || best.score < threshold) {
    return { method: "retrieval", controlId: null, score: best?.score ?? 0, citedPassage: null, abstained: true };
  }
  return { method: "retrieval", controlId: best.controlId, score: best.score, citedPassage: clause.text, abstained: false };
}

export { EMBED_MODEL, OLLAMA_HOST };
