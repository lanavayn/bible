import { buildBibleLink } from "./bibleLinks.js";
document.addEventListener("DOMContentLoaded", async () => {
    const pageRoot = document.getElementById("scripture-page");
    if (!pageRoot) return;
  
    const lang = document.documentElement.lang === "ru" ? "ru" : "en";
    const dataFile = pageRoot.dataset.json;
    const pageTitle = pageRoot.dataset.title || "";
    const pageIntro = pageRoot.dataset.intro || "";
    const pageNote = pageRoot.dataset.note || "";
  
    const titleEl = document.getElementById("page-title");
    const introEl = document.getElementById("page-intro");
    const noteEl = document.getElementById("page-note");
    const versesContainer = document.getElementById("verses-container");
  
    if (titleEl && pageTitle) titleEl.textContent = pageTitle;
    if (introEl) introEl.textContent = pageIntro;
    if (noteEl) noteEl.textContent = pageNote;
  
    if (!dataFile || !versesContainer) {
      console.error("Missing data-json or verses-container");
      return;
    }
  
    try {
      const response = await fetch(getBasePath() + dataFile);
      if (!response.ok) {
        throw new Error(`Failed to load ${dataFile}`);
      }
  
      const data = await response.json();
      const verses = Array.isArray(data) ? data : data.verses;
  
      if (!Array.isArray(verses)) {
        throw new Error("JSON format invalid: verses array not found");
      }
  
      renderVerses(verses, lang, versesContainer);
      bindVerseToggles();
      initGlobalTooltip();
    } catch (error) {
      console.error("Error loading page data:", error);
      versesContainer.innerHTML = `
        <p>${lang === "ru" ? "Не удалось загрузить данные страницы." : "Failed to load page data."}</p>
      `;
    }
  });
  
  function getBasePath() {
    const path = window.location.pathname;
    if (path.includes("/ru/") || path.includes("/en/")) {
      return "../";
    }
    return "./";
  }
  
  function renderVerses(verses, lang, container) {
    container.innerHTML = "";
  
    verses.forEach((item, index) => {
      const reference = item[`reference_${lang}`] || "";
      const text = item[`text_${lang}`] || "";
      const interpretation = item[`interpretation_${lang}`] || "";
      const topic = item.topic || "";
      const related = Array.isArray(item.related) ? item.related : [];
      const mainLink = buildBibleLink(item.verse_ref, lang);
  
      const detailsId = `details-${index}`;
      const triggerId = `trigger-${index}`;
  
      const verseBlock = document.createElement("section");
      verseBlock.className = "scripture-item";
  
      verseBlock.innerHTML = `
        <h3 class="scripture-heading">
          <span class="scripture-topic ${getTopicClass(topic, lang)}">
            ${getTopicIcon(topic, lang)}${formatTopic(topic, lang)} —
          </span>
          <a href="#"
            class="scripture-reference explain-link"
            id="${triggerId}" 
            data-target="${detailsId}"
            data-tooltip="${lang === 'ru' ? 'Показать объяснение' : 'Show explanation'}">
            ${escapeHtml(reference)}
          </a>

          ${
            mainLink
              ? `<a class="scripture-book-link main-book-link"
                   href="${escapeAttribute(mainLink)}"
                   target="_blank"
                   rel="noopener noreferrer"
                   data-tooltip="${lang === "ru" ? "Открыть в Библии" : "Open in Bible"}">
                   <span class="book-icon">&#128214;</span>
                 </a>`
              : ""
          }

        </h3>
  
        <p class="scripture-text">${escapeHtml(text)}</p>
  
        <div class="scripture-details" id="${detailsId}" style="display: none;">
          <div class="scripture-note-box">
            <div class="scripture-close-row">
              <button class="scripture-close" type="button" data-target="${detailsId}">
                ×
              </button>
            </div>
            <p class="scripture-interpretation">
              <strong>${lang === "ru" ? "Из этого стиха видно" : "This verse shows"} — </strong>
              ${escapeHtml(interpretation)}
            </p>
  
            ${
              related.length
                ? `
              <div class="scripture-related-block">
                <p class="scripture-related-title">
                  <strong>${lang === "ru" ? "Писание объясняет дальше:" : "Scripture explains further:"}</strong>
                </p>
                <ul class="scripture-related-list">
                  ${related.map(rel => renderRelatedItem(rel, lang)).join("")}
                </ul>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;
  
      container.appendChild(verseBlock);
    });
  }
  
  function renderRelatedItem(rel, lang) {
    const ref = rel[`reference_${lang}`] || "";
    const text = rel[`text_${lang}`] || "";
    const link = buildBibleLink(rel.verse_ref, lang);
    const hasRealLink = link && link !== "#";
  
    return `
      <li class="scripture-related-item">
        <span class="scripture-related-ref">${escapeHtml(ref)}</span>
        ${
            hasRealLink
              ? `<a class="scripture-book-link"
                   href="${escapeAttribute(link)}"
                   target="_blank"
                   rel="noopener noreferrer"
                   data-tooltip="${lang === "ru" ? "Открыть стих в Библии" : "Open verse in Bible"}">
                   &#128214;
                 </a>`
              : `<span class="scripture-book-link disabled"
                   data-tooltip="${lang === "ru" ? "Ссылка не указана" : "No link provided"}">
                   &#128214;
                 </span>`
        }
        <span class="scripture-related-text">— ${escapeHtml(text)}</span>

      </li>
    `;
  }
  
  function bindVerseToggles() {
    document.querySelectorAll(".scripture-reference").forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.dataset.target;
        toggleDetails(targetId);
      });
    });
  
    document.querySelectorAll(".scripture-close").forEach(button => {
      button.addEventListener("click", function () {
        const targetId = this.dataset.target;
        closeDetails(targetId);
      });
    });
  }
  
  function toggleDetails(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
  
    const isOpen = target.style.display === "block";
  
    document.querySelectorAll(".scripture-details").forEach(el => {
      el.style.display = "none";
    });
  
    if (!isOpen) {
      target.style.display = "block";
      scrollToDetails(target);
    }
  }
  
  function closeDetails(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.style.display = "none";
  }
  
  function formatTopic(topic, lang) {
    const fallback = lang === "ru" ? "Тема" : "Topic";
  
    if (!topic) return fallback;
  
    if (typeof topic === "object") {
      return topic[lang] || topic.ru || topic.en || fallback;
    }
  
    return topic;
  }
  
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
  }
  
  function escapeAttribute(text) {
    return String(text ?? "").replace(/"/g, "&quot;");
  }

  // === GLOBAL TOOLTIP ===
  function initGlobalTooltip() {
    let tooltip = document.getElementById("global-tooltip");
  
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "global-tooltip";
      tooltip.className = "global-tooltip";
      tooltip.style.display = "none";
      document.body.appendChild(tooltip);
    }
  
    function hideTooltip() {
      tooltip.style.display = "none";
    }
  
    document.querySelectorAll("[data-tooltip]").forEach(el => {
      el.addEventListener("mouseenter", () => {
        tooltip.textContent = el.dataset.tooltip;
        tooltip.style.display = "block";
  
        const rect = el.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 + "px";
        tooltip.style.top = rect.top - 10 + "px";
      });
  
      el.addEventListener("mouseleave", hideTooltip);
      el.addEventListener("click", hideTooltip);
      el.addEventListener("touchstart", hideTooltip, { passive: true });
    });
  
    window.addEventListener("scroll", hideTooltip);
    window.addEventListener("pageshow", hideTooltip);
    window.addEventListener("pagehide", hideTooltip);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) hideTooltip();
    });
  }

  window.onscroll = function() {
    const btn = document.getElementById("scrollTopBtn");
    if (!btn) return;
  
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 200) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  };
  
  window.scrollToTop = function() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function scrollToDetails(detailsEl) {
    if (!detailsEl) return;
  
    const verseBlock = detailsEl.closest(".scripture-item") || detailsEl;
  
    requestAnimationFrame(() => {
      const rect = verseBlock.getBoundingClientRect();
      const absoluteTop = window.pageYOffset + rect.top;
      const offset = 80;
  
      window.scrollTo({
        top: Math.max(absoluteTop - offset, 0),
        behavior: "smooth"
      });
    });
  }

  function getTopicClass(topic, lang) {
    const value = typeof topic === "object"
      ? (topic[lang] || topic.ru || topic.en || "").toLowerCase()
      : String(topic || "").toLowerCase();
  
    if (value.includes("law") || value.includes("закон")) return "topic-law";
    if (value.includes("grace") || value.includes("благодать")) return "topic-grace";
  
    return "";
  }
  
  function getTopicIcon(topic, lang) {
    const value = typeof topic === "object"
      ? (topic[lang] || topic.ru || topic.en || "").toLowerCase()
      : String(topic || "").toLowerCase();
  
    if (value.includes("law") || value.includes("закон")) return "⚖️ ";
    if (value.includes("grace") || value.includes("благодать")) return "✝️ ";
  
    return "";
  }