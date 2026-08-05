import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const core = require("./_daily-verse-notification-core.js");

const ENV_KEYS = [
  "NODE_ENV",
  "DAILY_VERSE_LOCAL_TEST",
  "DAILY_VERSE_SCHEDULE_ENABLED",
  "ONESIGNAL_APP_ID",
  "ONESIGNAL_REST_API_KEY",
  "SITE_URL",
  "NOTIFICATION_TZ",
  "NETLIFY",
  "CONTEXT"
];

const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));
const ORIGINAL_FETCH = globalThis.fetch;

function resetEnv() {
  for (const key of ENV_KEYS) {
    if (ORIGINAL_ENV[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = ORIGINAL_ENV[key];
    }
  }
}

function applyTestEnv(overrides = {}) {
  resetEnv();
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }
}

function makeTorontoNoonUtc(dateKey) {
  return `${dateKey}T16:00:00.000Z`;
}

test.afterEach(() => {
  resetEnv();
  globalThis.fetch = ORIGINAL_FETCH;
});

test("A valid stored record can still be selected by exact day and date", () => {
  applyTestEnv({
    NODE_ENV: "test",
    DAILY_VERSE_LOCAL_TEST: "true"
  });

  const selection = core.getDailyVerseForNotification(
    {
      localTestDay: 122,
      localTestDate: "2026-08-05"
    },
    new Date(makeTorontoNoonUtc("2026-08-05"))
  );

  assert.equal(selection.day, 122);
  assert.equal(selection.expectedDateKey, "2026-08-05");
  assert.equal(selection.selectedVerseId, "daily-2026-08-05");
  assert.equal(selection.skipReason, null);
});

test("If the scheduled day/date does not exactly match a stored record, nothing is sent", async () => {
  applyTestEnv({
    NODE_ENV: "test",
    DAILY_VERSE_LOCAL_TEST: "true",
    SITE_URL: "https://example.com"
  });

  const selection = core.getCurrentDailyVerse(new Date(makeTorontoNoonUtc("2026-08-05")));
  assert.equal(selection.day, 123);
  assert.equal(selection.expectedDateKey, "2026-08-05");
  assert.equal(selection.selectedVerseId, null);
  assert.equal(selection.skipReason, "day-date-mismatch");

  const result = await core.sendDailyVerseNotification({
    source: "manual-test",
    force: true,
    localDryRun: true,
    language: "en",
    now: makeTorontoNoonUtc("2026-08-05")
  });

  assert.equal(result.skipped, true);
  assert.equal(result.skip_reason, "day-date-mismatch");
});

test("A later valid record remains selectable without renumbering earlier records", async () => {
  applyTestEnv({
    NODE_ENV: "test",
    DAILY_VERSE_LOCAL_TEST: "true",
    SITE_URL: "https://example.com"
  });

  const selection = core.getDailyVerseForNotification(
    {
      localTestDay: 123,
      localTestDate: "2026-08-06"
    },
    new Date(makeTorontoNoonUtc("2026-08-06"))
  );

  assert.equal(selection.day, 123);
  assert.equal(selection.selectedVerseId, "daily-2026-08-06");
  assert.equal(selection.skipReason, null);

  const result = await core.sendDailyVerseNotification({
    source: "manual-test",
    force: true,
    localDryRun: true,
    language: "ru",
    now: makeTorontoNoonUtc("2026-08-06"),
    localTestDay: 123,
    localTestDate: "2026-08-06"
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.day, 123);
  assert.equal(result.expectedDateKey, "2026-08-06");
});

test("Mismatched day and date is rejected explicitly", () => {
  applyTestEnv({
    NODE_ENV: "test",
    DAILY_VERSE_LOCAL_TEST: "true"
  });

  const selection = core.getDailyVerseForNotification(
    {
      localTestDay: 123,
      localTestDate: "2026-08-06"
    },
    new Date(makeTorontoNoonUtc("2026-08-06"))
  );

  assert.equal(selection.selectedVerseId, null);
  assert.equal(selection.skipReason, "day-date-mismatch");
  assert.equal(selection.exactDayMatchId, "daily-2026-08-05");
  assert.equal(selection.exactDateMatchId, "daily-2026-08-06");
});

test("Scheduled sending disabled skips before OneSignal", async () => {
  applyTestEnv({
    DAILY_VERSE_SCHEDULE_ENABLED: "false"
  });

  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called when schedule is disabled");
  };

  const result = await core.sendDailyVerseNotification({
    source: "scheduled",
    language: "en",
    now: makeTorontoNoonUtc("2026-08-05")
  });

  assert.equal(result.skipped, true);
  assert.equal(result.skip_reason, "non-production-site");
  assert.equal(fetchCalled, false);
});

test("Scheduled sending enabled uses the exact day/date record and OneSignal once", async () => {
  applyTestEnv({
    DAILY_VERSE_SCHEDULE_ENABLED: "true",
    ONESIGNAL_APP_ID: "test-app-id",
    ONESIGNAL_REST_API_KEY: "test-rest-key",
    SITE_URL: "https://example.com"
  });

  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, init });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ recipients: 7 })
    };
  };

  const result = await core.sendDailyVerseNotification({
    source: "scheduled",
    language: "en",
    now: makeTorontoNoonUtc("2026-08-05")
  });

  assert.equal(requests.length, 1);
  const payload = JSON.parse(requests[0].init.body);
  assert.equal(payload.data.day, 123);
  assert.equal(payload.data.calculated_day, 123);
  assert.equal(payload.contents.en, "Don't Envy Those Who Don't Follow the Lord");
  assert.equal(result.recipientCount, 7);
  assert.equal(result.day, 123);
});
