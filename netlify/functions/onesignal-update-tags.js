const ONESIGNAL_API_BASE = "https://api.onesignal.com";
const ALLOWED_FEATURES = new Set(["daily-verse", "daily-question"]);
const ALLOWED_LANGUAGES = new Set(["ru", "en"]);

exports.handler = async event => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  try {
    const payload = parseJsonBody(event.body);
    const subscriptionId = normalizeUuid(payload.subscription_id);
    const feature = normalizeFeature(payload.feature);
    const language = normalizeLanguage(payload.language);
    const enabled = Boolean(payload.enabled);
    const appId = requireEnv("ONESIGNAL_APP_ID");
    const restApiKey = requireEnv("ONESIGNAL_REST_API_KEY");

    if (!subscriptionId) {
      return jsonResponse(400, { error: "A valid subscription_id is required." });
    }

    if (!feature || !language) {
      return jsonResponse(400, { error: "Invalid notification feature or language." });
    }

    console.info("[Bible for All] OneSignal tag update started.", {
      feature,
      language,
      enabled,
      identifierType: "subscription_id",
      appIdMasked: maskValue(appId),
      subscriptionIdMasked: maskValue(subscriptionId),
      identityEndpoint: "GET /apps/{app_id}/subscriptions/{subscription_id}/user/identity"
    });

    const identityResult = await fetchSubscriptionIdentity({ appId, restApiKey, subscriptionId });

    if (identityResult.status === 404) {
      return jsonResponse(404, {
        ok: false,
        error: "OneSignal subscription identity was not found for the confirmed browser subscription_id.",
        identifierType: "subscription_id",
        endpoint: "GET /apps/{app_id}/subscriptions/{subscription_id}/user/identity",
        identityStatus: identityResult.status,
        identityResponse: identityResult.body
      });
    }

    if (!identityResult.ok) {
      return jsonResponse(502, {
        ok: false,
        error: `OneSignal identity lookup failed with ${identityResult.status}.`,
        identifierType: "subscription_id",
        endpoint: "GET /apps/{app_id}/subscriptions/{subscription_id}/user/identity",
        identityStatus: identityResult.status,
        identityResponse: identityResult.body
      });
    }

    const oneSignalId = normalizeUuid(identityResult.body?.identity?.onesignal_id);

    if (!oneSignalId) {
      return jsonResponse(502, {
        ok: false,
        error: "OneSignal identity lookup did not return a valid onesignal_id.",
        identifierType: "subscription_id",
        endpoint: "GET /apps/{app_id}/subscriptions/{subscription_id}/user/identity",
        identityStatus: identityResult.status,
        identityResponse: identityResult.body
      });
    }

    const tags = buildWhitelistedTags(feature, language, enabled);
    const updateResult = await updateOneSignalUserTags({ appId, restApiKey, oneSignalId, subscriptionId, tags });

    if (updateResult.status !== 202) {
      return jsonResponse(502, {
        ok: false,
        error: "OneSignal tag update failed.",
        identifierType: "onesignal_id",
        endpoint: "PATCH /apps/{app_id}/users/by/onesignal_id/{onesignal_id}",
        identityStatus: identityResult.status,
        updateStatus: updateResult.status,
        updateResponse: updateResult.body
      });
    }

    console.info("[Bible for All] OneSignal tag update completed.", {
      feature,
      language,
      enabled,
      appIdMasked: maskValue(appId),
      subscriptionIdMasked: maskValue(subscriptionId),
      oneSignalIdMasked: maskValue(oneSignalId),
      tags,
      identityStatus: identityResult.status,
      updateStatus: updateResult.status
    });

    return jsonResponse(200, {
      ok: true,
      tags,
      identityStatus: identityResult.status,
      updateStatus: updateResult.status,
      updateResponse: updateResult.body
    });
  } catch (error) {
    console.error("[Bible for All] OneSignal tag update failed.", {
      message: error.message,
      stack: error.stack
    });

    return jsonResponse(error.statusCode || 500, {
      error: error.message
    });
  }
};

async function fetchSubscriptionIdentity({ appId, restApiKey, subscriptionId }) {
  const url = `${ONESIGNAL_API_BASE}/apps/${encodeURIComponent(appId)}/subscriptions/${encodeURIComponent(subscriptionId)}/user/identity`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Key ${restApiKey}`
    }
  });
  const result = await parseOneSignalResponse(response);

  console.info("[Bible for All] OneSignal identity lookup response.", {
    status: result.status,
    ok: result.ok,
    identifierType: "subscription_id",
    endpoint: "GET /apps/{app_id}/subscriptions/{subscription_id}/user/identity",
    subscriptionIdMasked: maskValue(subscriptionId),
    rawResponseText: result.rawText,
    response: result.body
  });

  return result;
}

async function updateOneSignalUserTags({ appId, restApiKey, oneSignalId, subscriptionId, tags }) {
  const url = `${ONESIGNAL_API_BASE}/apps/${encodeURIComponent(appId)}/users/by/onesignal_id/${encodeURIComponent(oneSignalId)}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Key ${restApiKey}`,
      "Content-Type": "application/json; charset=utf-8",
      "onesignal-subscription-id": subscriptionId
    },
    body: JSON.stringify({
      properties: { tags }
    })
  });
  const result = await parseOneSignalResponse(response);

  console.info("[Bible for All] OneSignal user tag update response.", {
    status: result.status,
    ok: result.ok,
    oneSignalIdMasked: maskValue(oneSignalId),
    subscriptionIdMasked: maskValue(subscriptionId),
    rawResponseText: result.rawText,
    response: result.body
  });

  return result;
}

async function parseOneSignalResponse(response) {
  const rawText = await response.text();
  let body = null;

  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    body = { raw: rawText };
  }

  return {
    status: response.status,
    ok: response.ok,
    rawText,
    body
  };
}

function buildWhitelistedTags(feature, language, enabled) {
  const featureTag = feature.replace(/-/g, "_");

  return {
    lang: language,
    [featureTag]: String(enabled),
    [`${featureTag}_${language}`]: String(enabled),
    notifications_phase: "uat"
  };
}

function parseJsonBody(body) {
  try {
    return body ? JSON.parse(body) : {};
  } catch (error) {
    const parseError = new Error("Invalid JSON body.");
    parseError.statusCode = 400;
    throw parseError;
  }
}

function normalizeFeature(feature) {
  return ALLOWED_FEATURES.has(feature) ? feature : "";
}

function normalizeLanguage(language) {
  return ALLOWED_LANGUAGES.has(language) ? language : "";
}

function normalizeUuid(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)
    ? trimmed
    : "";
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`${name} is not configured.`);
    error.statusCode = 503;
    throw error;
  }
  return value;
}

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

function maskValue(value = "") {
  if (!value) return "";
  if (value.length <= 8) return `${value.slice(0, 2)}...${value.slice(-2)}`;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}
