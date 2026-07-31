const SDK_SRC = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
const CONFIG_URL = "/.netlify/functions/notifications-config";
const TAG_UPDATE_URL = "/.netlify/functions/onesignal-update-tags";
const STATUS_ENABLED = "enabled";
const STATUS_DISABLED = "disabled";
const STATUS_ERROR = "error";
const SUBSCRIPTION_WAIT_MS = 12000;
const SUBSCRIPTION_POLL_MS = 400;
const PREFERENCE_KEY = "bfa.notifications.daily-verse";
const LEGACY_DAILY_VERSE_PREFERENCE_KEYS = [
  "bfa.notifications.daily-verse.ru",
  "bfa.notifications.daily-verse.en"
];
const LEGACY_PREFERENCE_KEYS = [
  ...LEGACY_DAILY_VERSE_PREFERENCE_KEYS,
  "bfa.notifications.daily-question.ru",
  "bfa.notifications.daily-question.en"
];
const LANGUAGE_TAG = "daily_verse_language";
const LEGACY_TAGS = ["daily_verse", "daily_question"];
const FEATURE_COPY = {
  "daily-verse": {
    en: {
      heading: "🔔 Receive a new Bible verse every day",
      desktopDescription: "The Verse of the Day will appear in your browser notifications.",
      enableButton: "Get the Verse of the Day",
      enabledTitle: "✅ Verse of the Day is connected",
      enabledMessage: "You will receive a new Bible verse every day.",
      disableButton: "Stop receiving the Verse of the Day"
    },
    ru: {
      heading: "🔔 Получайте новый стих каждый день",
      desktopDescription: "Стих дня появится в уведомлениях вашего браузера.",
      enableButton: "Получать стих дня",
      enabledTitle: "✅ Стих дня подключён",
      enabledMessage: "Вы будете получать новый стих каждый день.",
      disableButton: "Не получать стих дня"
    }
  }
};

let configPromise = null;
let sdkPromise = null;
let initPromise = null;
let activeConfig = null;

export function renderDailyVerseNotificationControls({ language } = {}) {
  return renderNotificationControls({ feature: "daily-verse", language });
}

function renderNotificationControls({ feature, language } = {}) {
  const copy = getNotificationCopy(feature, language);
  if (!copy || !isPushNotificationSupported()) return "";

  return `
    <section class="daily-notification-box" data-notification-feature="${feature}" data-notification-language="${language}">
      <div class="daily-notification-content">
        <div class="daily-notification-title" data-notification-title>
          ${copy.heading}
        </div>
        <p class="daily-notification-desktop-message" data-notification-desktop-message>
          ${copy.desktopDescription}
        </p>
        <p class="daily-notification-message" data-notification-message hidden>
          ${copy.enabledMessage}
        </p>
      </div>
      <div class="daily-notification-actions">
        <button class="daily-notification-btn" type="button" data-notification-enable>
          ${copy.enableButton}
        </button>
        <button class="daily-notification-link" type="button" data-notification-disable hidden>
          ${copy.disableButton}
        </button>
      </div>
      <div class="daily-notification-status" role="status" aria-live="polite" data-notification-status></div>
    </section>
  `;
}

export function initDailyVerseNotifications(root = document) {
  initNotificationControls(root, "daily-verse");
}

