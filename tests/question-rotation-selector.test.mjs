import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const selector = require("../js/daily-verse-selector.js");
const rotationConfig = JSON.parse(
  readFileSync(new URL("../data/questions/question-rotation.json", import.meta.url), "utf8")
);

test("approved Question rotation is complete, unique, and valid", () => {
  const validation = selector.validateRotationConfig(rotationConfig);
  const questionIds = rotationConfig.slots.filter(Number.isInteger);
  const reservedSlots = rotationConfig.slots.filter(slot => typeof slot === "string");

  assert.equal(validation.valid, true);
  assert.equal(validation.positionCount, 128);
  assert.equal(validation.contentCount, 117);
  assert.equal(validation.reservedCount, 11);
  assert.deepEqual(validation.duplicateContentIds, []);
  assert.equal(new Set(questionIds).size, 117);
  assert.deepEqual([...questionIds].sort((a, b) => a - b), Array.from({ length: 117 }, (_, index) => index + 1));
  assert.deepEqual(reservedSlots, Array.from({ length: 11 }, (_, index) => `RESERVED_${String(index + 1).padStart(2, "0")}`));
});

test("legacy Question 118 is followed by the first approved rotation question", () => {
  const legacyQuestionId = Math.floor(
    (Date.parse("2026-09-04T00:00:00.000Z") - Date.parse("2026-05-10T00:00:00.000Z")) / 86400000
  ) + 1;
  const rotation = selector.selectQuestionRotation({ date: "2026-09-05", rotationConfig });
  const nextRotation = selector.selectQuestionRotation({ date: "2026-09-06", rotationConfig });

  assert.equal(legacyQuestionId, 118);
  assert.equal(rotation.questionId, 8);
  assert.equal(rotation.source, "rotation");
  assert.equal(nextRotation.questionId, 75);
});

test("an empty Question reserved slot skips to the next normal question", () => {
  assert.equal(selector.selectQuestionRotation({ date: "2026-09-15", rotationConfig }).questionId, 41);
  assert.equal(selector.selectQuestionRotation({ date: "2026-09-16", rotationConfig }).questionId, 106);
});

test("an assigned Question reserved slot is used from its activation date", () => {
  const assignedConfig = structuredClone(rotationConfig);
  assignedConfig.reserved.RESERVED_01 = { questionId: 118, activeFrom: "2026-09-15" };

  assert.equal(selector.selectQuestionRotation({ date: "2026-09-14", rotationConfig: assignedConfig }).questionId, 17);
  assert.equal(selector.selectQuestionRotation({ date: "2026-09-15", rotationConfig: assignedConfig }).questionId, 118);
  assert.equal(selector.selectQuestionRotation({ date: "2026-09-16", rotationConfig: assignedConfig }).questionId, 41);
});
