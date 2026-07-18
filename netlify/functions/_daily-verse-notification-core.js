const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TORONTO_TIME_ZONE = process.env.NOTIFICATION_TZ || "America/Toronto";
const DEFAULT_SITE_URL = "https://bibleforall.ca";
const DAILY_JSON_FILES = [
  "daily-1-30.json",
  "daily-31-60.json",
  "daily-61-90.json",
  "daily-91-120.json"
];

const easterDates = {
  2026: "2026-04-05",
  2027: "2027-03-28",
  2028: "2028-04-16",
  2029: "2029-04-01",
  2030: "2030-04-21",
  2031: "2031-04-13",
  2032: "2032-03-28",
  2033: "2033-04-17",
  2034: "2034-04-09",
  2035: "2035-03-25",
  2036: "2036-04-13"
};

function getTorontoParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return Object.fromEntries(
    formatter.formatToParts(date)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, part.value])
  );
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function getDayNumberFromEaster(date = new Date()) {
  const parts = getTorontoParts(date);
  const todayUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  const easterThisYear = parseDate(easterDates[Number(parts.year)]);
  const easterUtc = todayUtc >= easterThisYear
    ? easterThisYear
    : parseDate(easterDates[Number(parts.year) - 1]);

  return Math.floor((todayUtc - easterUtc) / 86400000) + 1;
}

function loadDailyVerses() {
  const dailyDir = path.resolve(__dirname, "../../data/daily");
  return DAILY_JSON_FILES.flatMap(fileName => {
    const filePath = path.join(dailyDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(data?.verses) ? data.verses : [];
  });
}

function getCurrentDailyVerse(date = new Date()) {
  const currentDayNumber = getDayNumberFromEaster(date);
  const verses = loadDailyVerses();
  let selected = null;

  for (const verse of verses) {
    const day = Number(verse.day);
    if (Number.isInteger(day) && day <= currentDayNumber) {
      selected = verse;
    }
  }

  if (!selected) {
    selected = verses[0] || null;
  }

  if (!selected) {
    throw new Error("No Daily Verse records were found.");
  }

  return {
    day: Number(selected.day),
    currentDayNumber,
    verse: selected
  };
}

function getRussianDailyVerseUrl(day) {
  const baseUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
  return `${baseUrl}/ru/?day=${encodeURIComponent(day)}`;
}

function buildNotificationPayload({ force = false } = {}) {
  const now = new Date();
  const parts = getTorontoParts(now);
  const { day, currentDayNumber, verse } = getCurrentDailyVerse(now);
  const url = getRussianDailyVerseUrl(day);
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const topic = verse?.topic?.ru || "Стих дня";

  return {
    app_id: requireEnv("ONESIGNAL_APP_ID"),
    target_channel: "push",
    filters: [
      { field: "tag", key: "lang", relation: "=", value: "ru" },
      { operator: "AND" },
      { field: "tag", key: "daily_verse_ru", relation: "=", value: "true" },
      { operator: "AND" },
      { field: "tag", key: "notifications_phase", relation: "=", value: "uat" }
    ],
    headings: {
      ru: "Стих дня",
      en: "Стих дня"
    },
    contents: {
      ru: topic,
      en: topic
    },
    url,
    web_url: url,
    chrome_web_icon: `${(process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "")}/images/favicon.png`,
    idempotency_key: force
      ? crypto.randomUUID()
      : createIdempotencyUuid(`daily-verse-ru-uat-${dateKey}-day-${day}`),
    data: {
      content_type: "daily-verse",
      language: "ru",
      day,
      calculated_day: currentDayNumber,
      phase: "uat",
      force
    }
  };
}

function shouldSendNow(date = new Date()) {
  const parts = getTorontoParts(date);
  return parts.hour === "09" && parts.minute === "00";
}

async function sendDailyVerseNotification(options = {}) {
  const startDate = new Date();
  const startParts = getTorontoParts(startDate);
  console.info("[Bible for All] Daily Verse notification function started.", {
    isoTime: startDate.toISOString(),
    torontoTime: `${startParts.year}-${startParts.month}-${startParts.day} ${startParts.hour}:${startParts.minute}:${startParts.second}`,
    timeZone: TORONTO_TIME_ZONE,
    force: Boolean(options.force),
    hasAppId: Boolean(process.env.ONESIGNAL_APP_ID),
    hasRestApiKey: Boolean(process.env.ONESIGNAL_REST_API_KEY),
    siteUrl: process.env.SITE_URL || DEFAULT_SITE_URL
  });

  if (!options.force && !shouldSendNow()) {
    const parts = getTorontoParts(startDate);
    console.info("[Bible for All] Daily Verse notification skipped outside the 09:00 Toronto send window.", {
      localTime: `${parts.hour}:${parts.minute}:${parts.second}`
    });

    return {
      skipped: true,
      reason: `Current ${TORONTO_TIME_ZONE} time is ${parts.hour}:${parts.minute}, not 09:00.`,
      localTime: `${parts.hour}:${parts.minute}:${parts.second}`
    };
  }

  const payload = buildNotificationPayload(options);
  console.info("[Bible for All] Daily Verse notification selected content.", {
    day: payload.data.day,
    calculatedDay: payload.data.calculated_day,
    url: payload.url,
    idempotencyKey: payload.idempotency_key,
    filters: payload.filters
  });

  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${requireEnv("ONESIGNAL_REST_API_KEY")}`,
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
    notificationId: body?.id || null,
    recipients: body?.recipients ?? null,
    errors: body?.errors || null
  });

  if (!response.ok) {
    const error = new Error(`OneSignal send failed with ${response.status}.`);
    error.statusCode = response.status;
    error.body = body;
    throw error;
  }

  return {
    skipped: false,
    day: payload.data.day,
    url: payload.url,
    idempotency_key: payload.idempotency_key,
    oneSignal: body
  };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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

module.exports = {
  buildNotificationPayload,
  getCurrentDailyVerse,
  getDayNumberFromEaster,
  getRussianDailyVerseUrl,
  getTorontoParts,
  sendDailyVerseNotification,
  shouldSendNow
};