function initNotificationControls(root = document, feature) {
  const box = root.querySelector(`[data-notification-feature="${feature}"]`);
  if (!box || box.dataset.bound === "true") return;

  box.dataset.bound = "true";

  const enableBtn = box.querySelector("[data-notification-enable]");
  const disableBtn = box.querySelector("[data-notification-disable]");
  const language = getBoxLanguage(box);

  if (hasLocalPreference() && getNotificationPermission() === "granted") {
    refreshNotificationState(box);
  } else {
    if (getNotificationPermission() !== "granted") {
      setLocalPreference(false);
    }
    setState(box, STATUS_DISABLED);
  }

  enableBtn?.addEventListener("click", async () => {
    setBusy(box, true);
    setStatus(box, "Подключаем уведомления...");

    try {
      const OneSignal = await initializeOneSignal();
      await logNotificationDiagnostics(OneSignal, "before-enable", { feature, language });
      const subscription = await optInAndConfirm(OneSignal);
      const tags = await syncAndVerifyFeatureTags(OneSignal, feature, language, true);

      await logNotificationDiagnostics(OneSignal, "after-enable", { feature, language, tags });

      setLocalPreference(true);
      setState(box, STATUS_ENABLED);
      setStatus(box, "");
      console.info("[Bible for All] Notifications enabled for UAT.", {
        feature,
        language,
        subscription
      });
    } catch (error) {
      console.error("[Bible for All] Failed to enable notifications.", { feature, language, error });
      setState(box, STATUS_ERROR);
      setStatus(box, "Не удалось включить уведомления. Попробуйте ещё раз.", STATUS_ERROR);
    } finally {
      setBusy(box, false);
    }
  });

  disableBtn?.addEventListener("click", async () => {
    setBusy(box, true);
    setStatus(box, "Отключаем уведомления...");

    try {
      const OneSignal = await initializeOneSignal();
      await logNotificationDiagnostics(OneSignal, "before-disable", { feature, language });

      try {
        await syncAndVerifyFeatureTags(OneSignal, feature, language, false);
      } catch (error) {
        console.warn("[Bible for All] Notification preference tag could not be disabled.", {
          feature,
          language,
          error
        });
      }

      await optOutAndConfirm(OneSignal);

      await logNotificationDiagnostics(OneSignal, "after-disable", { feature, language });

      setLocalPreference(false);
      setState(box, STATUS_DISABLED);
      setStatus(box, "Уведомления отключены.");
      console.info("[Bible for All] Notifications disabled for UAT.", { feature, language });
    } catch (error) {
      console.error("[Bible for All] Failed to disable notifications.", { feature, language, error });
      setStatus(box, "Не удалось отключить уведомления. Проверьте настройки браузера.", STATUS_ERROR);
    } finally {
      setBusy(box, false);
    }
  });

}

async function refreshNotificationState(box) {
  const feature = getBoxFeature(box);
  const language = getBoxLanguage(box);

  if (!hasLocalPreference() || getNotificationPermission() !== "granted") {
    setLocalPreference(false);
    setState(box, STATUS_DISABLED);
    return;
  }

  try {
    const OneSignal = await initializeOneSignal();
    const subscription = getPushSubscriptionState(OneSignal);
    let featureEnabled = isActivePushSubscription(subscription);

    if (featureEnabled) {
      const tags = await getOneSignalTags(OneSignal);

      if (!isFeatureTagEnabled(tags, language)) {
        await syncAndVerifyFeatureTags(OneSignal, feature, language, true);
      }
    }

    if (!featureEnabled) {
      setLocalPreference(false);
    }

    setState(box, featureEnabled ? STATUS_ENABLED : STATUS_DISABLED);
  } catch (error) {
    console.info("[Bible for All] Notifications are not ready yet.", error);
    setState(box, STATUS_DISABLED);
  }
}

export async function syncDailyVerseNotificationLanguage(language) {
  const normalizedLanguage = language === "en" ? "en" : "ru";

  if (!hasLocalPreference() || getNotificationPermission() !== "granted") {
    return { updated: false, reason: "not-subscribed" };
  }

  try {
    const OneSignal = await initializeOneSignal();
    const subscription = getPushSubscriptionState(OneSignal);

    if (!isActivePushSubscription(subscription)) {
      setLocalPreference(false);
      return { updated: false, reason: "inactive-subscription" };
    }

    const tags = await getOneSignalTags(OneSignal);
    if (isFeatureTagEnabled(tags, normalizedLanguage)) {
      return { updated: false, reason: "already-current" };
    }

    await syncAndVerifyFeatureTags(
      OneSignal,
      "daily-verse",
      normalizedLanguage,
      true
    );

    console.info("[Bible for All] Daily Verse notification language updated.", {
      language: normalizedLanguage,
      subscriptionId: maskValue(subscription.id)
    });

    return { updated: true, language: normalizedLanguage };
  } catch (error) {
    console.warn("[Bible for All] Daily Verse notification language update failed.", {
      language: normalizedLanguage,
      error
    });
    return { updated: false, reason: "sync-failed" };
  }
}

