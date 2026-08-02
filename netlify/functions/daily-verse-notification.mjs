import notificationCore from "./_daily-verse-notification-core.js";

const { getTorontoParts, sendDailyVerseNotifications } = notificationCore;

export default async function handler(request) {
  const startedAt = new Date();
  const invocationType = "scheduled";
  const torontoParts = getTorontoParts(startedAt);

  console.info("[Bible for All] Scheduled Daily Verse notification function start.", {
    invocationType,
    utcTime: startedAt.toISOString(),
    torontoTime: `${torontoParts.year}-${torontoParts.month}-${torontoParts.day} ${torontoParts.hour}:${torontoParts.minute}:${torontoParts.second}`,
    method: request?.method || null,
    force: false
  });

  if (Number(torontoParts.hour) !== 10) {
    const result = {
      skipped: true,
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
