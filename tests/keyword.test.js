import test from "node:test";
import assert from "node:assert/strict";
import { keywordMap } from "../src/keyword.js";
import { CONTROLS } from "../data/controls.js";

test("keyword mapper picks the control with the most shared significant words", () => {
  const clause = { id: "X", text: "Failed login attempts must be limited to five consecutive tries." };
  const result = keywordMap(clause, CONTROLS.controls);
  assert.equal(result.controlId, "AC-7");
  assert.equal(result.abstained, false);
});

test("keyword mapper always cites the full clause text (not a model claim)", () => {
  const clause = { id: "X", text: "Failed login attempts must be limited to five consecutive tries." };
  const result = keywordMap(clause, CONTROLS.controls);
  assert.equal(result.citedPassage, clause.text);
});

test("keyword mapper abstains below the score threshold", () => {
  const clause = { id: "X", text: "Coffee machines in the break room must be cleaned weekly." };
  const result = keywordMap(clause, CONTROLS.controls, 3);
  assert.equal(result.abstained, true);
  assert.equal(result.controlId, null);
});
