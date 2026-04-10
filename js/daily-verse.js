import { buildBibleLink } from "./bibleLinks.js";
async function renderDailyVerse(rootId = "daily-verse", jsonPath = "/data/dailyVerses.json") {
    const root = document.getElementById(rootId);
    if (!root) return;
  
    const lang = document.documentElement.lang?.startsWith("ru") ? "ru" : "en";
  
    const ui = {
      ru: {
        title: "Стих дня",
        loading: "Загрузка...",
        empty: "Стих не найден.",
        prev: "← Назад",
        next: "Вперёд →"
      },
      en: {
        title: "Daily Verse",
        loading: "Loading...",
        empty: "Verse not found.",
        prev: "← Previous",
        next: "Next →"
      }
    };
  
    root.innerHTML = `<div class="daily-verse-loading">${ui[lang].loading}</div>`;
  
    try {
      const response = await fetch(jsonPath, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to load ${jsonPath}`);
  
      const data = await response.json();
      const verses = Array.isArray(data?.verses) ? data.verses : [];
  
      if (!verses.length) {
        root.innerHTML = `<div class="daily-verse-empty">${ui[lang].empty}</div>`;
        return;
      }
  
      const today = getTodayLocalISO();
      let currentIndex = verses.findIndex(v => v.date === today);
  
      if (currentIndex === -1) currentIndex = 0;
  
      function renderCard(index) {
        const verse = verses[index];
        if (!verse) {
          root.innerHTML = `<div class="daily-verse-empty">${ui[lang].empty}</div>`;
          return;
        }
  
        const topic = verse.topic?.[lang] || "";
        const reference = verse[`reference_${lang}`] || "";
        const text = verse[`text_${lang}`] || "";
        const interpretation = verse[`interpretation_${lang}`] || "";
        const dateLabel = formatDateForDisplay(verse.date, lang);
        const dayLabel = verse.day
            ? (lang === "ru" ? `День ${verse.day}` : `Day ${verse.day}`)
            : "";
        const fullDateLabel = dayLabel && dateLabel
            ? `${dayLabel} · ${dateLabel}`
            : (dayLabel || dateLabel);
        const verseRef = verse?.verse_ref_lang?.[lang] || verse?.verse_ref || null;
        const bibleLink = buildBibleLink(verseRef, lang);
        const related = Array.isArray(verse.related) ? verse.related : [];
        const detailsTitle =
        lang === "ru" ? "Размышление:" : "Reflection";
        const relatedTitle =
        lang === "ru" ? "См. также в Писании:" : "See also in Scripture:";
        const detailsId = `dv-details-${escapeHtml(verse.id || index)}`;
        const openBibleLabel = lang === "ru" ? "Открыть в Библии" : "Open in Bible";
        const reflectionBtnLabel = lang === "ru" ? "Размышление + ссылки" : "Reflection + links";
        

        root.innerHTML = `
        <section class="daily-verse-card" data-id="${escapeHtml(verse.id || "")}">
            <div class="daily-verse-header">
            <div class="daily-verse-label">${ui[lang].title}</div>

            <div class="daily-verse-date-wrap">
                ${fullDateLabel ? `<div class="daily-verse-date">${fullDateLabel}</div>` : ""}
            </div>

            <div class="daily-verse-header-right">
                <button
                class="dv-close"
                type="button"
                aria-label="${lang === 'ru' ? 'Закрыть' : 'Close'}"
                title="${lang === 'ru' ? 'Закрыть' : 'Close'}"
                >×</button>
            </div>
            </div>

            ${
            topic || reference
                ? `
                <div class="daily-verse-title-inline">
                    <span class="daily-verse-title-text">
                    ${escapeHtml(topic)}${topic && reference ? " — " : ""}${escapeHtml(reference)}
                    </span>

                    ${
                    bibleLink
                        ? `
                        <a
                            class="scripture-book-link main-book-link daily-verse-book-link"
                            href="${escapeHtml(bibleLink)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-tooltip="${escapeHtml(openBibleLabel)}"
                            aria-label="${escapeHtml(openBibleLabel)}"
                            title="${escapeHtml(openBibleLabel)}"
                        >
                            <span class="book-icon">&#128214;</span>
                        </a>
                        `
                        : ""
                    }
                </div>
                `
                : ""
            }

            <div class="daily-verse-text-wrap">
            ${
                verses.length > 1
                ? `<button class="dv-arrow dv-left" type="button" aria-label="${ui[lang].prev}">‹</button>`
                : ""
            }

            ${text ? `<blockquote class="daily-verse-text">${escapeHtml(text)}</blockquote>` : ""}

            ${
                verses.length > 1
                ? `<button class="dv-arrow dv-right" type="button" aria-label="${ui[lang].next}">›</button>`
                : ""
            }
            </div>

            <div class="daily-verse-actions">
            <button
                type="button"
                class="daily-verse-related-btn"
                data-target="${detailsId}"
            >
                ${reflectionBtnLabel}
            </button>
            </div>
            <div class="daily-verse-details scripture-details" id="${detailsId}" style="display:none;">
                <div class="scripture-note-box">
                    <div class="scripture-close-row">
                    <button
                        class="scripture-close dv-details-close"
                        type="button"
                        data-target="${detailsId}"
                        aria-label="${lang === 'ru' ? 'Закрыть' : 'Close'}"
                        title="${lang === 'ru' ? 'Закрыть' : 'Close'}"
                    >×</button>
                    </div>

                    ${
                    interpretation
                        ? `
                        <p class="scripture-interpretation">
                        <strong>${detailsTitle}</strong>
                        ${escapeHtml(interpretation)}
                        </p>
                        `
                        : ""
                    }

                    ${
                    related.length
                        ? `
                        <div class="scripture-related-block">
                        <p class="scripture-related-title">
                            <strong>${relatedTitle}</strong>
                        </p>
                        <ul class="scripture-related-list">
                            ${related.map(rel => renderDailyRelatedItem(rel, lang)).join("")}
                        </ul>
                        </div>
                        `
                        : ""
                    }
                </div>
                </div>
            
        </section>
        `;
  
        const prevBtn = root.querySelector('.dv-left');
        const nextBtn = root.querySelector('.dv-right');
        const closeBtn = root.querySelector('.dv-close');
        const detailsBtn = root.querySelector('.daily-verse-related-btn');
        const detailsCloseBtn = root.querySelector('.dv-details-close');
        
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
              root.style.display = "none";
            });
          }

        if (detailsBtn) {
            detailsBtn.addEventListener("click", () => {
              const targetId = detailsBtn.dataset.target;
              toggleDailyVerseDetails(targetId);
            });
        }
          
        if (detailsCloseBtn) {
            detailsCloseBtn.addEventListener("click", () => {
              const targetId = detailsCloseBtn.dataset.target;
              closeDailyVerseDetails(targetId);
            });
        }

        if (prevBtn) {
          prevBtn.addEventListener("click", () => {
            currentIndex = (currentIndex - 1 + verses.length) % verses.length;
            renderCard(currentIndex);
          });
        }
  
        if (nextBtn) {
          nextBtn.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % verses.length;
            renderCard(currentIndex);
          });
        }
        initDailyVerseTooltip(root);
      }
  
      renderCard(currentIndex);
    } catch (error) {
      console.error("Daily verse error:", error);
      root.innerHTML = `<div class="daily-verse-empty">${ui[lang].empty}</div>`;
    }
  }
  
  function getTodayLocalISO() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  
  function formatDateForDisplay(dateString, lang = "en") {
    if (!dateString) return "";
  
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
  
    return date.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  
  function toggleDailyVerseDetails(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
  
    const isOpen = target.style.display === "block";
  
    document.querySelectorAll(".daily-verse-details").forEach(el => {
      el.style.display = "none";
    });
  
    if (!isOpen) {
      target.style.display = "block";
    }
  }
  
  function closeDailyVerseDetails(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.style.display = "none";
  }
  
  function initDailyVerseTooltip(root) {
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
  
    root.querySelectorAll("[data-tooltip]").forEach(el => {
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
  }

  function renderDailyRelatedItem(rel, lang) {
    const ref = rel[`reference_${lang}`] || "";
    const text = rel[`text_${lang}`] || "";
    const verseRef = rel?.verse_ref_lang?.[lang] || rel?.verse_ref || null;
    const link = buildBibleLink(verseRef, lang);
    const hasRealLink = !!link;
  
    return `
      <li class="scripture-related-item">
        <span class="scripture-related-ref">${escapeHtml(ref)}</span>
        ${
          hasRealLink
            ? `<a class="scripture-book-link"
                 href="${escapeHtml(link)}"
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
  
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    renderDailyVerse();
  });