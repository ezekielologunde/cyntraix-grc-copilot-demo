// Method 1: naive keyword overlap. No model call. Always cites the full clause text
// (the only "citation" a keyword method can honestly offer), so citation verification
// is trivially true by construction -- the interesting citation-verification question
// is only for the model-assisted method.

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "for", "on", "be", "is", "are", "must",
  "all", "any", "with", "by", "as", "at", "that", "this", "from", "within", "must", "not",
]);

function tokens(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function keywordMap(clause, controls, threshold = 1) {
  const clauseTokens = new Set(tokens(clause.text));
  let best = null;
  for (const c of controls) {
    const controlTokens = new Set(tokens(`${c.title} ${c.description}`));
    const overlap = [...clauseTokens].filter((t) => controlTokens.has(t));
    const score = overlap.length;
    if (!best || score > best.score) best = { controlId: c.id, score, overlap };
  }
  if (!best || best.score < threshold) {
    return { method: "keyword", controlId: null, score: best?.score ?? 0, citedPassage: null, abstained: true };
  }
  return {
    method: "keyword",
    controlId: best.controlId,
    score: best.score,
    citedPassage: clause.text,
    matchedWords: best.overlap,
    abstained: false,
  };
}
