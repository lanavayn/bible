import notificationCore from "./_daily-question-notification-core.js";

const { getTorontoParts, sendDailyQuestionNotification } = notificationCore;
const TEST_DATE = "2026-07-22";

export default async function handler(request) {
  const startedAt = new Date();
  const parts = getTorontoParts(startedAt);
  const torontoDate = `${parts.year}-${parts.month}-${parts.day}`;

  console.info("[Bible for All] Scheduled Daily Question UAT test function start.", {
    invocationType: "scheduled-test",
    utcTime: startedAt.toISOString(),
    torontoTime: `${torontoDate} ${parts.hour}:${parts.minute}:${parts.second}`,
    method: request?.method || null,
    testDate: TEST_DATE,
    force: false
  });

  if (torontoDate !== TEST_DATE) {
    const result = {
      skipped: true,
      reason: "Daily Question one-time UAT test is only allowed on the configured Toronto test date.",
      torontoDate,
      testDate: TEST_DATE
    };

    console.info("[Bible for All] Scheduled Daily Question UAT test skipped.", result);
    return Response.json(result);
  }

  try {
    const result = await sendDailyQuestionNotification({
      source: "scheduled",
      force: false,
      languages: ["ru", "en"],
      testLabel: "22:15 EDT"
    });

    console.info("[Bible for All] Scheduled Daily Question UAT test result:", result);
    return Response.json(result);
  } catch (error) {
    console.error("[Bible for All] Scheduled Daily Question UAT test failed:", error);

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
  schedule: "15 2 23 7 *"
};
