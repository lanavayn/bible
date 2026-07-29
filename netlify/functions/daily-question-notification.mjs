import notificationCore from "./_daily-question-notification-core.js";

const { sendDailyQuestionNotification } = notificationCore;

export default async function handler(request) {
  const startedAt = new Date();

  console.info("[Bible for All] Scheduled Daily Question notification function start.", {
    invocationType: "scheduled",
    utcTime: startedAt.toISOString(),
    method: request?.method || null,
    force: false
  });

  try {
    const result = await sendDailyQuestionNotification({
      source: "scheduled",
      force: false,
      languages: ["ru", "en"],
      testLabel: "22:45 EDT"
    });

    console.info("[Bible for All] Scheduled Daily Question notification result:", result);
    return Response.json(result);
  } catch (error) {
    console.error("[Bible for All] Scheduled Daily Question notification failed:", error);

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
  schedule: "45 2 * * *"
};
