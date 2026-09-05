const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const DailyVerseSelector = require("../../js/daily-verse-selector.js");

const TORONTO_TIME_ZONE = DailyVerseSelector.TORONTO_TIME_ZONE;
const DEFAULT_SITE_URL = "https://bibleforall.ca";
const ONESIGNAL_NOTIFICATION_ENDPOINT = "https://api.onesignal.com/notifications?c=push";
const ONESIGNAL_NOTIFICATION_VIEW_ENDPOINT = "https://api.onesignal.com/notifications";
const DAILY_VERSE_SCHEDULE_ENABLED_ENV = "DAILY_VERSE_SCHEDULE_ENABLED";
const DAILY_JSON_FILES = [
  "daily-1-30.json",
  "daily-31-60.json",
  "daily-61-90.json",
  "daily-91-120.json",
  "daily-121-150.json",
  "daily-151-180.json"
];
const ROTATION_CONFIG_FILE = path.resolve(__dirname, "../../data/daily/verse-rotation.json");
const {
  getDayNumberFromEaster,
  getTorontoDateKey,
  getTorontoParts,
  selectDailyVerse
} = DailyVerseSelector;

function getDailyFileNameForDay(day) {
  const normalizedDay = Number(day);
  if (!Number.isInteger(normalizedDay) || normalizedDay <= 0) return null;
  if (normalizedDay <= 30) return "daily-1-30.json";
  if (normalizedDay <= 60) return "daily-31-60.json";
  if (normalizedDay <= 90) return "daily-61-90.json";
  if (normalizedDay <= 120) return "daily-91-120.json";
  if (normalizedDay <= 150) return "daily-121-150.json";
  if (normalizedDay <= 180) return "daily-151-180.json";
  return null;
}

function getVerseDateKey(verse) {
  if (!verse || typeof verse !== "object") return null;

  const explicitDate = String(verse.date || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicitDate)) {
    return explicitDate;
  }

  const id = String(verse.id || "").trim();
  const idMatch = /^daily-(\d{4}-\d{2}-\d{2})$/.exec(id);
  return idMatch ? idMatch[1] : null;
}

