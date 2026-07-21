import notificationCore from "./_daily-verse-notification-core.js";

const { sendDailyVerseNotification } = notificationCore;

export default async function handler(request) {
  try {
    const body = await readScheduleBody(request);
    console.info("[Bible for All] Scheduled Daily Verse notification invoked by Netlify.", {
      nextRun: body?.next_run || null
    });

    const result = await sendDailyVerseNotification({ source: "scheduled" });
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
  schedule: "0 13 * * *"
};

async function readScheduleBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
