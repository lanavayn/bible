const FORM_NAME = "feedback-vote";
const BROWSER_ID_KEY = "feedback:browser-id";

const LABELS = {
  en: {
    prompt: "Was this helpful?",
    yes: "Yes",
    no: "No",
    share: "Share",
    thanks: "Thank you for your feedback.",
    error: "Could not send feedback. Please try again.",
    copied: "Link copied.",
    copyPrompt: "Copy this link:"
  },
  ru: {
    prompt: "Было ли это полезно?",
    yes: "Да",
    no: "Нет",
    share: "Поделиться",
    thanks: "Спасибо за ваш отзыв.",
    error: "Не удалось отправить отзыв. Попробуйте ещё раз.",
    copied: "Ссылка скопирована.",
    copyPrompt: "Скопируйте эту ссылку:"
  }
};

function getLabels(language) {
  return LABELS[language === "ru" ? "ru" : "en"];
}

function getBrowserId() {
  try {
    const existing = localStorage.getItem(BROWSER_ID_KEY);
    if (existing) return existing;

    const generated = crypto?.randomUUID
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(BROWSER_ID_KEY, generated);
    return generated;
  } catch {
    return "anonymous";
  }
}

function getVoteKey(contentType, contentId, language) {
  return `feedback:${contentType}:${contentId}:${language}`;
}

function getStoredVote(contentType, contentId, language) {
  try {
    return localStorage.getItem(getVoteKey(contentType, contentId, language));
  } catch {
    return null;
  }
}

function storeVote(contentType, contentId, language, vote) {
  try {
    localStorage.setItem(getVoteKey(contentType, contentId, language), vote);
  } catch {
    // Local storage can be unavailable in private browsing; feedback still submits.
  }
}

function getShareUrl(contentType, contentId) {
  const url = new URL(window.location.href);
  if (contentType === "daily-verse") {
    url.searchParams.set("day", String(contentId));
    url.searchParams.delete("question");
  } else if (contentType === "daily-question") {
    url.searchParams.set("question", String(contentId));
    url.searchParams.delete("day");
  }
  return url.toString();
}

async function submitFeedback(payload) {
  const body = new URLSearchParams({
    "form-name": FORM_NAME,
    content_type: payload.contentType,
    content_id: String(payload.contentId),
    language: payload.language,
    action: payload.action,
    page_url: payload.pageUrl,
    timestamp: new Date().toISOString(),
    browser_id: getBrowserId()
  });

  if (payload.previousVote) {
    body.set("previous_vote", payload.previousVote);
  }

  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`Feedback submission failed: ${response.status}`);
  }
}

function setStatus(row, message, type = "") {
  const status = row.querySelector(".feedback-status");
  if (!status) return;
  status.textContent = message || "";
  status.dataset.type = type;
}

function updateSelectedState(row, selectedVote) {
  row.querySelectorAll("[data-feedback-action='up'], [data-feedback-action='down']").forEach((button) => {
    const isSelected = button.dataset.feedbackAction === selectedVote;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
}

async function copyShareLink(url, labels, row) {
  try {
    await navigator.clipboard.writeText(url);
    setStatus(row, labels.copied, "success");
  } catch {
    window.prompt(labels.copyPrompt, url);
  }
}

async function handleShare(row, config) {
  const labels = getLabels(config.language);
  const shareUrl = getShareUrl(config.contentType, config.contentId);
  const shareData = {
    title: document.title,
    text: labels.prompt,
    url: shareUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await copyShareLink(shareUrl, labels, row);
    }

    await submitFeedback({
      ...config,
      action: "share",
      pageUrl: shareUrl
    });
  } catch {
    await copyShareLink(shareUrl, labels, row);
  }
}

async function handleVote(row, config, vote) {
  const labels = getLabels(config.language);
  const previousVote = getStoredVote(config.contentType, config.contentId, config.language);

  updateSelectedState(row, vote);
  storeVote(config.contentType, config.contentId, config.language, vote);

  try {
    await submitFeedback({
      ...config,
      action: vote,
      pageUrl: getShareUrl(config.contentType, config.contentId),
      previousVote: previousVote && previousVote !== vote ? previousVote : ""
    });
    setStatus(row, labels.thanks, "success");
  } catch {
    setStatus(row, labels.error, "error");
  }
}

export function renderFeedbackControls({ contentType, contentId, language }) {
  const labels = getLabels(language);
  const selectedVote = getStoredVote(contentType, contentId, language);

  return `
    <div class="feedback-row"
      data-feedback-content-type="${contentType}"
      data-feedback-content-id="${contentId}"
      data-feedback-language="${language}">
      <span class="feedback-prompt">${labels.prompt}</span>
      <button class="feedback-btn ${selectedVote === "up" ? "is-selected" : ""}" type="button" data-feedback-action="up" aria-pressed="${selectedVote === "up" ? "true" : "false"}">👍 ${labels.yes}</button>
      <button class="feedback-btn ${selectedVote === "down" ? "is-selected" : ""}" type="button" data-feedback-action="down" aria-pressed="${selectedVote === "down" ? "true" : "false"}">👎 ${labels.no}</button>
      <button class="feedback-btn feedback-share-btn" type="button" data-feedback-action="share">🔗 ${labels.share}</button>
      <span class="feedback-status" aria-live="polite"></span>
    </div>
  `;
}

export function initFeedbackControls(root) {
  root.querySelectorAll(".feedback-row").forEach((row) => {
    if (row.dataset.feedbackBound) return;
    row.dataset.feedbackBound = "true";

    const config = {
      contentType: row.dataset.feedbackContentType,
      contentId: row.dataset.feedbackContentId,
      language: row.dataset.feedbackLanguage
    };

    row.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-feedback-action]");
      if (!button || !row.contains(button)) return;

      const action = button.dataset.feedbackAction;
      if (action === "share") {
        await handleShare(row, config);
        return;
      }

      if (action === "up" || action === "down") {
        await handleVote(row, config, action);
      }
    });
  });
}