function loadDailyVerses() {
  const dailyDir = path.resolve(__dirname, "../../data/daily");
  return DAILY_JSON_FILES.flatMap(fileName => {
    const filePath = path.join(dailyDir, fileName);

    if (!fs.existsSync(filePath)) {
      console.warn(`[Bible for All] Daily Verse data file is unavailable: ${fileName}`);
      return [];
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(data?.verses) ? data.verses : [];
  });
}

function loadVerseRotationConfig() {
  try {
    return JSON.parse(fs.readFileSync(ROTATION_CONFIG_FILE, "utf8"));
  } catch (error) {
    console.warn("[Bible for All] Daily Verse rotation configuration is unavailable.", {
      filePath: ROTATION_CONFIG_FILE,
      message: error.message
    });
    return null;
  }
}

function loadDailyVersesFromFile(fileName) {
  if (!fileName) {
    return {
      fileName: null,
      filePath: null,
      exists: false,
      verses: []
    };
  }

  const dailyDir = path.resolve(__dirname, "../../data/daily");
  const filePath = path.join(dailyDir, fileName);

  if (!fs.existsSync(filePath)) {
    console.warn(`[Bible for All] Daily Verse data file is unavailable: ${fileName}`);
    return {
      fileName,
      filePath,
      exists: false,
      verses: []
    };
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return {
    fileName,
    filePath,
    exists: true,
    verses: Array.isArray(data?.verses) ? data.verses : []
  };
}

function getExactDailyVerseSelection({ day, expectedDateKey }) {
  const selectedFileName = getDailyFileNameForDay(day);
  const selectedFile = loadDailyVersesFromFile(selectedFileName);
  const verses = selectedFile.verses;
  const exactDayMatch = verses.find(verse => Number(verse.day) === Number(day)) || null;
  const exactDateMatch = verses.find(verse => getVerseDateKey(verse) === expectedDateKey) || null;
  const exactDayDateMatch = verses.find(verse =>
    Number(verse.day) === Number(day) && getVerseDateKey(verse) === expectedDateKey
  ) || null;

  let skipReason = null;

  if (!exactDayDateMatch) {
    if (exactDayMatch && exactDateMatch && exactDayMatch.id !== exactDateMatch.id) {
      skipReason = "day-date-mismatch";
    } else {
      skipReason = "exact-day-date-record-not-found";
    }
  }

  return {
    day: Number(day),
    expectedDateKey,
    selectedFileName,
    selectedFileExists: selectedFile.exists,
    exactDayMatchFound: Boolean(exactDayMatch),
    exactDateMatchFound: Boolean(exactDateMatch),
    exactDayMatchId: exactDayMatch?.id || null,
    exactDateMatchId: exactDateMatch?.id || null,
    exactDayMatchDateKey: getVerseDateKey(exactDayMatch),
    exactDateMatchDateKey: getVerseDateKey(exactDateMatch),
    selectedVerseId: exactDayDateMatch?.id || null,
    selectedVerseDateKey: getVerseDateKey(exactDayDateMatch),
    verse: exactDayDateMatch,
    skipReason
  };
}

function getDailyVerseSelectionById(verseId) {
  const selectedFileName = getDailyFileNameForDay(verseId);
  const selectedFile = loadDailyVersesFromFile(selectedFileName);
  const verse = selectedFile.verses.find(candidate => Number(candidate.day) === Number(verseId)) || null;

  return {
    day: Number(verseId),
    selectedFileName,
    selectedFileExists: selectedFile.exists,
    selectedVerseId: verse?.id || null,
    selectedVerseDateKey: getVerseDateKey(verse),
    verse,
    skipReason: verse ? null : "rotation-verse-content-not-found"
  };
}

function getCurrentDailyVerse(date = new Date()) {
  const expectedDateKey = getTorontoDateKey(date);
  const rotationConfig = loadVerseRotationConfig();
  const decision = rotationConfig
    ? selectDailyVerse({ date, rotationConfig })
    : {
        dateKey: expectedDateKey,
        verseId: null,
        legacyDayNumber: getDayNumberFromEaster(date),
        source: "rotation",
        skipReason: "rotation-config-unavailable"
      };
  const isLegacyDate = rotationConfig && expectedDateKey < rotationConfig.rotationStartDate;
  const selection = decision.verseId
    ? (isLegacyDate
        ? getExactDailyVerseSelection({ day: decision.verseId, expectedDateKey })
        : getDailyVerseSelectionById(decision.verseId))
    : {
        selectedFileName: null,
        selectedFileExists: false,
        selectedVerseId: null,
        selectedVerseDateKey: null,
        verse: null,
        skipReason: decision.skipReason || "rotation-verse-content-not-found"
      };
  const verses = loadDailyVerses();
  const highestAvailableDay = verses.reduce((highest, verse) => {
    const day = Number(verse.day);
    return Number.isInteger(day) ? Math.max(highest, day) : highest;
  }, 0);

  return {
    day: decision.verseId,
    verseId: decision.verseId,
    currentDayNumber: decision.legacyDayNumber,
    highestAvailableDay,
    expectedDateKey,
    selectionSource: decision.source,
    rotationSlotId: decision.slotId || null,
    rotationSlotIndex: decision.rotationSlotIndex ?? null,
    verse: selection.verse,
    selectedFileName: selection.selectedFileName,
    selectedFileExists: selection.selectedFileExists,
    selectedVerseId: selection.selectedVerseId,
    selectedVerseDateKey: selection.selectedVerseDateKey,
    exactDayMatchFound: selection.exactDayMatchFound ?? Boolean(selection.verse),
    exactDateMatchFound: selection.exactDateMatchFound ?? null,
    exactDayMatchId: selection.exactDayMatchId ?? selection.selectedVerseId,
    exactDateMatchId: selection.exactDateMatchId ?? null,
    exactDayMatchDateKey: selection.exactDayMatchDateKey ?? selection.selectedVerseDateKey,
    exactDateMatchDateKey: selection.exactDateMatchDateKey ?? null,
    skipReason: decision.skipReason || selection.skipReason
  };
}

function getDailyVerseForNotification(options = {}, date = new Date()) {
  const current = getCurrentDailyVerse(date);
  const localTestDay = Number(options.localTestDay);

  if (!Number.isInteger(localTestDay)) {
    return current;
  }

  assertLocalTestMode();
  const expectedDateKey = typeof options.localTestDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(options.localTestDate)
    ? options.localTestDate
    : current.expectedDateKey;
  const selection = getExactDailyVerseSelection({
    day: localTestDay,
    expectedDateKey
  });

  return {
    day: localTestDay,
    currentDayNumber: localTestDay,
    highestAvailableDay: current.highestAvailableDay,
    expectedDateKey,
    verse: selection.verse,
    selectedFileName: selection.selectedFileName,
    selectedFileExists: selection.selectedFileExists,
    selectedVerseId: selection.selectedVerseId,
    selectedVerseDateKey: selection.selectedVerseDateKey,
    exactDayMatchFound: selection.exactDayMatchFound,
    exactDateMatchFound: selection.exactDateMatchFound,
    exactDayMatchId: selection.exactDayMatchId,
    exactDateMatchId: selection.exactDateMatchId,
    exactDayMatchDateKey: selection.exactDayMatchDateKey,
    exactDateMatchDateKey: selection.exactDateMatchDateKey,
    skipReason: selection.skipReason
  };
}

function getUnavailableVerseReason(selection, language) {
  const verse = selection?.verse;
  const reference = language === "ru" ? verse?.reference_ru : verse?.reference_en;
  const verseText = language === "ru" ? verse?.text_ru : verse?.text_en;
  const notificationText = verse?.topic?.[language];

  if (!selection || !verse) {
    if (selection?.skipReason) {
      return selection.skipReason;
    }

    if (selection?.skipReason === "day-date-mismatch") {
      return "day-date-mismatch";
    }

    if (selection?.skipReason === "exact-day-date-record-not-found") {
      return "exact-day-date-record-not-found";
    }

    if (selection?.day > selection?.highestAvailableDay) {
      return "exact-day-date-record-not-found";
    }

    return "exact-day-date-record-not-found";
  }

  if (!String(reference || "").trim()) {
    return "daily-verse-reference-missing";
  }

  if (!String(verseText || "").trim()) {
    return "daily-verse-text-missing";
  }

  if (!String(notificationText || "").trim()) {
    return "daily-verse-notification-text-missing";
  }

  return null;
}

function isScheduledSendingEnabled() {
  return String(process.env[DAILY_VERSE_SCHEDULE_ENABLED_ENV] || "").trim().toLowerCase() === "true";
}

function getDailyVerseUrl(day, language = "ru") {
  const baseUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const pathPrefix = language === "ru" ? "/ru/" : "/";
  return `${baseUrl}${pathPrefix}?day=${encodeURIComponent(day)}`;
}

function buildNotificationPayload({ force = false, source = "", language = "ru", selection = null, now = new Date(), localDryRun = false } = {}) {
  const parts = getTorontoParts(now);
  const { day, currentDayNumber, verse } = selection || getCurrentDailyVerse(now);
  const normalizedLanguage = language === "en" ? "en" : "ru";
  const url = getDailyVerseUrl(day, normalizedLanguage);
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const notificationSource = source === "scheduled" ? "Scheduled" : "Manual";
  const heading = normalizedLanguage === "ru" ? "Стих дня" : "Daily Verse";
  const topic = verse?.topic?.[normalizedLanguage] || heading;
  const appId = process.env.ONESIGNAL_APP_ID || "";

  if (localDryRun && !appId) {
    assertLocalTestMode();
  }

  return {
    app_id: appId || "local-dry-run",
    name: `${notificationSource} Daily Verse - Day ${day} - ${dateKey} - ${normalizedLanguage.toUpperCase()}`,
    target_channel: "push",
    filters: [
      { field: "tag", key: "daily_verse_language", relation: "=", value: normalizedLanguage }
    ],
    headings: {
      ru: heading,
      en: heading
    },
    contents: {
      ru: topic,
      en: topic
    },
    web_url: url,
    chrome_web_icon: `${(process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "")}/images/favicon.png`,
    idempotency_key: force
      ? crypto.randomUUID()
      : createIdempotencyUuid(`daily-verse-${normalizedLanguage}-production-scheduled-1000-toronto-${dateKey}-day-${day}`),
    data: {
      content_type: "daily-verse",
      language: normalizedLanguage,
      day,
      calculated_day: currentDayNumber,
      phase: "production",
      force
    }
  };
}

async function sendDailyVerseNotifications(options = {}) {
  const languages = Array.isArray(options.languages) && options.languages.length
    ? options.languages
    : ["ru", "en"];
  const results = [];

  for (const language of languages) {
    results.push(await sendDailyVerseNotification({ ...options, language }));
  }

  return results;
}

async function sendDailyVerseNotification(options = {}) {
  const startDate = options.now ? new Date(options.now) : new Date();
  const startParts = getTorontoParts(startDate);
  const appId = process.env.ONESIGNAL_APP_ID || "";
  const source = options.source || (options.force ? "manual-test" : "scheduled");
  const scheduleEnabled = isScheduledSendingEnabled();
  const credentialContext = {
    source,
    appIdMasked: maskValue(appId),
    appIdEnvName: "ONESIGNAL_APP_ID",
    restApiKeyEnvName: "ONESIGNAL_REST_API_KEY",
    hasAppId: Boolean(appId),
    hasRestApiKey: Boolean(process.env.ONESIGNAL_REST_API_KEY),
    endpoint: ONESIGNAL_NOTIFICATION_ENDPOINT
  };

  console.info("[Bible for All] Daily Verse notification function started.", {
    isoTime: startDate.toISOString(),
    torontoTime: `${startParts.year}-${startParts.month}-${startParts.day} ${startParts.hour}:${startParts.minute}:${startParts.second}`,
    timeZone: TORONTO_TIME_ZONE,
    force: Boolean(options.force),
    siteUrl: process.env.SITE_URL || DEFAULT_SITE_URL,
    credentialContext
  });

  console.info("[Bible for All] Daily Verse notification will run. Timing is controlled by Netlify cron.");
  console.info("[Bible for All] Daily Verse notification environment check.", {
    source,
    hasAppId: Boolean(process.env.ONESIGNAL_APP_ID),
    hasRestApiKey: Boolean(process.env.ONESIGNAL_REST_API_KEY),
    hasSiteUrl: Boolean(process.env.SITE_URL),
    hasNotificationTz: Boolean(process.env.NOTIFICATION_TZ),
    scheduledSendingEnabled: scheduleEnabled,
    force: Boolean(options.force)
  });

  if (source === "scheduled" && !scheduleEnabled) {
    const skippedResult = {
      sent: false,
      skipped: true,
      skip_reason: "non-production-site",
      reason: "Daily Verse scheduled sending is disabled for this site.",
      language: options.language === "en" ? "en" : "ru",
      torontoDate: getTorontoDateKey(startDate)
    };

    console.info("[Bible for All] Daily Verse scheduled notification skipped before OneSignal.", skippedResult);
    return skippedResult;
  }

  const normalizedLanguage = options.language === "en" ? "en" : "ru";
  const selection = getDailyVerseForNotification(options, startDate);
  const unavailableReason = getUnavailableVerseReason(selection, normalizedLanguage);

  console.info("[Bible for All] Daily Verse notification selection diagnostics.", {
    source,
    invocationSource: source,
    torontoDate: `${startParts.year}-${startParts.month}-${startParts.day}`,
    torontoTime: `${startParts.hour}:${startParts.minute}:${startParts.second}`,
    calculatedDay: selection.currentDayNumber,
    requestedDay: selection.day,
    expectedDateKey: selection.expectedDateKey,
    selectedDataFile: selection.selectedFileName,
    selectedDataFileExists: selection.selectedFileExists,
    verseFound: Boolean(selection.verse),
    selectedVerseId: selection.selectedVerseId,
    selectedVerseDateKey: selection.selectedVerseDateKey,
    exactDayMatchFound: selection.exactDayMatchFound,
    exactDateMatchFound: selection.exactDateMatchFound,
    exactDayMatchId: selection.exactDayMatchId,
    exactDateMatchId: selection.exactDateMatchId,
    exactDayMatchDateKey: selection.exactDayMatchDateKey,
    exactDateMatchDateKey: selection.exactDateMatchDateKey,
    skipReason: selection.skipReason,
    exactReferenceRu: selection.verse?.reference_ru || null,
    exactReferenceEn: selection.verse?.reference_en || null
  });

  if (unavailableReason) {
    const skippedResult = {
      sent: false,
      skipped: true,
      skip_reason: unavailableReason,
      reason: unavailableReason,
      day: selection.day,
      calculatedDay: selection.currentDayNumber,
      expectedDateKey: selection.expectedDateKey,
      selectedDataFile: selection.selectedFileName,
      verseFound: Boolean(selection.verse),
      language: normalizedLanguage
    };

    console.info("[Bible for All] Daily Verse skipped before OneSignal.", skippedResult);
    return skippedResult;
  }

  const payload = buildNotificationPayload({
    ...options,
    language: normalizedLanguage,
    selection,
    now: startDate
  });
  console.info("[Bible for All] Daily Verse notification selected content.", {
    day: payload.data.day,
    calculatedDay: payload.data.calculated_day,
    url: payload.web_url,
    idempotencyKey: payload.idempotency_key,
    filters: payload.filters,
    requestPayload: maskNotificationPayload(payload)
  });

  if (options.localDryRun) {
    assertLocalTestMode();
    console.info("[Bible for All] Local Daily Verse dry run reached the OneSignal send boundary.", {
      day: payload.data.day,
      language: normalizedLanguage,
      endpoint: ONESIGNAL_NOTIFICATION_ENDPOINT
    });

    return {
      sent: false,
      skipped: false,
      dryRun: true,
      day: payload.data.day,
      url: payload.web_url,
      selectedDataFile: selection.selectedFileName,
      expectedDateKey: selection.expectedDateKey
    };
  }

  console.info("[Bible for All] Daily Verse notification calling OneSignal.", {
    source,
    force: Boolean(options.force),
    endpoint: ONESIGNAL_NOTIFICATION_ENDPOINT,
    idempotencyKey: payload.idempotency_key,
    appIdMasked: maskValue(payload.app_id),
    selectedDataFile: selection.selectedFileName,
    verseFound: true,
    language: normalizedLanguage
  });

  const response = await fetch(ONESIGNAL_NOTIFICATION_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Key ${requireEnv("ONESIGNAL_REST_API_KEY")}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let body;

  try {
    body = responseText ? JSON.parse(responseText) : {};
  } catch {
    body = { raw: responseText };
  }

  console.info("[Bible for All] OneSignal notification response received.", {
    status: response.status,
    ok: response.ok,
    language: normalizedLanguage,
    recipientCount: body?.recipients ?? body?.total_count ?? null,
    rawOneSignalResponseText: responseText,
    oneSignalResponse: body
  });

  if (!response.ok) {
    const error = new Error(`OneSignal send failed with ${response.status}.`);
    error.statusCode = response.status;
    error.body = body;
    throw error;
  }

  const notificationId = body?.id || null;
  const deliveryResult = notificationId
    ? await viewOneSignalNotification(notificationId)
    : null;

  return {
    skipped: false,
    source: credentialContext.source,
    force: Boolean(options.force),
    day: payload.data.day,
    url: payload.web_url,
    idempotency_key: payload.idempotency_key,
    credentialContext,
    oneSignalHttpStatus: response.status,
    oneSignalRawResponseText: responseText,
    oneSignal: body,
    recipientCount: body?.recipients ?? body?.total_count ?? null,
    oneSignalDelivery: deliveryResult
  };
}

async function viewOneSignalNotification(notificationId) {
  await delay(3000);

  const appId = requireEnv("ONESIGNAL_APP_ID");
  const viewUrl = `${ONESIGNAL_NOTIFICATION_VIEW_ENDPOINT}/${encodeURIComponent(notificationId)}?app_id=${encodeURIComponent(appId)}`;
  const response = await fetch(viewUrl, {
    method: "GET",
    headers: {
      "Authorization": `Key ${requireEnv("ONESIGNAL_REST_API_KEY")}`
    }
  });

  const responseText = await response.text();
  let body;

  try {
    body = responseText ? JSON.parse(responseText) : {};
  } catch {
    body = { raw: responseText };
  }

  console.info("[Bible for All] OneSignal delivery lookup response received.", {
    status: response.status,
    ok: response.ok,
    notificationId,
    rawOneSignalDeliveryResponseText: responseText,
    oneSignalDeliveryResponse: body
  });

  return {
    httpStatus: response.status,
    rawResponseText: responseText,
    response: body
  };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function assertLocalTestMode() {
  const isLocalTest = process.env.NODE_ENV === "test"
    && process.env.DAILY_VERSE_LOCAL_TEST === "true"
    && !process.env.NETLIFY
    && !process.env.CONTEXT;

  if (!isLocalTest) {
    throw new Error("Daily Verse local test overrides are disabled outside explicit local test mode.");
  }
}

function createIdempotencyUuid(seed) {
  const hex = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}`,
    hex.slice(20, 32)
  ].join("-");
}

function maskValue(value) {
  if (!value) return "";
  if (value.length <= 8) return `${value.slice(0, 2)}...${value.slice(-2)}`;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function maskNotificationPayload(payload) {
  return {
    ...payload,
    app_id: maskValue(payload.app_id)
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  buildNotificationPayload,
  getCurrentDailyVerse,
  getDailyVerseSelectionById,
  getDailyVerseForNotification,
  getExactDailyVerseSelection,
  getDailyVerseUrl,
  getDayNumberFromEaster,
  getTorontoParts,
  getTorontoDateKey,
  getVerseDateKey,
  isScheduledSendingEnabled,
  sendDailyVerseNotification,
  sendDailyVerseNotifications
};
