exports.handler = async () => {
  const appId = process.env.ONESIGNAL_APP_ID || "";

  if (!appId) {
    return jsonResponse(503, {
      enabled: false,
      error: "ONESIGNAL_APP_ID is not configured."
    });
  }

  return jsonResponse(200, {
    enabled: true,
    appId,
    serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
    serviceWorkerScope: "/push/onesignal/",
    allowLocalhostAsSecureOrigin: process.env.ONESIGNAL_ALLOW_LOCALHOST === "true"
  });
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}