async function initializeOneSignal() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      throw new Error("This browser does not support web push notifications.");
    }

    const config = await loadNotificationConfig();
    activeConfig = config;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    await loadOneSignalSdk();

    return new Promise((resolve, reject) => {
      window.OneSignalDeferred.push(async OneSignal => {
        try {
          const initOptions = {
            appId: config.appId.trim(),
            autoResubscribe: false,
            serviceWorkerPath: config.serviceWorkerPath,
            serviceWorkerParam: { scope: config.serviceWorkerScope },
            allowLocalhostAsSecureOrigin: Boolean(config.allowLocalhostAsSecureOrigin)
          };

          console.info("[Bible for All] Initializing OneSignal.", {
            appId: maskValue(initOptions.appId),
            serviceWorkerPath: initOptions.serviceWorkerPath,
            serviceWorkerScope: initOptions.serviceWorkerParam.scope
          });

          await OneSignal.init(initOptions);

          resolve(OneSignal);
        } catch (error) {
          reject(error);
        }
      });
    });
  })();

  return initPromise;
}

async function loadNotificationConfig() {
  if (!configPromise) {
    configPromise = fetch(CONFIG_URL, { cache: "no-store" })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Notification config failed: ${response.status}`);
        }
        return response.json();
      })
      .then(config => {
        if (typeof config?.appId !== "string" || !config.appId.trim()) {
          throw new Error("Missing OneSignal app ID.");
        }
        config.appId = config.appId.trim();
        return config;
      });
  }

  return configPromise;
}

function loadOneSignalSdk() {
  if (window.OneSignal?.User && window.OneSignal?.Notifications) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load OneSignal SDK."));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

async function optInAndConfirm(OneSignal) {
  const pushSubscription = OneSignal.User?.PushSubscription;

  if (!pushSubscription?.optIn) {
    throw new Error("OneSignal push subscription is unavailable.");
  }

  const subscriptionChange = waitForSubscriptionState(
    OneSignal,
    isActivePushSubscription,
    "OneSignal push subscription was not confirmed."
  );

  try {
    await pushSubscription.optIn();
  } catch (error) {
    subscriptionChange.cancel();
    throw error;
  }

  const currentSubscription = getPushSubscriptionState(OneSignal);
  if (isActivePushSubscription(currentSubscription)) {
    subscriptionChange.cancel();
    return currentSubscription;
  }

  return subscriptionChange.promise;
}

async function optOutAndConfirm(OneSignal) {
  const pushSubscription = OneSignal.User?.PushSubscription;

  if (!pushSubscription?.optOut) {
    throw new Error("OneSignal push subscription is unavailable.");
  }

  const subscriptionChange = waitForSubscriptionState(
    OneSignal,
    subscription => !subscription.optedIn,
    "OneSignal push opt-out was not confirmed."
  );

  try {
    await pushSubscription.optOut();
  } catch (error) {
    subscriptionChange.cancel();
    throw error;
  }

  const currentSubscription = getPushSubscriptionState(OneSignal);
  if (!currentSubscription.optedIn) {
    subscriptionChange.cancel();
    return currentSubscription;
  }

  return subscriptionChange.promise;
}

function waitForSubscriptionState(OneSignal, predicate, timeoutMessage) {
  const pushSubscription = OneSignal.User?.PushSubscription;
  let settled = false;
  let timeoutId = null;
  let resolvePromise;
  let rejectPromise;

  const cleanup = () => {
    if (timeoutId) clearTimeout(timeoutId);
    pushSubscription?.removeEventListener?.("change", handleChange);
  };

  const finish = (callback, value) => {
    if (settled) return;
    settled = true;
    cleanup();
    callback(value);
  };

  const handleChange = event => {
    const subscription = {
      id: event?.current?.id || pushSubscription?.id || null,
      token: event?.current?.token || pushSubscription?.token || null,
      optedIn: Boolean(event?.current?.optedIn ?? pushSubscription?.optedIn)
    };

    if (predicate(subscription)) {
      finish(resolvePromise, subscription);
    }
  };

  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
    pushSubscription?.addEventListener?.("change", handleChange);
    timeoutId = setTimeout(() => {
      const subscription = getPushSubscriptionState(OneSignal);

      if (predicate(subscription)) {
        finish(resolve, subscription);
      } else {
        finish(reject, new Error(timeoutMessage));
      }
    }, SUBSCRIPTION_WAIT_MS);
  });

  return {
    promise,
    cancel: () => {
      settled = true;
      cleanup();
    }
  };
}

async function syncAndVerifyFeatureTags(OneSignal, feature, language, enabled) {
  const intendedTags = buildNotificationTags(feature, language, enabled);
  let clientTags = {};

  try {
    if (!OneSignal.User?.addTags || !OneSignal.User?.removeTags || !OneSignal.User?.getTags) {
      throw new Error("OneSignal tag APIs are unavailable.");
    }

    await OneSignal.User.removeTags(LEGACY_TAGS);

    if (enabled) {
      await OneSignal.User.addTags(intendedTags);
    } else {
      await OneSignal.User.removeTags([LANGUAGE_TAG]);
    }

    const startedAt = Date.now();

    while (Date.now() - startedAt < SUBSCRIPTION_WAIT_MS) {
      clientTags = await getOneSignalTags(OneSignal);

      if (tagsMatch(clientTags, intendedTags, enabled)) {
        break;
      }

      await delay(SUBSCRIPTION_POLL_MS);
    }
  } catch (error) {
    console.warn("[Bible for All] OneSignal client tag sync failed; using the UAT server fallback.", error);
  }

  const serverTags = await syncFeatureTagsWithServer(OneSignal, feature, language, enabled);

  if (!tagsMatch(serverTags, intendedTags, enabled)) {
    throw new Error(`OneSignal tags were not confirmed for ${feature}.`);
  }

  return serverTags;
}

async function syncFeatureTagsWithServer(OneSignal, feature, language, enabled) {
  const subscription = getPushSubscriptionState(OneSignal);

  if (!subscription.id) {
    throw new Error("OneSignal Subscription ID is unavailable for tag synchronization.");
  }

  const response = await fetch(TAG_UPDATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      feature,
      language,
      enabled: Boolean(enabled),
      subscription_id: subscription.id
    })
  });
  const result = await response.json().catch(() => ({}));

  console.info("[Bible for All] OneSignal server tag fallback response.", {
    feature,
    language,
    enabled,
    status: response.status,
    ok: response.ok,
    result
  });

  if (!response.ok || !result.ok) {
    throw new Error(result.error || `OneSignal server tag sync failed with ${response.status}.`);
  }

  return result.tags || {};
}

function tagsMatch(actualTags, expectedTags, enabled = true) {
  if (!enabled) {
    return !actualTags?.[LANGUAGE_TAG];
  }

  return actualTags?.[LANGUAGE_TAG] === expectedTags[LANGUAGE_TAG];
}

async function getOneSignalTags(OneSignal) {
  return OneSignal.User?.getTags ? await OneSignal.User.getTags() : {};
}

function isFeatureTagEnabled(tags, language) {
  return tags?.[LANGUAGE_TAG] === language;
}

function buildNotificationTags(feature, language, enabled) {
  return {
    [LANGUAGE_TAG]: enabled ? language : ""
  };
}

function getPushSubscriptionState(OneSignal) {
  return {
    id: OneSignal.User?.PushSubscription?.id || null,
    token: OneSignal.User?.PushSubscription?.token || null,
    optedIn: Boolean(OneSignal.User?.PushSubscription?.optedIn)
  };
}

function isActivePushSubscription(subscription) {
  return Boolean(subscription?.optedIn && subscription.id && subscription.token);
}

function maskValue(value = "") {
  if (!value) return "";
  if (value.length <= 8) return `${value.slice(0, 2)}...${value.slice(-2)}`;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

async function logNotificationDiagnostics(OneSignal, stage, details = {}) {
  const registration = await getOneSignalServiceWorkerRegistration();
  let tags = details.tags || {};

  if (!details.tags) {
    try {
      tags = await getOneSignalTags(OneSignal);
    } catch (error) {
      tags = { diagnosticError: error.message };
    }
  }

  console.info("[Bible for All] OneSignal diagnostics.", {
    stage,
    feature: details.feature || null,
    language: details.language || null,
    notificationPermission: typeof Notification !== "undefined" ? Notification.permission : null,
    oneSignalPermission: OneSignal.Notifications?.permission ?? null,
    oneSignalId: OneSignal.User?.onesignalId || null,
    appId: maskValue(activeConfig?.appId || ""),
    serviceWorkerPath: activeConfig?.serviceWorkerPath || null,
    serviceWorkerScope: activeConfig?.serviceWorkerScope || null,
    serviceWorkerRegistration: registration,
    pushSubscription: getPushSubscriptionState(OneSignal),
    tags
  });
}

async function getOneSignalServiceWorkerRegistration() {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.getRegistration) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(activeConfig?.serviceWorkerScope || "/push/onesignal/");
    return registration
      ? {
          scope: registration.scope,
          activeScriptURL: registration.active?.scriptURL || null,
          installingScriptURL: registration.installing?.scriptURL || null,
          waitingScriptURL: registration.waiting?.scriptURL || null
        }
      : null;
  } catch (error) {
    return { error: error.message };
  }
}

function getNotificationPermission() {
  return typeof Notification !== "undefined" ? Notification.permission : "unsupported";
}

function setState(box, state) {
  const title = box.querySelector("[data-notification-title]");
  const desktopMessage = box.querySelector("[data-notification-desktop-message]");
  const message = box.querySelector("[data-notification-message]");
  const enableBtn = box.querySelector("[data-notification-enable]");
  const disableBtn = box.querySelector("[data-notification-disable]");
  const copy = getNotificationCopy(getBoxFeature(box), getBoxLanguage(box));

  box.dataset.notificationState = state;

  if (state === STATUS_ENABLED) {
    title.textContent = copy.enabledTitle;
    desktopMessage.hidden = true;
    message.hidden = false;
    enableBtn.hidden = true;
    disableBtn.hidden = false;
    return;
  }

  title.textContent = copy.heading;
  desktopMessage.hidden = false;
  message.hidden = true;
  enableBtn.hidden = false;
  disableBtn.hidden = true;
}

function isPushNotificationSupported() {
  if (typeof window === "undefined") return true;
  return "Notification" in window
    && typeof navigator !== "undefined"
    && "serviceWorker" in navigator;
}

function getNotificationCopy(feature = "daily-verse", language = "ru") {
  return FEATURE_COPY[feature]?.[language === "en" ? "en" : "ru"] || null;
}

function getBoxFeature(box) {
  return box.dataset.notificationFeature || "daily-verse";
}

function getBoxLanguage(box) {
  return box.dataset.notificationLanguage || (document.documentElement.lang === "en" ? "en" : "ru");
}

function hasLocalPreference() {
  try {
    if (localStorage.getItem(PREFERENCE_KEY) === "enabled") {
      return true;
    }

    const hasLegacyPreference = LEGACY_DAILY_VERSE_PREFERENCE_KEYS
      .some(key => localStorage.getItem(key) === "enabled");

    if (hasLegacyPreference) {
      localStorage.setItem(PREFERENCE_KEY, "enabled");
      LEGACY_PREFERENCE_KEYS.forEach(key => localStorage.removeItem(key));
    }

    return hasLegacyPreference;
  } catch {
    return false;
  }
}

function setLocalPreference(enabled) {
  try {
    if (enabled) {
      localStorage.setItem(PREFERENCE_KEY, "enabled");
    } else {
      localStorage.removeItem(PREFERENCE_KEY);
    }
    LEGACY_PREFERENCE_KEYS.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.info("[Bible for All] Notification preference could not be stored locally.", error);
  }
}

function setStatus(box, message, type = "") {
  const status = box.querySelector("[data-notification-status]");
  if (!status) return;

  status.textContent = message || "";
  status.dataset.type = type;
}

function setBusy(box, isBusy) {
  box.querySelectorAll("button").forEach(button => {
    button.disabled = isBusy;
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
