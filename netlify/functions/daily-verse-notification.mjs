import notificationCore from "./_daily-verse-notification-core.js";

const { sendDailyVerseNotification } = notificationCore;

export default async function handler(request) {
  const startedAt = new Date();
  const invocationType = "scheduled";

  console.info("[Bible for All] Scheduled Daily Verse notification function start.", {
    invocationType,
    utcTime: startedAt.toISOString(),
    method: request?.method || null,
    force: false
  });

  try {
    const result = await sendDailyVerseNotification({ source: invocationType, force: false });
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
  schedule: "30 21 * * *"
};
