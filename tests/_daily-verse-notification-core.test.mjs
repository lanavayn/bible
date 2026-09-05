import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const selector = require("../js/daily-verse-selector.js");
const core = require("../netlify/functions/_daily-verse-notification-core.js");
const rotationConfig = JSON.parse(
  readFileSync(new URL("../data/daily/verse-rotation.json", import.meta.url), "utf8")
);

const ENV_KEYS = [
  "NODE_ENV",
  "DAILY_VERSE_LOCAL_TEST",
  "DAILY_VERSE_SCHEDULE_ENABLED",
  "ONESIGNAL_APP_ID",
  "ONESIGNAL_REST_API_KEY",
  "SITE_URL",
  "NETLIFY",
  "CONTEXT"
];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));

function resetEnv() {
  for (const key of ENV_KEYS) {
    if (ORIGINAL_ENV[key] === undefined) delete process.env[key];
    else process.env[key] = ORIGINAL_ENV[key];
  }
}

function makeTorontoNoonUtc(dateKey) {
  return new Date(`${dateKey}T16:00:00.000Z`);
}

test.afterEach(resetEnv);

test("approved rotation has the expected unique verse and reserved positions", () => {
  const validation = selector.validateRotationConfig(rotationConfig);
  const verseIds = rotationConfig.slots.filter(Number.isInteger);

  assert.equal(validation.valid, true);
  assert.equal(validation.positionCount, 165);
  assert.equal(validation.verseCount, 150);
  assert.equal(validation.reservedCount, 15);
  assert.deepEqual(validation.duplicateVerseIds, []);
  assert.equal(verseIds.includes(1), false);
  assert.equal(verseIds.includes(50), false);
  assert.equal(verseIds.includes(55), false);
  assert.equal(verseIds.includes(88), false);

  for (const verseId of [150, 151, 152, 153, 154]) {
    assert.equal(verseIds.includes(verseId), true);
  }
});

test("legacy Verse 154 is followed by the approved first rotation verse", () => {
  const legacy = selector.selectDailyVerse({ date: "2026-09-05", rotationConfig });
  const rotation = selector.selectDailyVerse({ date: "2026-09-06", rotationConfig });

  assert.equal(legacy.verseId, 154);
  assert.equal(legacy.source, "legacy");
  assert.equal(rotation.verseId, 5);
  assert.equal(rotation.source, "rotation");
});

test("an empty reserved slot skips forward without repeating a verse", () => {
  assert.equal(selector.selectDailyVerse({ date: "2026-09-16", rotationConfig }).verseId, 56);
  assert.equal(selector.selectDailyVerse({ date: "2026-09-17", rotationConfig }).verseId, 144);
});

test("an assigned reserved slot is selected only from its activation date", () => {
  const assignedConfig = structuredClone(rotationConfig);
  assignedConfig.reserved.RESERVED_01 = { verseId: 155, activeFrom: "2026-09-16" };

  assert.equal(selector.selectDailyVerse({ date: "2026-09-15", rotationConfig: assignedConfig }).verseId, 99);
  assert.equal(selector.selectDailyVerse({ date: "2026-09-16", rotationConfig: assignedConfig }).verseId, 155);
  assert.equal(selector.selectDailyVerse({ date: "2026-09-17", rotationConfig: assignedConfig }).verseId, 56);
});

test("Easter selects Verse 1 without consuming a normal rotation slot", () => {
  const easterConfig = {
    rotationStartDate: "2027-03-27",
    easterVerseId: 1,
    slots: [2, 3],
    reserved: {}
  };

  assert.equal(selector.selectDailyVerse({ date: "2027-03-27", rotationConfig: easterConfig }).verseId, 2);
  assert.equal(selector.selectDailyVerse({ date: "2027-03-28", rotationConfig: easterConfig }).verseId, 1);
  assert.equal(selector.selectDailyVerse({ date: "2027-03-29", rotationConfig: easterConfig }).verseId, 3);
  assert.equal(selector.getGregorianEasterDateKey(2026), "2026-04-05");
  assert.equal(selector.getGregorianEasterDateKey(2027), "2027-03-28");
  assert.match(selector.getGregorianEasterDateKey(2037), /^2037-\d{2}-\d{2}$/);
});

test("Netlify uses the shared selector and resolves rotation Verse 5", () => {
  const selection = core.getCurrentDailyVerse(makeTorontoNoonUtc("2026-09-06"));

  assert.equal(selection.selectionSource, "rotation");
  assert.equal(selection.day, 5);
  assert.equal(selection.selectedVerseId, "daily-2026-04-09");
  assert.equal(selection.skipReason, null);
});

test("a missing future verse remains an explicit notification skip", () => {
  const selection = core.getDailyVerseSelectionById(155);

  assert.equal(selection.verse, null);
  assert.equal(selection.skipReason, "rotation-verse-content-not-found");
});

test("a local dry run uses the rotation result without contacting OneSignal", async () => {
  process.env.NODE_ENV = "test";
  process.env.DAILY_VERSE_LOCAL_TEST = "true";
  process.env.SITE_URL = "https://example.com";

  const result = await core.sendDailyVerseNotification({
    source: "manual-test",
    force: true,
    localDryRun: true,
    language: "en",
    now: makeTorontoNoonUtc("2026-09-06")
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.day, 5);
  assert.equal(result.expectedDateKey, "2026-09-06");
});
