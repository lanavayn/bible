const SDK_SRC = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
const CONFIG_URL = "/.netlify/functions/notifications-config";
const STATUS_ENABLED = "enabled";
const STATUS_DISABLED = "disabled";
const STATUS_ERROR = "error";

let configPromise = null;
let sdkPromise = null;
let initPromise = null;

export function renderDailyVerseNotificationControls({ language } = {}) {
  if (language !== "ru") return "";

  return `
    <section class="daily-notification-box" data-notification-feature="daily-verse-ru">
      <div class="daily-notification-content">
        <div class="daily-notification-title" data-notification-title>
          🔔 Получать ежедневный стих в 9:00 утра
        </div>
        <p class="daily-notification-message" data-notification-message hidden>
          Вы будете получать ежедневный стих в 9:00 утра.
        </p>
      </div>
      <div class="daily-notification-actions">
        <button class="daily-notification-btn" type="button" data-notification-enable>
          Включить уведомления
        </button>
        <button class="daily-notification-link" type="button" data-notification-disable hidden>
          Отключить уведомления
        </button>
      </div>
      <div class="daily-notification-status" role="status" aria-live="polite" data-notification-status></div>
    </section>
  `;
}

export function initDailyVerseNotifications(root = document) {
  const box = root.querySelector('[data-notification-feature="daily-verse-ru"]');
  if (!box || box.dataset.bound === "true") return;

  box.dataset.bound = "true";

  const enableBtn = box.querySelector("[data-notification-enable]");
  const disableBtn = box.querySelector("[data-notification-disable]");

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

      await tagDailyVerseRuUatSubscriber(OneSignal);
      setState(box, STATUS_ENABLED);
      setStatus(box, "Уведомления включены.");
      console.info("[Bible for All] Daily Verse notifications enabled for RU UAT.");
    } catch (error) {
      console.error("[Bible for All] Failed to enable Daily Verse notifications.", error);
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

      if (OneSignal.User?.PushSubscription?.optOut) {
        await OneSignal.User.PushSubscription.optOut();
      }

      await OneSignal.User?.addTags?.({
        daily_verse_ru: "false",
        notifications_phase: "uat-disabled"
      });

      setState(box, STATUS_DISABLED);
      setStatus(box, "Уведомления отключены.");
      console.info("[Bible for All] Daily Verse notifications disabled.");
    } catch (error) {
      console.error("[Bible for All] Failed to disable Daily Verse notifications.", error);
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
    setState(box, optedIn ? STATUS_ENABLED : STATUS_DISABLED);
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

async function tagDailyVerseRuUatSubscriber(OneSignal) {
  await OneSignal.User?.addTags?.({
    lang: "ru",
    daily_verse: "true",
    daily_verse_ru: "true",
    notifications_phase: "uat"
  });
}

function setState(box, state) {
  const title = box.querySelector("[data-notification-title]");
  const message = box.querySelector("[data-notification-message]");
  const enableBtn = box.querySelector("[data-notification-enable]");
  const disableBtn = box.querySelector("[data-notification-disable]");

  box.dataset.notificationState = state;

  if (state === STATUS_ENABLED) {
    title.textContent = "✅ Уведомления включены";
    message.hidden = false;
    enableBtn.hidden = true;
    disableBtn.hidden = false;
    return;
  }

  title.textContent = "🔔 Получать ежедневный стих в 9:00 утра";
  message.hidden = true;
  enableBtn.hidden = false;
  disableBtn.hidden = true;
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
