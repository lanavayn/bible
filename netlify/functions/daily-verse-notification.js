const { sendDailyVerseNotification } = require("./_daily-verse-notification-core");

exports.handler = async () => {
  try {
    const result = await sendDailyVerseNotification();
    console.info("[Bible for All] Scheduled Daily Verse notification result:", result);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error("[Bible for All] Scheduled Daily Verse notification failed:", error);

    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({
        error: error.message,
        details: error.body || null
      })
    };
  }
};
