const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TORONTO_TIME_ZONE = process.env.NOTIFICATION_TZ || "America/Toronto";
const DEFAULT_SITE_URL = "https://bibleforall.ca";
const START_DATE = "2026-04-30";
const ONESIGNAL_NOTIFICATION_ENDPOINT = "https://api.onesignal.com/notifications?c=push";
const ONESIGNAL_NOTIFICATION_VIEW_ENDPOINT = "https://api.onesignal.com/notifications";
const QUESTION_JSON_FILES = [
  "question-1-30.json",
  "question-31-60.json",
  "question-61-90.json"
];

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

function getQuestionDayNumber(date = new Date()) {
  const parts = getTorontoParts(date);
  const todayUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  const [startYear, startMonth, startDay] = START_DATE.split("-").map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);

  return Math.floor((todayUtc - startUtc) / 86400000) + 1;
}

function loadDailyQuestions() {
  const questionsDir = path.resolve(__dirname, "../../data/questions");
  return QUESTION_JSON_FILES.flatMap(fileName => {
    const filePath = path.join(questionsDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(data?.questions) ? data.questions : [];
  });
}

function getCurrentDailyQuestion(date = new Date()) {
  const currentQuestionNumber = getQuestionDayNumber(date);
  const questions = loadDailyQuestions();
  let selected = null;

  for (const question of questions) {
    const day = Number(question.day);
    if (Number.isInteger(day) && day <= currentQuestionNumber) {
      selected = question;
    }
  }

  if (!selected) {
    selected = questions[0] || null;
  }

  if (!selected) {
    throw new Error("No Daily Question records were found.");
  }

  return {
    day: Number(selected.day),
    currentQuestionNumber,
    question: selected
  };
}

function getDailyQuestionUrl(day, language) {
  const baseUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const pathPrefix = language === "ru" ? "/ru/" : "/";
  return `${baseUrl}${pathPrefix}?question=${encodeURIComponent(day)}`;
}

function buildNotificationPayload({ language, force = false, source = "", testLabel = "22:15 EDT" } = {}) {
  const now = new Date();
  const parts = getTorontoParts(now);
  const { day, currentQuestionNumber, question } = getCurrentDailyQuestion(now);
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const url = getDailyQuestionUrl(day, language);
  const questionText = question?.[`question_${language}`] || question?.question_ru || "Вопрос дня";
  const heading = language === "ru" ? "Вопрос дня" : "Question of the Day";
  const notificationSource = source === "scheduled" ? "Scheduled" : "Manual";

  return {
    app_id: requireEnv("ONESIGNAL_APP_ID"),
    name: `UAT ${notificationSource} Daily Question TEST ${testLabel} - Question ${day} - ${dateKey} - ${language.toUpperCase()}`,
    target_channel: "push",
    filters: [
      { field: "tag", key: "notifications_phase", relation: "=", value: "uat" },
      { operator: "AND" },
      { field: "tag", key: "daily_question", relation: "=", value: "true" },
      { operator: "AND" },
      { field: "tag", key: "lang", relation: "=", value: language }
    ],
    headings: {
      [language]: heading,
      en: heading
    },
    contents: {
      [language]: questionText,
      en: questionText
    },
    web_url: url,
    chrome_web_icon: `${(process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "")}/images/favicon.png`,
    idempotency_key: force
      ? crypto.randomUUID()
      : createIdempotencyUuid(`daily-question-${language}-uat-test-2215-${dateKey}-question-${day}`),
    data: {
      content_type: "daily-question",
      language,
      day,
      calculated_day: currentQuestionNumber,
      phase: "uat",
      force
    }
  };
}

async function sendDailyQuestionNotification(options = {}) {
  const languages = Array.isArray(options.languages) && options.languages.length
    ? options.languages
    : ["ru", "en"];
  const startDate = new Date();
  const startParts = getTorontoParts(startDate);
  const appId = process.env.ONESIGNAL_APP_ID || "";
  const source = options.source || (options.force ? "manual-test" : "scheduled");
  const credentialContext = {
    source,
    appIdMasked: maskValue(appId),
    appIdEnvName: "ONESIGNAL_APP_ID",
    restApiKeyEnvName: "ONESIGNAL_REST_API_KEY",
    hasAppId: Boolean(appId),
    hasRestApiKey: Boolean(process.env.ONESIGNAL_REST_API_KEY),
    endpoint: ONESIGNAL_NOTIFICATION_ENDPOINT
  };

  console.info("[Bible for All] Daily Question notification function started.", {
    isoTime: startDate.toISOString(),
    torontoTime: `${startParts.year}-${startParts.month}-${startParts.day} ${startParts.hour}:${startParts.minute}:${startParts.second}`,
    timeZone: TORONTO_TIME_ZONE,
    force: Boolean(options.force),
    siteUrl: process.env.SITE_URL || DEFAULT_SITE_URL,
    languages,
    credentialContext
  });

  const results = [];

  for (const language of languages) {
    const payload = buildNotificationPayload({ ...options, language, source });

    console.info("[Bible for All] Daily Question notification selected content.", {
      language,
      day: payload.data.day,
      calculatedDay: payload.data.calculated_day,
      url: payload.web_url,
      idempotencyKey: payload.idempotency_key,
      filters: payload.filters,
      requestPayload: maskNotificationPayload(payload)
    });

    console.info("[Bible for All] Daily Question notification calling OneSignal.", {
      source,
      force: Boolean(options.force),
      language,
      endpoint: ONESIGNAL_NOTIFICATION_ENDPOINT,
      idempotencyKey: payload.idempotency_key,
      appIdMasked: maskValue(payload.app_id)
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

    console.info("[Bible for All] Daily Question OneSignal response received.", {
      language,
      status: response.status,
      ok: response.ok,
      rawOneSignalResponseText: responseText,
      oneSignalResponse: body
    });

    if (!response.ok) {
      const error = new Error(`OneSignal Daily Question send failed with ${response.status}.`);
      error.statusCode = response.status;
      error.body = body;
      throw error;
    }

    const notificationId = body?.id || null;
    const deliveryResult = notificationId
      ? await viewOneSignalNotification(notificationId)
      : null;

    results.push({
      skipped: false,
      language,
      source: credentialContext.source,
      force: Boolean(options.force),
      day: payload.data.day,
      url: payload.web_url,
      idempotency_key: payload.idempotency_key,
      oneSignalHttpStatus: response.status,
      oneSignalRawResponseText: responseText,
      oneSignal: body,
      oneSignalDelivery: deliveryResult
    });
  }

  return {
    skipped: false,
    source: credentialContext.source,
    force: Boolean(options.force),
    credentialContext,
    results
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

  console.info("[Bible for All] Daily Question OneSignal delivery lookup response received.", {
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
  getCurrentDailyQuestion,
  getDailyQuestionUrl,
  getQuestionDayNumber,
  getTorontoParts,
  sendDailyQuestionNotification
};
