import { buildBibleLink } from "./bibleLinks.js";

const easterDates = {
  2026: "2026-04-05",
  2027: "2027-03-28",
  2028: "2028-04-16",
  2029: "2029-04-01",
  2030: "2030-04-21",
  2031: "2031-04-13",
  2032: "2032-03-28",
  2033: "2033-04-17",
  2034: "2034-04-09",
  2035: "2035-03-25",
  2036: "2036-04-13"
};

function parseLocalDate(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getLastEaster(today = new Date()) {
  const cleanToday = stripTime(today);
  const year = cleanToday.getFullYear();
  const thisEaster = parseLocalDate(easterDates[year]);

  if (cleanToday >= thisEaster) return thisEaster;
  return parseLocalDate(easterDates[year - 1]);
}

function getDayNumberFromEaster(today = new Date()) {
  const cleanToday = stripTime(today);
  const lastEaster = getLastEaster(cleanToday);

  const diffMs = cleanToday - lastEaster;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays + 1; // Пасха = Day 1
}

function getDateForDay(dayNumber, today = new Date()) {
  const lastEaster = getLastEaster(today);

  const date = new Date(lastEaster);
  date.setDate(date.getDate() + (dayNumber - 1));

  return date;
}

window.renderDailyVerse = async function renderDailyVerse(rootId = "daily-verse") {
    const root = document.getElementById(rootId);
    if (!root) return;
    const reopenBtn = document.getElementById("daily-verse-reopen");

    if (reopenBtn && !reopenBtn.dataset.bound) {
      reopenBtn.dataset.bound = "true";

      reopenBtn.addEventListener("click", () => {
        root.style.display = "block";
        reopenBtn.style.display = "none";
        root.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  
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
      const jsonPaths = [
        "/data/daily/daily-1-30.json",
        "/data/daily/daily-31-60.json"     
      ];
      
      let verses = [];
      
      for (const path of jsonPaths) {
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load ${path}`);
        }
      
        const data = await response.json();
        const fileVerses = Array.isArray(data?.verses) ? data.verses : [];
        verses = verses.concat(fileVerses);
      }

      const START_INDEX = 0;

      const todayDayNumber = getDayNumberFromEaster();

      let currentIndex = verses.findIndex(v => v.day === todayDayNumber);

      // fallback если ещё нет такого дня в JSON
      if (currentIndex === -1) {
        currentIndex = START_INDEX;
      }

      const todayIndex = currentIndex;

      let keepDetailsOpen = false;
  
      if (!verses.length) {
        root.innerHTML = `<div class="daily-verse-empty">${ui[lang].empty}</div>`;
        return;
      }
  
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

        const computedDate = getDateForDay(verse.day);
        const dateLabel = formatDateFromDateObj(computedDate, lang);

        const isEasterDay = verse.day === 1;

        const dayLabel = verse.day
          ? (lang === "ru"
              ? `День ${verse.day}${isEasterDay ? " · Пасха" : ""}`
              : `Day ${verse.day}${isEasterDay ? " · Easter" : ""}`)
          : "";
        const fullDateLabel = dayLabel && dateLabel
            ? `${dayLabel} · ${dateLabel}`
            : (dayLabel || dateLabel);

        const scriptureMotto = isEasterDay
            ? (lang === "ru"
                ? "Воскресение Христа"
                : "Resurrection of Christ")
            : (lang === "ru"
                ? "Пусть Писание объясняет Писание"
                : "Let Scripture interpret Scripture");          
        const verseRef = verse?.verse_ref_lang?.[lang] || verse?.verse_ref || null;
        const bibleLink = buildBibleLink(verseRef, lang);
        const related = Array.isArray(verse.related) ? verse.related : [];
        const detailsTitle =
        lang === "ru" ? "Размышление:" : "Reflection:";
        const relatedTitle =
        lang === "ru" ? "См. также в Писании:" : "See also in Scripture:";
        const detailsId = `dv-details-${escapeHtml(verse.id || index)}`;
        const openBibleLabel = lang === "ru" ? "Открыть в Библии" : "Open in Bible";
        const previewText = getVersePreview(text);
        const expandBtnLabel = keepDetailsOpen
          ? (lang === "ru" ? "Меньше" : "Less")
          : (lang === "ru" ? "Подробнее" : "More");
        const detailsVerseTitle = lang === "ru" ? "Полный стих:" : "Full verse:";        

        root.innerHTML = `
        <section class="daily-verse-card" data-id="${escapeHtml(verse.id || "")}">
            <div class="daily-verse-header">
            <div class="daily-verse-label">${ui[lang].title}</div>

            <div class="daily-verse-date-wrap">
            <div class="daily-verse-date-row">

              ${
                verses.length > 1 && index > 0
                  ? `<button class="dv-arrow dv-left dv-arrow-date" type="button" aria-label="${ui[lang].prev}">‹</button>`
                  : `<span class="dv-arrow-placeholder dv-arrow-date-placeholder"></span>`
              }

              ${
                fullDateLabel
                  ? `
                  <div class="daily-verse-date-center">
                    <div class="daily-verse-date">
                      ${
                        dayLabel
                          ? `<span class="daily-day-badge">${escapeHtml(dayLabel)}</span>`
                          : ""
                      }
                      ${
                        dateLabel
                          ? `<span class="daily-date-text">${escapeHtml(dateLabel)}</span>`
                          : ""
                      }
                    </div>

                    <div class="daily-verse-date-jumps">
                      ${
                        index !== START_INDEX
                          ? `<button class="dv-jump-btn dv-jump-day1" type="button">
                              ${lang === "ru" ? "День 1" : "Day 1"}
                            </button>`
                          : ""
                      }

                      ${
                        todayIndex >= 0 && index !== todayIndex
                          ? `<button class="dv-jump-btn dv-jump-today" type="button">
                              ${lang === "ru" ? "Сегодня" : "Today"}
                            </button>`
                          : ""
                      }
                    </div>
                  </div>
                  `
                  : ""
              }

              ${
                verses.length > 1 && index < todayIndex
                  ? `<button class="dv-arrow dv-right dv-arrow-date" type="button" aria-label="${ui[lang].next}">›</button>`
                  : `<span class="dv-arrow-placeholder dv-arrow-date-placeholder"></span>`
              }

            </div>

            <div class="daily-verse-subtitle-row daily-verse-subtitle-row--plain">
              <div class="daily-verse-subtitle ${isEasterDay ? 'easter-subtitle' : ''}">
                ${escapeHtml(scriptureMotto)}
                ${
                  !isEasterDay
                    ? `
                    <button
                      class="footer-help-btn daily-motto-help-btn"
                      type="button"
                      aria-expanded="false"
                      aria-label="${lang === "ru" ? "Подробнее" : "More info"}"
                    >i</button>
                    <span class="footer-help-inline daily-motto-help-inline" hidden>
                      <span class="footer-help-box daily-help-box">
                        <button
                          class="footer-help-close daily-motto-help-close"
                          type="button"
                          aria-label="${lang === "ru" ? "Закрыть" : "Close"}"
                        >×</button>
                        ${
                          lang === "ru"
                            ? "Простые и понятные библейские стихи с краткими размышлениями и связанными местами — чтобы шаг за шагом понимать Слово Божие. Читай, размышляй и укрепляйся в вере."
                            : "Simple and clear Bible verses with short reflections and related passages — helping you understand the Word of God step by step. Read, reflect, and grow in faith."
                        }
                      </span>
                    </span>
                    `
                    : ""
                }
              </div>
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

          <div class="daily-verse-inline-row">
            <div class="daily-verse-text-wrap">
              ${previewText ? `<blockquote class="daily-verse-text daily-verse-preview">${escapeHtml(previewText)}</blockquote>` : ""}
            </div>

            <button
              type="button"
              class="daily-verse-inline-toggle"
              data-target="${detailsId}"
            >
              ${expandBtnLabel}
            </button>
          </div>

          <div class="daily-verse-details scripture-details" id="${detailsId}" style="display:${keepDetailsOpen ? "block" : "none"};">
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
                text
                  ? `
                  <p class="scripture-interpretation daily-verse-full-text">
                    <strong>${detailsVerseTitle}</strong>
                    ${addCreationHelp(text, lang)}
                  </p>
                  `
                  : ""
              }

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
        const jumpDay1Btn = root.querySelector('.dv-jump-day1');
        const jumpTodayBtn = root.querySelector('.dv-jump-today');
        const detailsBtn = root.querySelector('.daily-verse-inline-toggle');
        const detailsCloseBtn = root.querySelector('.dv-details-close');
        const helpBtn = root.querySelector('.daily-help-btn');
        const helpInline = root.querySelector('.daily-help-inline');
        const helpClose = root.querySelector('.daily-help-close');
        const mottoHelpBtn = root.querySelector('.daily-motto-help-btn');
        const mottoHelpInline = root.querySelector('.daily-motto-help-inline');
        const mottoHelpClose = root.querySelector('.daily-motto-help-close');

        const goPrev = () => {
          if (currentIndex > 0) {
            currentIndex = currentIndex - 1;
            renderCard(currentIndex);
          }
        };
        
        const goNext = () => {
          if (currentIndex < todayIndex) {
            currentIndex = currentIndex + 1;
            renderCard(currentIndex);
          }
        };

        if (jumpDay1Btn) {
          jumpDay1Btn.addEventListener("click", () => {
            currentIndex = START_INDEX;
            animateChange(() => {
            renderCard(currentIndex);
            });
          });
        }
        
        if (jumpTodayBtn) {
          jumpTodayBtn.addEventListener("click", () => {
            if (todayIndex >= 0) {
              currentIndex = todayIndex;
              animateChange(() => {
              renderCard(currentIndex);
              });
            }
          });
        }
        
        if (closeBtn) {
          closeBtn.addEventListener("click", () => {
            root.style.display = "none";
        
            const reopenBtn = document.getElementById("daily-verse-reopen");
            if (reopenBtn) {
              reopenBtn.textContent = lang === "ru" ? "📖 Стих дня" : "📖 Daily Verse";
              reopenBtn.style.display = "inline-block";
            }
          });
        }

          if (detailsBtn) {
            detailsBtn.addEventListener("click", () => {
              const targetId = detailsBtn.dataset.target;
              const target = document.getElementById(targetId);
              if (!target) return;
          
              const willOpen = target.style.display !== "block";
              toggleDailyVerseDetails(targetId);
              keepDetailsOpen = willOpen;
              updateDailyVerseToggleLabel(detailsBtn, keepDetailsOpen, lang);
            });
          }
          
          if (detailsCloseBtn) {
            detailsCloseBtn.addEventListener("click", () => {
              const targetId = detailsCloseBtn.dataset.target;
              closeDailyVerseDetails(targetId);
              keepDetailsOpen = false;
              updateDailyVerseToggleLabel(detailsBtn, keepDetailsOpen, lang);
            });
          }
          if (helpBtn && helpInline) {
            helpBtn.addEventListener("click", () => {
              const isOpen = !helpInline.hasAttribute("hidden");
          
              if (isOpen) {
                helpInline.setAttribute("hidden", "");
                helpBtn.setAttribute("aria-expanded", "false");
              } else {
                helpInline.removeAttribute("hidden");
                helpBtn.setAttribute("aria-expanded", "true");
              }
            });
          }
          
          if (helpClose && helpInline && helpBtn) {
            helpClose.addEventListener("click", () => {
              helpInline.setAttribute("hidden", "");
              helpBtn.setAttribute("aria-expanded", "false");
            });
          }

          if (mottoHelpBtn && mottoHelpInline) {
            mottoHelpBtn.addEventListener("click", () => {
              const isOpen = !mottoHelpInline.hasAttribute("hidden");
          
              if (isOpen) {
                mottoHelpInline.setAttribute("hidden", "");
                mottoHelpBtn.setAttribute("aria-expanded", "false");
              } else {
                mottoHelpInline.removeAttribute("hidden");
                mottoHelpBtn.setAttribute("aria-expanded", "true");
              }
            });
          }
          
          if (mottoHelpClose && mottoHelpInline && mottoHelpBtn) {
            mottoHelpClose.addEventListener("click", () => {
              mottoHelpInline.setAttribute("hidden", "");
              mottoHelpBtn.setAttribute("aria-expanded", "false");
            });
          }

        if (prevBtn) {
          prevBtn.addEventListener("click", goPrev);
        }
        
        if (nextBtn) {
          nextBtn.addEventListener("click", goNext);
        }
        initDailyVerseSwipe(root, goPrev, goNext);
        initDailyVerseTooltip(root);
      }
  
      animateChange(() => {
          renderCard(currentIndex);
      });
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

  function formatDateFromDateObj(date, lang = "en") {
    if (!(date instanceof Date)) return "";
  
    return date.toLocaleDateString(
      lang === "ru" ? "ru-RU" : "en-CA",
      {
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    );
  }

  function getVersePreview(text = "") {
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (!clean) return "";
  
    const maxLength = 34;
    if (clean.length <= maxLength) return clean;
  
    const shortened = clean.slice(0, maxLength);
    const lastSpace = shortened.lastIndexOf(" ");
  
    if (lastSpace > 18) {
      return shortened.slice(0, lastSpace).trim() + "...";
    }
  
    return shortened.trim() + "...";
  }

  function addCreationHelp(text, lang) {
    if (!text || lang !== "ru") return escapeHtml(text);
  
    const target = "новое творение";
  
    const helpHtml = `
      <button class="footer-help-btn daily-help-btn" type="button" aria-expanded="false" aria-label="Подробнее о слове «творение»">i</button>
      <span class="footer-help-inline daily-help-inline" hidden>
        <span class="footer-help-box daily-help-box">
          <button class="footer-help-close daily-help-close" type="button" aria-label="Закрыть">×</button>
          В Синодальном переводе здесь используется слово «тварь», которое в старом русском языке означает «творение».
        </span>
      </span>
    `;
  
    return escapeHtml(text).replace(
      target,
      `${target}${helpHtml}`
    );
  }

  function updateDailyVerseToggleLabel(button, isOpen, lang) {
    if (!button) return;
    button.textContent = isOpen
      ? (lang === "ru" ? "Меньше" : "Less")
      : (lang === "ru" ? "Подробнее" : "Open");
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

  function initDailyVerseSwipe(root, onPrev, onNext) {
    const swipeArea = root.querySelector(".daily-verse-card");
    if (!swipeArea) return;
  
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let isTouching = false;
  
    const MIN_SWIPE_X = 30;
    const MAX_SWIPE_Y = 60;
  
    swipeArea.addEventListener("touchstart", (e) => {
      if (!e.touches || e.touches.length !== 1) return;
  
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      endX = touch.clientX;
      endY = touch.clientY;
      isTouching = true;
    }, { passive: true });
  
    swipeArea.addEventListener("touchmove", (e) => {
      if (!isTouching || !e.touches || e.touches.length !== 1) return;
  
      const touch = e.touches[0];
      endX = touch.clientX;
      endY = touch.clientY;
    }, { passive: true });
  
    swipeArea.addEventListener("touchend", () => {
      if (!isTouching) return;
      isTouching = false;
  
      const deltaX = endX - startX;
      const deltaY = endY - startY;
  
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
  
      if (absX < MIN_SWIPE_X) return;
      if (absX <= absY) return;
      if (absY > MAX_SWIPE_Y) return;
  
      if (deltaX > 0) {
        const card = root.querySelector(".daily-verse-card");
        if (!card || !card.querySelector(".dv-left")) return;
        animateChange(() => onPrev());
      } else {
        const card = root.querySelector(".daily-verse-card");
        if (!card || !card.querySelector(".dv-right")) return;
        animateChange(() => onNext());
      }
    });
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
  
  function animateChange(callback) {
    const card = document.querySelector('.daily-verse-card');
  
    if (!card) {
      callback();
      return;
    }
  
    card.classList.add('dv-fade-out');
  
    setTimeout(() => {
      callback();
  
      const newCard = document.querySelector('.daily-verse-card');
      if (!newCard) return;
  
      newCard.classList.add('dv-fade-in');
  
      setTimeout(() => {
        newCard.classList.remove('dv-fade-in');
      }, 50);
  
    }, 200);
  }

