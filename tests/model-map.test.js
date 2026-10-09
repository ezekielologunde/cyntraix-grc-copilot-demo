import test from "node:test";
import assert from "node:assert/strict";
import { extractJson, verifyCitation } from "../src/model-map.js";

test("extractJson parses a JSON object embedded in surrounding model prose", () => {
  const raw = 'Sure, here is the mapping:\n{"controlId": "AC-7", "confidence": 0.9, "quote": "Failed login"}\nHope that helps!';
  const parsed = extractJson(raw);
  assert.equal(parsed.controlId, "AC-7");
});

test("extractJson returns null for text with no JSON object", () => {
  assert.equal(extractJson("no json here"), null);
});

test("verifyCitation passes when the quote is a literal substring of the clause", () => {
  const clause = "Failed login attempts must be limited to five consecutive tries.";
  assert.equal(verifyCitation(clause, "five consecutive tries"), true);
});

test("verifyCitation fails when the quote does not appear verbatim in the clause", () => {
  const clause = "Failed login attempts must be limited to five consecutive tries.";
  assert.equal(verifyCitation(clause, "ten consecutive tries"), false);
});

test("verifyCitation fails on an empty or missing quote rather than passing by default", () => {
  const clause = "Failed login attempts must be limited to five consecutive tries.";
  assert.equal(verifyCitation(clause, ""), false);
  assert.equal(verifyCitation(clause, undefined), false);
});
