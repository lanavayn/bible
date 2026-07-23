const SDK_SRC = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
const CONFIG_URL = "/.netlify/functions/notifications-config";
const STATUS_ENABLED = "enabled";
const STATUS_DISABLED = "disabled";
const STATUS_ERROR = "error";
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
  },
  "daily-question": {
    en: {
      heading: "🔔 Receive a new Bible question every day",
      desktopDescription: "The Question of the Day will appear in your browser notifications.",
      enableButton: "Get the Question of the Day",
      enabledTitle: "✅ Question of the Day is on",
      enabledMessage: "You’ll receive a new Bible question every day.",
      disableButton: "Stop receiving the Question of the Day"
    },
    ru: {
      heading: "🔔 Получайте новый вопрос из Библии каждый день",
      desktopDescription: "Вопрос дня появится в уведомлениях вашего браузера.",
      enableButton: "Получать вопрос дня",
      enabledTitle: "✅ Вопрос дня подключён",
      enabledMessage: "Вы будете получать новый вопрос каждый день.",
      disableButton: "Не получать вопрос дня"
    }
  }
};

let configPromise = null;
let sdkPromise = null;
let initPromise = null;

export function renderDailyVerseNotificationControls({ language } = {}) {
  return renderNotificationControls({ feature: "daily-verse", language });
}

export function renderDailyQuestionNotificationControls({ language } = {}) {
  return renderNotificationControls({ feature: "daily-question", language });
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

export function initDailyQuestionNotifications(root = document) {
  initNotificationControls(root, "daily-question");
}

function initNotificationControls(root = document, feature) {
  const box = root.querySelector(`[data-notification-feature="${feature}"]`);
  if (!box || box.dataset.bound === "true") return;

  box.dataset.bound = "true";

  const enableBtn = box.querySelector("[data-notification-enable]");
  const disableBtn = box.querySelector("[data-notification-disable]");
  const language = getBoxLanguage(box);

  refreshNotificationState(box);

  enableBtn?.addEventListener("click", async () => {
    setBusy(box, true);
    setStatus(box, "Подключаем уведомления...");

    try {
      const OneSignal = await initializeOneSignal();
      const permissionGranted = await requestNotificationPermission(OneSignal);

      if (!permissionGranted) {
        setState(box, STATUS_DISABLED);
        setStatus(box, "Разрешение на уведомления не получено.", STATUS_ERROR);
        return;
      }

      if (OneSignal.User?.PushSubscription?.optIn) {
        await OneSignal.User.PushSubscription.optIn();
      }

      await tagNotificationSubscriber(OneSignal, feature, language, true);
      setStoredFeatureState(feature, language, true);
      setState(box, STATUS_ENABLED);
      setStatus(box, "");
      console.info("[Bible for All] Notifications enabled for UAT.", { feature, language });
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

      await tagNotificationSubscriber(OneSignal, feature, language, false);
      setStoredFeatureState(feature, language, false);

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
  try {
    const OneSignal = await initializeOneSignal();
    const optedIn = Boolean(OneSignal.User?.PushSubscription?.optedIn);
    const feature = getBoxFeature(box);
    const language = getBoxLanguage(box);
    const featureEnabled = optedIn && await getFeatureEnabled(OneSignal, feature, language);
    setState(box, featureEnabled ? STATUS_ENABLED : STATUS_DISABLED);
  } catch (error) {
    console.info("[Bible for All] Notifications are not ready yet.", error);
    setState(box, STATUS_DISABLED);
  }
}

async function initializeOneSignal() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      throw new Error("This browser does not support web push notifications.");
    }

    const config = await loadNotificationConfig();
    await loadOneSignalSdk();

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    return new Promise((resolve, reject) => {
      window.OneSignalDeferred.push(async OneSignal => {
        try {
          await OneSignal.init({
            appId: config.appId,
            serviceWorkerPath: config.serviceWorkerPath,
            serviceWorkerParam: { scope: config.serviceWorkerScope },
            allowLocalhostAsSecureOrigin: Boolean(config.allowLocalhostAsSecureOrigin)
          });

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
        if (!config?.appId) {
          throw new Error("Missing OneSignal app ID.");
        }
        return config;
      });
  }

  return configPromise;
}

function loadOneSignalSdk() {
  if (window.OneSignalDeferred) return Promise.resolve();
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

async function requestNotificationPermission(OneSignal) {
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  if (OneSignal.Notifications?.requestPermission) {
    return Boolean(await OneSignal.Notifications.requestPermission());
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

async function tagNotificationSubscriber(OneSignal, feature, language, enabled) {
  const featureTag = getFeatureTag(feature);
  const languageFeatureTag = `${featureTag}_${language}`;

  await OneSignal.User?.addTags?.({
    lang: language,
    [featureTag]: String(Boolean(enabled)),
    [languageFeatureTag]: String(Boolean(enabled)),
    notifications_phase: "uat"
  });
}

async function getFeatureEnabled(OneSignal, feature, language) {
  const featureTag = getFeatureTag(feature);
  const stored = getStoredFeatureState(feature, language);

  if (OneSignal.User?.getTags) {
    const tags = await OneSignal.User.getTags();
    if (tags?.[featureTag] === "true") return true;
    if (tags?.[featureTag] === "false") return false;
  }

  return stored;
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

function getFeatureTag(feature) {
  return feature.replace(/-/g, "_");
}

function getStoredFeatureState(feature, language) {
  try {
    return localStorage.getItem(getFeatureStorageKey(feature, language)) === "true";
  } catch {
    return false;
  }
}

function setStoredFeatureState(feature, language, enabled) {
  try {
    localStorage.setItem(getFeatureStorageKey(feature, language), String(Boolean(enabled)));
  } catch {
    // Local storage is only used to keep the per-feature UI state friendly.
  }
}

function getFeatureStorageKey(feature, language) {
  return `bfa_notifications_${feature}_${language}`;
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
