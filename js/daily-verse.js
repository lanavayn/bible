import { buildBibleLink, isOldTestamentBook } from "./bibleLinks.js";
import "./bible-chronology.js";
import { addInlineWordHelp } from "./inline-word-help.js";
import { initFeedbackControls, renderFeedbackControls } from "./feedback.js";

const easterDates = {
  2026: "2026-04-05",
  //2026: "2026-01-05",
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
        "/data/daily/daily-31-60.json",
        "/data/daily/daily-61-90.json",
        "/data/daily/daily-91-120.json"       
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

      // production: показываем сегодняшний день,
      // а если его ещё нет в JSON — последний доступный прошедший день
      let todayIndex = -1;
      let realTodayIndex = -1;

      for (let i = 0; i < verses.length; i++) {
        const day = Number(verses[i].day);

        if (day === todayDayNumber) {
          realTodayIndex = i;
        }

        if (day <= todayDayNumber) {
          todayIndex = i;
        }
      }

      if (todayIndex === -1) {
        todayIndex = START_INDEX;
      }

      const hasRealToday = realTodayIndex !== -1;

      let currentIndex = todayIndex;
      const requestedDay = getPositiveQueryNumber("day");
      if (requestedDay !== null) {
        const requestedIndex = verses.findIndex((verse, index) =>
          index <= todayIndex && Number(verse.day) === requestedDay
        );

        if (requestedIndex !== -1) {
          currentIndex = requestedIndex;
        }
      }

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
        const renderMainBibleIconLink = extraClass => bibleLink
          ? `
          <a
              class="scripture-book-link main-book-link daily-verse-book-link ${extraClass}"
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
          : "";
        const previewText = getVersePreview(text);
        const expandBtnLabel = keepDetailsOpen
          ? (lang === "ru" ? "Меньше" : "Less")
          : (lang === "ru" ? "Подробнее" : "More");
        const detailsVerseTitle = lang === "ru" ? "Полный стих:" : "Full verse:";
        const tomorrowVerse = index === todayIndex ? verses[index + 1] : null;
        const tomorrowVerseText = tomorrowVerse?.[`text_${lang}`] || "";
        const tomorrowVersePreview = getTomorrowPreview(tomorrowVerseText, 7);        
        const prevArrowHtml = verses.length > 1 && index > 0
          ? `<button class="dv-arrow dv-left dv-arrow-date" type="button" aria-label="${ui[lang].prev}">‹</button>`
          : `<span class="dv-arrow-placeholder dv-arrow-date-placeholder"></span>`;
        const nextArrowHtml = verses.length > 1 && index < todayIndex
          ? `<button class="dv-arrow dv-right dv-arrow-date" type="button" aria-label="${ui[lang].next}">›</button>`
          : `<span class="dv-arrow-placeholder dv-arrow-date-placeholder"></span>`;
        const titleLineHtml = renderDailyVerseTitleLine(
          topic
        );
        const verseReferenceInlineHtml = reference
          ? `
            <span class="daily-verse-inline-reference">
              <span class="daily-verse-inline-reference-text">${renderChronologyReference(reference, verseRef, lang)}</span>
              ${renderMainBibleIconLink("daily-verse-inline-book-link")}
              <span class="daily-reference-dash">—</span>
            </span>
          `
          : "";

        root.innerHTML = `
        <section class="daily-verse-card" data-id="${escapeHtml(verse.id || "")}">
          <div class="daily-card-kicker">
            <span class="daily-card-kicker-title">
              <span aria-hidden="true">📖</span>
              ${lang === "ru" ? "Стих дня" : "Daily Verse"}
            </span>
            <span class="daily-card-kicker-subtitle">
              ${lang === "ru" ? "Каждый день новый стих" : "Every day a new verse"}
            </span>
          </div>
            <div class="daily-verse-header">
           <!-- убрали заголовок -->

            <div class="daily-verse-date-wrap">
            <div class="daily-verse-date-row">

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
                        hasRealToday && todayIndex >= 0 && index !== todayIndex
                          ? `<button class="dv-jump-btn dv-jump-today" type="button">
                              ${lang === "ru" ? "Сегодня" : "Today"}
                            </button>`
                          : ""
                      }
                      <button class="dv-jump-btn dv-search-open" type="button">
                        🔍 ${lang === "ru" ? "Найти стих" : "Find a Verse"}
                      </button>

                      ${
                        tomorrowVersePreview
                          ? `
                          <div class="daily-tomorrow-wrap">

                            <button
                              class="dv-jump-btn daily-tomorrow-btn"
                              type="button"
                              aria-expanded="false"
                            >
                              🔜 ${lang === "ru" ? "Завтра" : "Tomorrow"}
                            </button>

                            <span
                              class="footer-help-inline daily-help-inline daily-tomorrow-box"
                              hidden
                            >
                              <span class="footer-help-box daily-help-box tomorrow-help-box">

                                <button
                                  class="footer-help-close daily-tomorrow-close"
                                  type="button"
                                  aria-label="${lang === "ru" ? "Закрыть" : "Close"}"
                                >
                                  ×
                                </button>

                                <strong>
                                  ${lang === "ru"
                                    ? "Стих на завтра:"
                                    : "Verse for tomorrow:"}
                                </strong>
                                <br>

                                “${escapeHtml(tomorrowVersePreview)}”

                              </span>
                            </span>

                          </div>
                          `
                          : ""
                      }
                    </div>
                  </div>
                  `
                  : ""
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
                <div class="daily-verse-title-inline daily-title-nav-row">
                    ${prevArrowHtml}
                    <span class="daily-title-main">
                      ${titleLineHtml}
                    </span>
                    ${nextArrowHtml}
                </div>
                `
                : ""
            }

            ${text ? `
              <blockquote class="daily-verse-text">
                ${verseReferenceInlineHtml}
                ${addCreationHelp(text, lang, verseRef)}
              </blockquote>
            ` : ""}

            <div class="scripture-note-box">
              ${
                interpretation
                  ? `
                  <p class="scripture-interpretation">
                    <strong>${detailsTitle}</strong>
                    ${addCreationHelp(interpretation, lang, verseRef)}
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

            ${renderFeedbackControls({
              contentType: "daily-verse",
              contentId: verse.day,
              language: lang
            })}
            
        </section>
        `;
  
        const prevBtn = root.querySelector('.dv-left');
        const nextBtn = root.querySelector('.dv-right');
        const closeBtn = root.querySelector('.dv-close');
        const jumpDay1Btn = root.querySelector('.dv-jump-day1');
        const jumpTodayBtn = root.querySelector('.dv-jump-today');
        const searchOpenBtn = root.querySelector('.dv-search-open');
        // creation/tvar helper buttons
        const mottoHelpBtn = root.querySelector('.daily-motto-help-btn');
        const mottoHelpInline = root.querySelector('.daily-motto-help-inline');
        const mottoHelpClose = root.querySelector('.daily-motto-help-close');

        const goPrev = () => {
          if (currentIndex > 0) {
            currentIndex = currentIndex - 1;
            updateQueryNumber("day", verses[currentIndex]?.day);
            renderCard(currentIndex);
          }
        };
        
        const goNext = () => {
          if (currentIndex < todayIndex) {
            currentIndex = currentIndex + 1;
            updateQueryNumber("day", verses[currentIndex]?.day);
            renderCard(currentIndex);
          }
        };

        if (jumpDay1Btn) {
          jumpDay1Btn.addEventListener("click", () => {
            currentIndex = START_INDEX;
            updateQueryNumber("day", verses[currentIndex]?.day);
            animateChange(() => {
            renderCard(currentIndex);
            });
          });
        }
        
        if (jumpTodayBtn) {
          jumpTodayBtn.addEventListener("click", () => {
            if (todayIndex >= 0) {
              currentIndex = todayIndex;
              updateQueryNumber("day", verses[currentIndex]?.day);
              animateChange(() => {
              renderCard(currentIndex);
              });
            }
          });
        }

        if (searchOpenBtn) {
          searchOpenBtn.addEventListener("click", () => {
            openDailyVerseSearch();
          });
        }
        
        if (closeBtn) {
          closeBtn.addEventListener("click", () => {
            root.innerHTML = "";
        
            document.querySelectorAll(".dv-reopen-btn").forEach(btn => {
              btn.classList.remove("is-active", "is-muted");
            });
        
            const reopenBtn = document.getElementById("daily-verse-reopen");
            if (reopenBtn) {
              reopenBtn.textContent = lang === "ru" ? "📖 Стих дня" : "📖 Daily Verse";
              reopenBtn.style.display = "inline-block";
            }
          });
        }

        function closeAllDailyHelp(exceptInline = null) {
          window.PopupManager?.closeAll({ except: exceptInline });

          document.querySelectorAll(".footer-help-inline").forEach(inline => {
            if (inline !== exceptInline) {
              inline.setAttribute("hidden", "");
            }
          });

          document.querySelectorAll(".footer-help-btn, .daily-tomorrow-btn, .question-tomorrow-btn").forEach(btn => {
            btn.setAttribute("aria-expanded", "false");
          });
        }
        root.querySelectorAll(".daily-help-btn").forEach(btn => {
          const inline = btn.nextElementSibling;
          if (!inline) return;
        
          btn.addEventListener("click", () => {
            const isOpen = !inline.hasAttribute("hidden");
        
            closeAllDailyHelp(inline);

            if (isOpen) {
              inline.setAttribute("hidden", "");
              btn.setAttribute("aria-expanded", "false");
            } else {
              inline.removeAttribute("hidden");
              btn.setAttribute("aria-expanded", "true");
            }
          });
        });
        
        root.querySelectorAll(".daily-help-close").forEach(closeBtn => {
          closeBtn.addEventListener("click", () => {
            const inline = closeBtn.closest(".daily-help-inline");
            const btn = inline?.previousElementSibling;
        
            if (inline) inline.setAttribute("hidden", "");
            if (btn) btn.setAttribute("aria-expanded", "false");
          });
        });

          if (mottoHelpBtn && mottoHelpInline) {
            mottoHelpBtn.addEventListener("click", () => {
              const isOpen = !mottoHelpInline.hasAttribute("hidden");
          
              closeAllDailyHelp(mottoHelpInline);

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

          const tomorrowBtn = root.querySelector(".daily-tomorrow-btn");
          const tomorrowBox = root.querySelector(".daily-tomorrow-box");
          const tomorrowClose = root.querySelector(".daily-tomorrow-close");

          if (tomorrowBtn && tomorrowBox) {
            tomorrowBtn.addEventListener("click", () => {
              const isOpen = !tomorrowBox.hasAttribute("hidden");

              closeAllDailyHelp(tomorrowBox);

              if (isOpen) {
                tomorrowBox.setAttribute("hidden", "");
                tomorrowBtn.setAttribute("aria-expanded", "false");
              } else {
                tomorrowBox.removeAttribute("hidden");
                tomorrowBtn.setAttribute("aria-expanded", "true");
              }
            });
          }

          if (tomorrowClose && tomorrowBox && tomorrowBtn) {
            tomorrowClose.addEventListener("click", () => {
              tomorrowBox.setAttribute("hidden", "");
              tomorrowBtn.setAttribute("aria-expanded", "false");
            });
          }

        if (prevBtn) {
          prevBtn.addEventListener("click", goPrev);
        }
        
        if (nextBtn) {
          nextBtn.addEventListener("click", goNext);
        }
        initDailyVerseSwipe(root, goPrev, goNext);

        bindDailyChronologyReferences(root);
  
        initDailyVerseTooltip(root);
        initFeedbackControls(root);
      }
      function openDailyVerseSearch() {
        const availableVerses = verses
          .map((verse, index) => ({ verse, index }))
          .filter(item => item.index <= todayIndex);
      
        let overlay = document.getElementById("daily-verse-search-overlay");
      
        if (!overlay) {
          overlay = document.createElement("div");
          overlay.id = "daily-verse-search-overlay";
          overlay.className = "daily-verse-search-overlay";
          document.body.appendChild(overlay);
        }
      
        const title = lang === "ru" ? "Найти стих" : "Find a Verse";
        const searchLabel = lang === "ru" ? "Поиск по слову" : "Search by word";
        const searchPlaceholder = lang === "ru"
          ? "Например: вера, любовь, Иоанна..."
          : "Example: faith, love, John...";


        const jumpLabel = lang === "ru" ? "Перейти к дню" : "Go to Day";
        const openLabel = lang === "ru" ? "Открыть" : "Open";
        const listLabel = lang === "ru" ? "Список стихов" : "List of verses";
        
        const dayNotAvailable = lang === "ru"
          ? `Выберите день от 1 до ${availableVerses.length}.`
          : `Please select a day from 1 to ${availableVerses.length}.`;
      
        overlay.innerHTML = `
          <div class="daily-verse-search-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
            <button class="daily-verse-search-close" type="button" aria-label="${lang === "ru" ? "Закрыть" : "Close"}">×</button>
      
            <h2 class="daily-verse-search-title">🔍 ${escapeHtml(title)}</h2>
      
            <label class="daily-verse-search-label" for="dailyVerseSearchInput">
              ${escapeHtml(searchLabel)}
            </label>
            <div class="daily-verse-input-row">
              <input
                id="dailyVerseSearchInput"
                class="daily-verse-search-input"
                type="search"
                placeholder="${escapeHtml(searchPlaceholder)}"
              >
              <button
                class="daily-verse-inline-search-btn daily-verse-word-search-btn"
                type="button"
                aria-label="${escapeHtml(searchLabel)}"
                title="${escapeHtml(searchLabel)}"
              >
                🔍
              </button>
            </div>

            <div class="daily-verse-jump-box">
              <label class="daily-verse-search-label" for="dailyVerseDayInput">
                ${escapeHtml(jumpLabel)}
              </label>
              <div class="daily-verse-input-row">
                <input
                  id="dailyVerseDayInput"
                  class="daily-verse-day-input"
                  type="number"
                  min="1"
                  max="${escapeHtml(String(availableVerses.length))}"
                  placeholder="${lang === "ru"
                    ? `Выберите день 1–${availableVerses.length}`
                    : `Select day 1–${availableVerses.length}`}"
                >
                <button
                  class="daily-verse-inline-search-btn daily-verse-day-open"
                  type="button"
                  aria-label="${escapeHtml(openLabel)}"
                  title="${escapeHtml(openLabel)}"
                >
                  🔍
                </button>
              </div>
            </div>
      
            <div class="daily-verse-search-list-title">${escapeHtml(listLabel)}</div>
            <div class="daily-verse-search-results"></div>
          </div>
        `;
      
        overlay.style.display = "flex";
      
        const modal = overlay.querySelector(".daily-verse-search-modal");
        const closeBtn = overlay.querySelector(".daily-verse-search-close");
        const searchInput = overlay.querySelector("#dailyVerseSearchInput");
        const dayInput = overlay.querySelector("#dailyVerseDayInput");
        dayInput.value = "";
        dayInput.min = "1";
        dayInput.max = String(availableVerses.length);

        dayInput.addEventListener("input", () => {
          const value = Number(dayInput.value);

          if (value > availableVerses.length) {
            dayInput.value = String(availableVerses.length);
          }

          if (value < 1 && dayInput.value !== "") {
            dayInput.value = "1";
          }
        });
        const dayOpenBtn = overlay.querySelector(".daily-verse-day-open");
        const wordSearchBtn = overlay.querySelector(".daily-verse-word-search-btn");
        const resultsBox = overlay.querySelector(".daily-verse-search-results");
      
        function closeSearch() {
          overlay.style.display = "none";
        }
      
        function openVerseByIndex(index) {
          currentIndex = index;
          updateQueryNumber("day", verses[currentIndex]?.day);
        
          closeSearch();
        
          animateChange(() => {
            renderCard(currentIndex);
        
            requestAnimationFrame(() => {
              const dailyVerseCard = document.querySelector(".daily-verse-card");
        
              if (dailyVerseCard) {
                dailyVerseCard.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });
              }
            });
          });
        }
      
        function getSearchText(verse) {
          return [
            verse.topic?.[lang],
            verse[`reference_${lang}`],
            verse[`text_${lang}`],
            verse[`interpretation_${lang}`]
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        }
      
        function renderResults(query = "") {
          const cleanQuery = query.trim().toLowerCase();
      
          const filtered = availableVerses.filter(({ verse }) => {
            if (!cleanQuery) return true;
            return getSearchText(verse).includes(cleanQuery);
          });   
     
          resultsBox.innerHTML = filtered.map(({ verse, index }) => {
            const topic = verse.topic?.[lang] || "";
            const reference = verse[`reference_${lang}`] || "";
            const dayText = `${verse.day}`;
            const todayText = index === todayIndex
              ? `<span class="daily-verse-today-pill">${lang === "ru" ? "Сегодня" : "Today"}</span>`
              : "";
      
            return `
            <button class="daily-verse-search-item" type="button" data-index="${index}">
              <span class="daily-verse-search-line">
                <strong>${escapeHtml(dayText)}</strong>
                ${todayText}
                <span>${escapeHtml(topic)}</span><span class="daily-verse-search-colon">:</span>
                <span>${escapeHtml(reference)}</span>
              </span>
            </button>
          `;
          }).join("");
      
          resultsBox.querySelectorAll(".daily-verse-search-item").forEach(btn => {
            btn.addEventListener("click", () => {
              const index = Number(btn.dataset.index);
              if (!Number.isNaN(index)) {
                openVerseByIndex(index);
              }
            });
          });
        }
      
        closeBtn.addEventListener("click", closeSearch);
      
        overlay.addEventListener("click", (event) => {
          if (event.target === overlay) {
            closeSearch();
          }
        });
      
        document.addEventListener("keydown", function handleEsc(event) {
          if (event.key === "Escape" && overlay.style.display === "flex") {
            closeSearch();
            document.removeEventListener("keydown", handleEsc);
          }
        });
      
        searchInput.addEventListener("input", () => {
          renderResults(searchInput.value);
        });

        wordSearchBtn.addEventListener("click", () => {
          const query = searchInput.value.trim();
        
          if (!query) {
            renderResults();
            return;
          }
        
          const hasMatches = availableVerses.some(({ verse }) => {
            return getSearchText(verse).includes(query.toLowerCase());
          });
        
          if (!hasMatches) {
            showDailyVerseWarning(
              lang === "ru"
                ? "Такое слово не найдено."
                : "This word was not found."
            );
        
            searchInput.value = "";
            renderResults();
            return;
          }
        
          renderResults(query);
        });

        function showDailyVerseWarning(message) {
          const existingWarning = overlay.querySelector(".daily-verse-warning");
        
          if (existingWarning) {
            existingWarning.remove();
          }
        
          const warning = document.createElement("div");
          warning.className = "daily-verse-warning";
          warning.textContent = message;
        
          const searchRow = overlay.querySelector(".daily-verse-input-row");

          if (searchRow) {
            searchRow.insertAdjacentElement("afterend", warning);
          }
        
          setTimeout(() => {
            warning.remove();
          }, 4000);
        }
      
        dayOpenBtn.addEventListener("click", () => {
          const dayNumber = Number(dayInput.value);
          const found = availableVerses.find(({ verse }) => Number(verse.day) === dayNumber);
        
          if (found) {
            openVerseByIndex(found.index);
            return;
          }
        
          const existingWarning = overlay.querySelector(".daily-verse-warning");

          if (existingWarning) {
            existingWarning.remove();
          }

          const warning = document.createElement("div");
          warning.className = "daily-verse-warning";
          warning.textContent = dayNotAvailable;

          resultsBox.parentNode.insertBefore(warning, resultsBox);

          setTimeout(() => {
            warning.remove();
          }, 2500);
        });
      
        dayInput.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            dayOpenBtn.click();
          }
        });
      
        renderResults();
        //setTimeout(() => searchInput.focus(), 50);
      }

      updateQueryNumber("day", verses[currentIndex]?.day);
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

  function addCreationHelp(text, lang, verseRef = null) {
    return addInlineWordHelp(text, {
      lang,
      isOldTestament: isOldTestamentBook(verseRef),
      classes: {
        button: "daily-help-btn",
        inline: "daily-help-inline",
        box: "daily-help-box",
        close: "daily-help-close"
      }
    });
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

  function renderChronologyReference(reference = "", verseRef = null, lang = "ru") {
    return window.BibleChronology?.renderReference(reference, verseRef, { lang }) || escapeHtml(reference);
  }

  function renderDailyVerseTitleLine(topic = "") {
    const cleanTopic = String(topic || "").trim();
    return cleanTopic ? `<span class="daily-verse-title-text">${escapeHtml(cleanTopic)}</span>` : "";
  }

  function bindDailyChronologyReferences(root) {
    if (!root.dataset.chronologyCloseBound) {
      root.dataset.chronologyCloseBound = "true";
      root.addEventListener("click", (event) => {
        if (window.BibleChronology?.closeFromEvent(event)) return;
      });
    }

    root.querySelectorAll(".bible-chronology-book-link").forEach((bookName) => {
      const openChronology = async () => {
        if (!window.BibleChronology) return;

        const reference = JSON.parse(bookName.dataset.chronologyReference || "null");
        const titleAnchor = bookName.closest(".daily-verse-title-inline");
        const relatedAnchor = bookName.closest(".scripture-related-line-anchor");
        const verseTextAnchor = bookName.closest(".daily-verse-text");
        const target = bookName.closest(".scripture-related-ref") || bookName.closest(".daily-verse-title-text") || bookName;
        await window.BibleChronology.showReferenceDetails(reference, target, {
          insertAfter: titleAnchor || relatedAnchor || verseTextAnchor || target
        });
      };

      bookName.addEventListener("click", openChronology);
      bookName.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openChronology();
      });
    });

    root.querySelectorAll("a.scripture-book-link").forEach((link) => {
      link.addEventListener("click", () => {
        window.BibleChronology?.closeOpenDetails();
      });
    });
  }
  function renderDailyRelatedItem(rel, lang) {
    const ref = rel[`reference_${lang}`] || "";
    const text = rel[`text_${lang}`] || "";
    const verseRef = rel?.verse_ref_lang?.[lang] || rel?.verse_ref || null;
    const link = buildBibleLink(verseRef, lang);
    const hasRealLink = !!link;
    const { firstPart, remainingPart } = splitRelatedVerseLine(text);
  
    return `
      <li class="scripture-related-item">
        <span class="scripture-related-line-anchor">
        <span class="scripture-related-ref">${renderChronologyReference(ref, verseRef, lang)}</span>
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
        <span class="scripture-related-text scripture-related-dash">—</span>
        <span class="scripture-related-text">${addCreationHelp(firstPart, lang, verseRef)}</span>
        </span>${remainingPart ? `<span class="scripture-related-text scripture-related-text-remaining"> ${addCreationHelp(remainingPart, lang, verseRef)}</span>` : ""}
      </li>
    `;
  }

  function splitRelatedVerseLine(text = "") {
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (!clean) return { firstPart: "", remainingPart: "" };

    const punctuationMatch = clean.match(/[,;.!?](?=\s|$)/);
    if (punctuationMatch && punctuationMatch.index >= 0) {
      const splitAt = punctuationMatch.index + punctuationMatch[0].length;
      return {
        firstPart: clean.slice(0, splitAt).trim(),
        remainingPart: clean.slice(splitAt).trim()
      };
    }

    const words = clean.split(" ");
    if (words.length <= 8) {
      return { firstPart: clean, remainingPart: "" };
    }

    return {
      firstPart: words.slice(0, 8).join(" "),
      remainingPart: words.slice(8).join(" ")
    };
  }
  
  function getTomorrowPreview(text = "", words = 7) {
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (!clean) return "";

    const parts = clean.split(" ");
    if (parts.length <= words) return clean;

    return parts.slice(0, words).join(" ") + "...";
  }

  function getPositiveQueryNumber(name) {
    const value = Number(new URLSearchParams(window.location.search).get(name));
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  function updateQueryNumber(name, value) {
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) return;

    const url = new URL(window.location.href);
    url.searchParams.set(name, String(number));
    if (name === "day") {
      url.searchParams.delete("question");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
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
