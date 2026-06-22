import { buildBibleLink, isOldTestamentBook } from "./bibleLinks.js";

//
// PROD date Anpril 30 2026
const START_DATE = "2026-04-30";
//test  
//const START_DATE = "2026-03-01";

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getTodayIndex() {
  const today = stripTime(new Date());
  const start = parseDate(START_DATE);

  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

window.renderQuestionOfDay = async function renderQuestionOfDay(rootId = "question-of-day") {
  const root = document.getElementById(rootId);
  if (!root) return;

  const reopenBtn = document.getElementById("question-reopen");

  if (reopenBtn && !reopenBtn.dataset.bound) {
    reopenBtn.dataset.bound = "true";

    reopenBtn.addEventListener("click", () => {
        root.style.display = "block";
        reopenBtn.style.display = "none";
        root.scrollIntoView({ behavior: "smooth" });
    });
  }

  const lang = document.documentElement.lang?.startsWith("ru") ? "ru" : "en";

  root.innerHTML = `<div>Loading...</div>`;

  try {
    const jsonPaths = [
      "/data/questions/question-1-30.json",
      "/data/questions/question-31-60.json"
    ];
    
    let questions = [];
    
    for (const path of jsonPaths) {
      const response = await fetch(path, { cache: "no-store" });
    
      if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
      }
    
      const data = await response.json();
      const fileQuestions = Array.isArray(data?.questions) ? data.questions : [];
      questions = questions.concat(fileQuestions);
    }
    
    //PROD code
    const todayDay = getTodayIndex();

    let todayIndex = -1;
    let realTodayIndex = -1;

    for (let i = 0; i < questions.length; i++) {
      const day = Number(questions[i].day);

      if (day === todayDay) {
        realTodayIndex = i;
      }

      if (day <= todayDay) {
        todayIndex = i;
      }
    }

    if (todayIndex === -1) {
      todayIndex = 0;
    }

    const hasRealToday = realTodayIndex !== -1;
    let currentIndex = todayIndex;

    function renderCard(index) {
      const q = questions[index];
      const isToday = hasRealToday && index === todayIndex;

      const question = q[`question_${lang}`];
      const text = q[`text_${lang}`];
      const answer = q[`answer_${lang}`];
      const reference = q[`reference_${lang}`];

      const verseRef = q?.verse_ref_lang?.[lang] || q?.verse_ref || null;
      const bibleLink = buildBibleLink(verseRef, lang);

      const tomorrowQuestion = index === todayIndex ? questions[index + 1] : null;
      const tomorrowQuestionText = tomorrowQuestion?.[`question_${lang}`] || "";
      const tomorrowQuestionPreview = getTomorrowPreview(tomorrowQuestionText, 4);

      root.innerHTML = `
      <div class="daily-verse-card">

        <div class="daily-verse-daily-note">
          ${lang === "ru"
            ? "Каждый день — новый вопрос"
            : "A new question every day"}
        </div>

        <div class="daily-verse-date-row">
          ${
            index > 0
              ? `<button class="dv-arrow dv-left dv-arrow-date dv-prev" type="button">‹</button>`
              : `<span class="dv-arrow-placeholder dv-arrow-date-placeholder"></span>`
          }

          <div class="daily-verse-date-center">
            <div class="daily-verse-date">
              <span class="daily-day-badge">
                ${lang === "ru" 
                  ? `День ${q.day}${isToday ? " · Сегодня" : ""}`
                  : `Day ${q.day}${isToday ? " · Today" : ""}`
                }
              </span>
            </div>

            <div class="daily-verse-date-jumps">

            <button class="dv-jump-btn question-search-open" type="button">
              🔍 ${lang === "ru" ? "Найти вопрос" : "Find a Question"}
            </button>

            ${
              tomorrowQuestionPreview
                ? `
                <div class="daily-tomorrow-wrap">

                  <button
                    class="dv-jump-btn question-tomorrow-btn"
                    type="button"
                    aria-expanded="false"
                  >
                    🔜 ${lang === "ru" ? "Завтра" : "Tomorrow"}
                  </button>

                  <span
                    class="footer-help-inline question-tomorrow-box"
                    hidden
                  >
                    <span class="footer-help-box daily-help-box tomorrow-help-box">

                      <button
                        class="footer-help-close question-tomorrow-close"
                        type="button"
                        aria-label="${lang === "ru" ? "Закрыть" : "Close"}"
                      >
                        ×
                      </button>

                      <strong>
                        ${lang === "ru"
                          ? "Вопрос на завтра:"
                          : "Question for tomorrow:"}
                      </strong>
                      <br>

                      ${escapeHtml(tomorrowQuestionPreview)}

                    </span>
                  </span>

                </div>
                `
                : ""
            }

          </div>  
          </div>

          ${
            index < todayIndex
              ? `<button class="dv-arrow dv-right dv-arrow-date dv-next" type="button">›</button>`
              : `<span class="dv-arrow-placeholder dv-arrow-date-placeholder"></span>`
          }
        </div>
            <button
                class="dv-close"
                type="button"
                aria-label="${lang === "ru" ? "Закрыть" : "Close"}"
                title="${lang === "ru" ? "Закрыть" : "Close"}"
        >×</button>

        <div class="daily-verse-title-inline">
          <span class="daily-verse-title-text">
            ${question}
          </span>
        </div>

        <div class="daily-verse-subtitle-row daily-verse-subtitle-row--plain">
          <div class="daily-verse-subtitle">
            ${lang === "ru" ? "Пусть Писание объясняет Писание" : "Let Scripture explain Scripture"}
    
            <button
              class="footer-help-btn question-motto-help-btn"
              type="button"
              aria-expanded="false"
              aria-label="${lang === "ru" ? "Подробнее" : "More info"}"
            >i</button>
    
            <span class="footer-help-inline question-motto-help-inline" hidden>
              <span class="footer-help-box daily-help-box">
                <button
                  class="footer-help-close question-motto-help-close"
                  type="button"
                  aria-label="${lang === "ru" ? "Закрыть" : "Close"}"
                >×</button>
                ${
                  lang === "ru"
                    ? "Короткий вопрос, основной стих и связанные места помогают понять тему через само Писание."
                    : "A short question, main verse, and related passages help explain the topic through Scripture itself."
                }
              </span>
            </span>
          </div>
        </div>  
    
        <div class="daily-verse-title-inline">
          <span class="daily-verse-title-text">
            ${reference}
          </span>
          ${
            bibleLink
              ? `<a
                   href="${bibleLink}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="scripture-book-link main-book-link daily-verse-book-link"
                   title="${lang === "ru" ? "Открыть в Библии" : "Open in Bible"}"
                 >
                   <span class="book-icon">📖</span>
                 </a>`
              : ""
          }
        </div>
    
        <blockquote class="daily-verse-text">
          ${addQuestionCreationHelp(text, lang, verseRef)}
        </blockquote>
    
        <div class="scripture-note-box">
          <p class="scripture-interpretation">
            <strong>${lang === "ru" ? "Размышление:" : "Reflection:"}</strong>
            ${answer}
          </p>
    
          ${
            q.related && q.related.length
              ? `
              <div class="scripture-related-block">
                <p class="scripture-related-title">
                  <strong>${lang === "ru" ? "См. также в Писании:" : "See also in Scripture:"}</strong>
                </p>
                <ul class="scripture-related-list">
                  ${q.related.map(rel => {
                    const ref = rel["reference_" + lang] || "";
                    const relText = rel["text_" + lang] || "";
                    const relVerseRef =
                      rel?.verse_ref_lang?.[lang] || rel?.verse_ref || null;

                    const link = buildBibleLink(relVerseRef, lang);
    
                    return `
                      <li class="scripture-related-item">
                        <span class="scripture-related-ref">${ref}</span>
                        ${
                          link
                            ? `<a
                                class="scripture-book-link"
                                href="${link}"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="${lang === "ru" ? "Открыть стих в Библии" : "Open verse in Bible"}"
                              >📖</a>`
                            : ""
                        }
                        <span class="scripture-related-text">— ${addQuestionCreationHelp(relText, lang, relVerseRef)}</span>
                      </li>
                    `;
                  }).join("")}
                </ul>
              </div>
              `
              : ""
          }
        </div>
    
      </div>
    `;

      const closeBtn = root.querySelector(".dv-close");
      const searchOpenBtn = root.querySelector(".question-search-open");

      function closeAllQuestionHelp(exceptInline = null) {
        document.querySelectorAll(".footer-help-inline").forEach(inline => {
          if (inline !== exceptInline) {
            inline.setAttribute("hidden", "");
          }
        });
      
        document.querySelectorAll(".footer-help-btn, .question-tomorrow-btn").forEach(btn => {
          btn.setAttribute("aria-expanded", "false");
        });
      }
      
      function toggleQuestionHelp(btn, inline) {
        if (!btn || !inline) return;
      
        const willOpen = inline.hasAttribute("hidden");
      
        closeAllQuestionHelp(inline);
      
        if (willOpen) {
          inline.removeAttribute("hidden");
          btn.setAttribute("aria-expanded", "true");
        } else {
          inline.setAttribute("hidden", "");
          btn.setAttribute("aria-expanded", "false");
        }
      }

      if (searchOpenBtn) {
        searchOpenBtn.addEventListener("click", () => {
          openQuestionSearch();
        });
      }
      const mottoHelpBtn = root.querySelector(".question-motto-help-btn");
        const mottoHelpInline = root.querySelector(".question-motto-help-inline");
        const mottoHelpClose = root.querySelector(".question-motto-help-close");

        if (mottoHelpBtn && mottoHelpInline) {
          mottoHelpBtn.addEventListener("click", () => {
            toggleQuestionHelp(mottoHelpBtn, mottoHelpInline);
          });
        }

        if (mottoHelpClose && mottoHelpInline && mottoHelpBtn) {
        mottoHelpClose.addEventListener("click", () => {
            mottoHelpInline.setAttribute("hidden", "");
            mottoHelpBtn.setAttribute("aria-expanded", "false");
        });
        }

        const tomorrowBtn = root.querySelector(".question-tomorrow-btn");
        const tomorrowBox = root.querySelector(".question-tomorrow-box");
        const tomorrowClose = root.querySelector(".question-tomorrow-close");

        if (tomorrowBtn && tomorrowBox) {
          tomorrowBtn.addEventListener("click", () => {
            toggleQuestionHelp(tomorrowBtn, tomorrowBox);
          });
        }

        if (tomorrowClose && tomorrowBox && tomorrowBtn) {
          tomorrowClose.addEventListener("click", () => {
            tomorrowBox.setAttribute("hidden", "");
            tomorrowBtn.setAttribute("aria-expanded", "false");
          });
        }

        root.querySelectorAll(".question-creation-help-btn").forEach(btn => {
          const inline = btn.nextElementSibling;
          if (!inline) return;
        
          btn.addEventListener("click", () => {
            toggleQuestionHelp(btn, inline);
          });
        });
        
        root.querySelectorAll(".question-creation-help-close").forEach(closeBtn => {
          closeBtn.addEventListener("click", () => {
            const inline = closeBtn.closest(".question-creation-help-inline");
            const btn = inline?.previousElementSibling;
        
            if (inline) inline.setAttribute("hidden", "");
            if (btn) btn.setAttribute("aria-expanded", "false");
          });
        });
        
        if (closeBtn) {
          closeBtn.addEventListener("click", () => {
            root.innerHTML = "";
        
            document.querySelectorAll(".dv-reopen-btn").forEach(btn => {
              btn.classList.remove("is-active", "is-muted");
            });
        
            const reopenBtn = document.getElementById("question-reopen");
            if (reopenBtn) {
              reopenBtn.textContent = lang === "ru" ? "💬 Вопрос дня" : "💬 Daily Question";
              reopenBtn.style.display = "inline-block";
            }
          });
        }

      const prevBtn = root.querySelector(".dv-prev");
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          renderCard(index - 1);
        });
      }

      const nextBtn = root.querySelector(".dv-next");
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          renderCard(index + 1);
        });
      }
    }
    function openQuestionSearch() {
      const availableQuestions = questions
        .map((question, index) => ({ question, index }))
        .filter(item => item.index <= todayIndex);
    
      let overlay = document.getElementById("question-search-overlay");
    
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "question-search-overlay";
        overlay.className = "daily-verse-search-overlay";
        document.body.appendChild(overlay);
      }
    
      const title = lang === "ru" ? "Найти вопрос" : "Find a Question";
      const searchLabel = lang === "ru" ? "Поиск по слову" : "Search by word";
      const searchPlaceholder = lang === "ru"
        ? "Например: вера, грех, молитва..."
        : "Example: faith, sin, prayer...";
    
      const jumpLabel = lang === "ru" ? "Перейти к дню" : "Go to Day";
      const openLabel = lang === "ru" ? "Открыть" : "Open";
      const listLabel = lang === "ru" ? "Список вопросов" : "List of questions";
    
      const dayNotAvailable = lang === "ru"
        ? `Выберите день от 1 до ${availableQuestions.length}.`
        : `Please select a day from 1 to ${availableQuestions.length}.`;
    
      overlay.innerHTML = `
        <div class="daily-verse-search-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
          <button class="daily-verse-search-close" type="button" aria-label="${lang === "ru" ? "Закрыть" : "Close"}">×</button>
    
          <h2 class="daily-verse-search-title">🔍 ${escapeHtml(title)}</h2>
    
          <label class="daily-verse-search-label" for="questionSearchInput">
            ${escapeHtml(searchLabel)}
          </label>
    
          <div class="daily-verse-input-row">
            <input
              id="questionSearchInput"
              class="daily-verse-search-input"
              type="search"
              placeholder="${escapeHtml(searchPlaceholder)}"
            >
            <button
              class="daily-verse-inline-search-btn question-word-search-btn"
              type="button"
              aria-label="${escapeHtml(searchLabel)}"
              title="${escapeHtml(searchLabel)}"
            >
              🔍
            </button>
          </div>
    
          <div class="daily-verse-jump-box">
            <label class="daily-verse-search-label" for="questionDayInput">
              ${escapeHtml(jumpLabel)}
            </label>
    
            <div class="daily-verse-input-row">
              <input
                id="questionDayInput"
                class="daily-verse-day-input"
                type="number"
                min="1"
                max="${escapeHtml(String(availableQuestions.length))}"
                placeholder="${lang === "ru"
                  ? `Выберите день 1–${availableQuestions.length}`
                  : `Select day 1–${availableQuestions.length}`}"
              >
              <button
                class="daily-verse-inline-search-btn question-day-open"
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
    
      const closeBtn = overlay.querySelector(".daily-verse-search-close");
      const searchInput = overlay.querySelector("#questionSearchInput");
      const dayInput = overlay.querySelector("#questionDayInput");
      const dayOpenBtn = overlay.querySelector(".question-day-open");
      const wordSearchBtn = overlay.querySelector(".question-word-search-btn");
      const resultsBox = overlay.querySelector(".daily-verse-search-results");
    
      dayInput.value = "";
      dayInput.min = "1";
      dayInput.max = String(availableQuestions.length);
    
      function closeSearch() {
        overlay.style.display = "none";
      }
    
      function openQuestionByIndex(index) {
        currentIndex = index;
        closeSearch();
    
        renderCard(currentIndex);
    
        requestAnimationFrame(() => {
          const card = document.querySelector("#question-of-day .daily-verse-card");
    
          if (card) {
            card.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        });
      }
    
      function getSearchText(q) {
        return [
          q.topic?.[lang],
          q[`question_${lang}`],
          q[`reference_${lang}`],
          q[`text_${lang}`],
          q[`answer_${lang}`]
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
      }
    
      function showQuestionWarning(message) {
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
    
      function renderResults(query = "") {
        const cleanQuery = query.trim().toLowerCase();
    
        const filtered = availableQuestions.filter(({ question }) => {
          if (!cleanQuery) return true;
          return getSearchText(question).includes(cleanQuery);
        });
    
        resultsBox.innerHTML = filtered.map(({ question, index }) => {
          const questionText = question[`question_${lang}`] || "";
          const reference = question[`reference_${lang}`] || "";
          const dayText = `${question.day}`;
          const todayText = hasRealToday && index === todayIndex
            ? `<span class="daily-verse-today-pill">${lang === "ru" ? "Сегодня" : "Today"}</span>`
            : "";
    
          return `
            <button class="daily-verse-search-item" type="button" data-index="${index}">
              <span class="daily-verse-search-line">
                <strong>${escapeHtml(dayText)}</strong>
                ${todayText}
                <span>${escapeHtml(questionText)}</span>
                <span class="daily-verse-search-colon">:</span>
                <span>${escapeHtml(reference)}</span>
              </span>
            </button>
          `;
        }).join("");
    
        resultsBox.querySelectorAll(".daily-verse-search-item").forEach(btn => {
          btn.addEventListener("click", () => {
            const index = Number(btn.dataset.index);
    
            if (!Number.isNaN(index)) {
              openQuestionByIndex(index);
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
    
        const hasMatches = availableQuestions.some(({ question }) => {
          return getSearchText(question).includes(query.toLowerCase());
        });
    
        if (!hasMatches) {
          showQuestionWarning(
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
    
      dayInput.addEventListener("input", () => {
        const value = Number(dayInput.value);
    
        if (value > availableQuestions.length) {
          dayInput.value = String(availableQuestions.length);
        }
    
        if (value < 1 && dayInput.value !== "") {
          dayInput.value = "1";
        }
      });
    
      dayOpenBtn.addEventListener("click", () => {
        const dayNumber = Number(dayInput.value);
        const found = availableQuestions.find(({ question }) => Number(question.day) === dayNumber);
    
        if (found) {
          openQuestionByIndex(found.index);
          return;
        }
    
        showQuestionWarning(dayNotAvailable);
      });
    
      dayInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          dayOpenBtn.click();
        }
      });
    
      renderResults();
    }

    renderCard(currentIndex);

  } catch (e) {
    root.innerHTML = "Error loading question";
    console.error(e);
  }
};

function addQuestionCreationHelp(text, lang, verseRef = null) {
  if (!text) return "";

  let safeText = escapeHtml(text);

  if (lang === "ru") {
    const creationHelpHtml = `
      <button class="footer-help-btn question-creation-help-btn" type="button" aria-expanded="false" aria-label="Подробнее о слове «тварь»">i</button><span class="footer-help-inline question-creation-help-inline" hidden>
        <span class="footer-help-box daily-help-box">
          <button class="footer-help-close question-creation-help-close" type="button" aria-label="Закрыть">×</button>
          В Синодальном переводе слово «тварь» означает «творение».
        </span>
      </span>
    `;

    safeText = safeText.replace(
      /(тварь|твари|тварью|тварей|тварею|творение)/i,
      `$1${creationHelpHtml}`
    );

    const blessedHelpHtml = `
    <button class="footer-help-btn question-creation-help-btn" type="button" aria-expanded="false" aria-label="Подробнее о слове «блажен»">i</button><span class="footer-help-inline question-creation-help-inline" hidden>
      <span class="footer-help-box daily-help-box">
        <button class="footer-help-close question-creation-help-close" type="button" aria-label="Закрыть">×</button>
        В Синодальном переводе слово «блажен» означает «счастлив» или «благословен Богом». Речь идёт о глубоком счастье, которое приходит от жизни с Богом.
      </span>
    </span>
  `;

  safeText = safeText.replace(
    /(Блаженны|Блажен|блаженны|блажен)/,
    `$1${blessedHelpHtml}`
  );

    const pronounHelpHtml = `
      <button class="footer-help-btn question-creation-help-btn" type="button" aria-expanded="false" aria-label="Подробнее о местоимениях с большой буквы">i</button><span class="footer-help-inline question-creation-help-inline" hidden>
        <span class="footer-help-box daily-help-box">
          <button class="footer-help-close question-creation-help-close" type="button" aria-label="Закрыть">×</button>
          В Синодальном переводе некоторые местоимения пишутся с большой буквы при обращении к Богу или упоминании о Нём.
        </span>
      </span>
    `;

    safeText = safeText.replace(
      /(^|[^А-Яа-яЁё])(Ты|Твой|Твоя|Твоё|Твои|Тебя|Тебе|Тобой)(?=$|[^А-Яа-яЁё])/,
      `$1$2${pronounHelpHtml}`
    );
    const firmamentHelpHtml = `
      <button class="footer-help-btn question-creation-help-btn" type="button" aria-expanded="false" aria-label="Подробнее о слове «твердь»">i</button><span class="footer-help-inline question-creation-help-inline" hidden>
        <span class="footer-help-box daily-help-box">
          <button class="footer-help-close question-creation-help-close" type="button" aria-label="Закрыть">×</button>
          Твердь — небесный простор, видимое небо над землёй.
        </span>
      </span>
    `;

    safeText = safeText.replace(
      /(^|[^А-Яа-яЁё])(твердь)(?=$|[^А-Яа-яЁё])/i,
      `$1$2${firmamentHelpHtml}`
    );

    const tukHelpHtml = `
    <button class="footer-help-btn question-creation-help-btn" type="button" aria-expanded="false" aria-label="Подробнее о слове «тук»">i</button><span class="footer-help-inline question-creation-help-inline" hidden>
      <span class="footer-help-box daily-help-box">
        <button class="footer-help-close question-creation-help-close" type="button" aria-label="Закрыть">×</button>
        Изобилие и полное удовлетворение от Божьих благословений.
      </span>
    </span>
  `;

  safeText = safeText.replace(
    /(^|[^А-Яа-яЁё])(туком|тук)(?=$|[^А-Яа-яЁё])/i,
    `$1$2${tukHelpHtml}`
  );


  }

  if (lang === "en" && isOldTestamentBook(verseRef)) {
    const lordHelpHtml = `
      <button class="footer-help-btn question-creation-help-btn" type="button" aria-expanded="false" aria-label="More about Lord">i</button><span class="footer-help-inline question-creation-help-inline" hidden>
        <span class="footer-help-box daily-help-box">
          <button class="footer-help-close question-creation-help-close" type="button" aria-label="Close">×</button>
          In the Old Testament, “Lord” often represents God’s personal name, Yahweh.
        </span>
      </span>
    `;

    safeText = safeText.replace(
      /\blord\b/gi,
      (match) => `${match}${lordHelpHtml}`
    );
  }

  return safeText;
}

function getTomorrowPreview(text = "", words = 4) {
  const clean = String(text).replace(/\s+/g, " ").trim();

  if (!clean) return "";

  const parts = clean.split(" ");

  if (parts.length <= words) {
    return clean;
  }

  return parts.slice(0, words).join(" ") + "...";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}