import notificationCore from "./_daily-verse-notification-core.js";

const { getTorontoParts, sendDailyVerseNotifications } = notificationCore;

export default async function handler(request) {
  const startedAt = new Date();
  const invocationType = "scheduled";
  const torontoParts = getTorontoParts(startedAt);
  const scheduleEnabled = String(process.env.DAILY_VERSE_SCHEDULE_ENABLED || "").trim().toLowerCase() === "true";

  console.info("[Bible for All] Scheduled Daily Verse notification function start.", {
    invocationType,
    utcTime: startedAt.toISOString(),
    torontoTime: `${torontoParts.year}-${torontoParts.month}-${torontoParts.day} ${torontoParts.hour}:${torontoParts.minute}:${torontoParts.second}`,
    torontoDate: `${torontoParts.year}-${torontoParts.month}-${torontoParts.day}`,
    method: request?.method || null,
    scheduledSendingEnabled: scheduleEnabled,
    force: false
  });

  if (!scheduleEnabled) {
    const result = {
      skipped: true,
      skip_reason: "non-production-site",
      reason: "Daily Verse scheduled sending is disabled for this site.",
      utcTime: startedAt.toISOString(),
      torontoTime: `${torontoParts.year}-${torontoParts.month}-${torontoParts.day} ${torontoParts.hour}:${torontoParts.minute}:${torontoParts.second}`
    };

    console.info("[Bible for All] Scheduled Daily Verse notification skipped.", result);
    return Response.json(result);
  }

  if (Number(torontoParts.hour) !== 10) {
    const result = {
      skipped: true,
      skip_reason: "outside-toronto-send-hour",
      reason: "Current America/Toronto hour is not 10.",
      utcTime: startedAt.toISOString(),
      torontoTime: `${torontoParts.year}-${torontoParts.month}-${torontoParts.day} ${torontoParts.hour}:${torontoParts.minute}:${torontoParts.second}`
    };

    console.info("[Bible for All] Scheduled Daily Verse notification skipped.", result);
    return Response.json(result);
  }

  try {
    const result = await sendDailyVerseNotifications({ source: invocationType, force: false });
    console.info("[Bible for All] Scheduled Daily Verse notification result:", result);

    return Response.json(result);
  } catch (error) {
    console.error("[Bible for All] Scheduled Daily Verse notification failed:", error);

    return Response.json(
      {
        error: error.message,
        details: error.body || null
      },
      { status: error.statusCode || 500 }
    );
  }
}

export const config = {
  schedule: "0 14,15 * * *"
};
