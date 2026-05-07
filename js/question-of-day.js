import { buildBibleLink } from "./bibleLinks.js";

//
// PROD date Anpril 30 2026
const START_DATE = "2026-04-30";
//test
//const START_DATE = "2026-04-20";

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
    const response = await fetch("/data/questions/question-1-30.json", { cache: "no-store" });
    const data = await response.json();
    const questions = data.questions || [];
    
    //PROD code
    const todayDay = getTodayIndex();
    let currentIndex = questions.findIndex(q => q.day === todayDay);
    if (currentIndex === -1) currentIndex = 0;
    const todayIndex = currentIndex;

    function renderCard(index) {
      const q = questions[index];
      const isToday = index === todayIndex;

      const question = q[`question_${lang}`];
      const text = q[`text_${lang}`];
      const answer = q[`answer_${lang}`];
      const reference = q[`reference_${lang}`];

      const verseRef = q?.verse_ref_lang?.[lang] || q?.verse_ref || null;
      const bibleLink = buildBibleLink(verseRef, lang);

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
          ${addQuestionCreationHelp(text, lang)}
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
                        <span class="scripture-related-text">— ${addQuestionCreationHelp(relText, lang)}</span>
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
      const mottoHelpBtn = root.querySelector(".question-motto-help-btn");
        const mottoHelpInline = root.querySelector(".question-motto-help-inline");
        const mottoHelpClose = root.querySelector(".question-motto-help-close");

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

        root.querySelectorAll(".question-creation-help-btn").forEach(btn => {
          const inline = btn.nextElementSibling;
          if (!inline) return;
        
          btn.addEventListener("click", () => {
            const isOpen = !inline.hasAttribute("hidden");
        
            if (isOpen) {
              inline.setAttribute("hidden", "");
              btn.setAttribute("aria-expanded", "false");
            } else {
              inline.removeAttribute("hidden");
              btn.setAttribute("aria-expanded", "true");
            }
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
          
              const reopenBtn = document.getElementById("question-reopen");
              if (reopenBtn) {
                reopenBtn.textContent = lang === "ru" ? "❓ Вопрос дня" : "❓ Question of the Day";
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

    renderCard(currentIndex);

  } catch (e) {
    root.innerHTML = "Error loading question";
    console.error(e);
  }
};

function addQuestionCreationHelp(text, lang) {
  if (!text || lang !== "ru") return escapeHtml(text);

  const safeText = escapeHtml(text);

  const helpHtml = `
    <button class="footer-help-btn question-creation-help-btn" type="button" aria-expanded="false" aria-label="Подробнее о слове «тварь»">i</button><span class="footer-help-inline question-creation-help-inline" hidden>
      <span class="footer-help-box daily-help-box">
        <button class="footer-help-close question-creation-help-close" type="button" aria-label="Закрыть">×</button>
        В Синодальном переводе слово «тварь» означает «творение».
      </span>
    </span>
  `;

  return safeText.replace(
    /(тварь|твари|тварью|тварей|тварею|творение)/i,
    `$1${helpHtml}`
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}