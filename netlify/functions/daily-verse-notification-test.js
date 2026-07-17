const { sendDailyVerseNotification } = require("./_daily-verse-notification-core");

exports.handler = async event => {
  const expectedToken = process.env.NOTIFICATION_TEST_TOKEN;
  const providedToken = event.headers["x-notification-test-token"] || event.queryStringParameters?.token;

  if (!expectedToken || providedToken !== expectedToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized." })
    };
  }

  try {
    const result = await sendDailyVerseNotification({ force: true });
    console.info("[Bible for All] Manual Daily Verse notification test result:", result);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error("[Bible for All] Manual Daily Verse notification test failed:", error);

    return {
      statusCode: error.statusCode || 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        error: error.message,
        details: error.body || null
      })
    };
  }
};
