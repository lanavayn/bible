function getIndexLang() {
    return document.documentElement.lang?.startsWith("ru") ? "ru" : "en";
  }
  
  function getBasePath(lang) {
    return lang === "ru" ? "/ru/" : "/";
  }
  
  function getIndexPageContent(lang) {
    const base = getBasePath(lang);
  
    return {
      en: {
        heroTitle: "Explore the Holy Scriptures",
        topicsLabel: "Choose a topic to explore:",
        toggleAllText: "Show All",
        categories: {
          salvation: "✝️ Salvation and Faith",
          law: "📜 God's Law",
          prayer: "🙏 Prayer",
          golden: "🌟 Golden Verses",
          slider: "📖 Bible Verses — Slider",
          timeline: "📚 Bible Timeline"
        },
        links: {
          purpose: {
            href: `${base}purpose.html`,
            text: "🎯 What is the meaning of life according to the Bible?"
          },
          salvation: {
            href: `${base}salvation.html`,
            text: "⚖️ Is salvation by the works of the law or by grace?"
          },
          commandments: {
            href: `${base}10-commandments.html`,
            text: "📜 What do the Ten Commandments say?"
          },
          sabbath: {
            href: `${base}sabbath.html`,
            text: "✨ Should we keep the Sabbath in the New Testament?"
          },
          prayer: {
            href: `${base}prayfrombible.html`,
            text: "🕊 What does the Lord’s Prayer teach?"
          },
          golden: {
            href: `${base}golden-verses.html`,
            text: "⭐ Golden Verses — about God's love, salvation, and life with Him"
          }
        }
      },
  
      ru: {
        heroTitle: "Исследуйте Священное Писание",
        topicsLabel: "Выберите тему, чтобы узнать больше:",
        toggleAllText: "Показать всё",
        categories: {
          salvation: "✝️ Спасение и вера",
          law: "📜 Закон Божий",
          prayer: "🙏 Молитва",
          golden: "🌟 Золотые стихи",
          slider: "📖 Стихи из Библии — слайдер",
          timeline: "📚 Хронология Библии"
        },
        links: {
          purpose: {
            href: `${base}purpose.html`,
            text: "🎯 В чём смысл жизни по Библии?"
          },
          salvation: {
            href: `${base}salvation.html`,
            text: "⚖️ Спасение — по делам закона или по благодати?"
          },
          commandments: {
            href: `${base}10-commandments.html`,
            text: "📜 Что говорят 10 заповедей?"
          },
          sabbath: {
            href: `${base}sabbath.html`,
            text: "✨ Нужно ли соблюдать субботу в Новом Завете?"
          },
          prayer: {
            href: `${base}prayfrombible.html`,
            text: "🕊 Чему учит молитва «Отче наш»?"
          },
          golden: {
            href: `${base}golden-verses.html`,
            text: "⭐ Золотые стихи — о любви, спасении и вере"
          }
        }
      }
    }[lang];
  }
  
  function renderIndexPage() {
    const root = document.getElementById("index-page");
    if (!root) return;
  
    const lang = getIndexLang();
    const t = getIndexPageContent(lang);
  
    root.innerHTML = `
      <h1 class="hero-title">${t.heroTitle}</h1>
  
      <section id="daily-verse-block">
        <button id="loadDailyVerseBtn" class="dv-reopen-btn" type="button">
          ${lang === "ru" ? "📖 Стих дня" : "📖 Daily Verse"}
        </button>
        <div id="daily-verse"></div>
      </section>

      <section id="question-of-day-block">
        <button id="loadQuestionBtn" class="dv-reopen-btn" type="button">
          ${lang === "ru" ? "💬 Вопрос дня" : "💬 Question of the Day"}
        </button>
        <div id="question-of-day"></div>
      </section>
  
      <div class="topics-toolbar">
        <p class="topics-label">${t.topicsLabel}</p>
        <button id="toggleAllCategoriesBtn" class="toggle-all-inline">
          ${t.toggleAllText}<span class="toggle-icon">▾</span>
        </button>
      </div>

    <div class="categories-list">
      <div class="category" data-category="salvation">
        <div class="category-header" onclick="toggleCategory(this)">
          <span>${t.categories.salvation}</span>
          <span class="toggle-arrow">▶</span>
        </div>
        <ul class="topic-list">
          <li>
            <a class="button-link" href="${t.links.purpose.href}" onclick="rememberCategory('salvation')">
              ${t.links.purpose.text}
            </a>
          </li>
          <li>
            <a class="button-link" href="${t.links.salvation.href}" onclick="rememberCategory('salvation')">
              ${t.links.salvation.text}
            </a>
          </li>
        </ul>
      </div>
  
      <div class="category" data-category="law">
        <div class="category-header" onclick="toggleCategory(this)">
          <span>${t.categories.law}</span>
          <span class="toggle-arrow">▶</span>
        </div>
        <ul class="topic-list">
          <li>
            <a class="button-link" href="${t.links.commandments.href}" onclick="rememberCategory('law')">
              ${t.links.commandments.text}
            </a>
          </li>
          <li>
            <a class="button-link" href="${t.links.sabbath.href}" onclick="rememberCategory('law')">
              ${t.links.sabbath.text}
            </a>
          </li>
        </ul>
      </div>
  
      <div class="category" data-category="prayer">
        <div class="category-header" onclick="toggleCategory(this)">
          <span>${t.categories.prayer}</span>
          <span class="toggle-arrow">▶</span>
        </div>
        <ul class="topic-list">
          <li>
            <a class="button-link" href="${t.links.prayer.href}" onclick="rememberCategory('prayer')">
              ${t.links.prayer.text}
            </a>
          </li>
        </ul>
      </div>
  
      <div class="category" data-category="golden">
        <div class="category-header" onclick="toggleCategory(this)">
          <span>${t.categories.golden}</span>
          <span class="toggle-arrow">▶</span>
        </div>
        <ul class="topic-list">
          <li>
            <a class="button-link" href="${t.links.golden.href}" onclick="rememberCategory('golden')">
              ${t.links.golden.text}
            </a>
          </li>
        </ul>
      </div>
  
      <div class="category" data-category="verse-slider-block">
        <div class="category-header" onclick="toggleVerseSliderCategory(this)">
          <span>${t.categories.slider}</span>
          <span class="toggle-arrow">▶</span>
        </div>
        <ul class="topic-list">
          <li><section id="verse-slider" data-use-global-lang="true"></section></li>
        </ul>
      </div>
  
      <div class="category" data-category="book-dates-block">
        <div class="category-header" onclick="toggleBookDatesCategory(this)">
          <span>${t.categories.timeline}</span>
          <span class="toggle-arrow">▶</span>
        </div>
        <ul class="topic-list">
          <li><section id="book-dates"></section></li>
        </ul>
      </div>
    </div> <!-- categories-list --> 
    `;
  
    if (typeof initVerseSlider === "function") {
      initVerseSlider();
    }
  
    if (typeof initBookDates === "function") {
      initBookDates();
    }

    const loadDailyVerseBtn = document.getElementById("loadDailyVerseBtn");

    if (loadDailyVerseBtn) {
      loadDailyVerseBtn.addEventListener("click", async () => {
        loadDailyVerseBtn.textContent =
          lang === "ru" ? "Загрузка..." : "Loading...";

          try {
            await import("/js/daily-verse.js");
          
            document.getElementById("question-of-day").innerHTML = "";
          
            if (typeof window.renderDailyVerse === "function") {
              await window.renderDailyVerse();
            }
          
            loadDailyVerseBtn.textContent =
              lang === "ru" ? "📖 Стих дня" : "📖 Daily Verse";
          
          } catch (error) {
            console.error("Daily verse lazy load error:", error);
            loadDailyVerseBtn.textContent =
              lang === "ru" ? "Стих не загрузился" : "Verse failed to load";
          }
      });
    }

    const loadQuestionBtn = document.getElementById("loadQuestionBtn");

    if (loadQuestionBtn) {
      loadQuestionBtn.addEventListener("click", async () => {
        loadQuestionBtn.textContent =
          lang === "ru" ? "Загрузка..." : "Loading...";

          try {
            await import("/js/question-of-day.js");
          
            document.getElementById("daily-verse").innerHTML = "";
          
            if (typeof window.renderQuestionOfDay === "function") {
              await window.renderQuestionOfDay();
            }
          
            loadQuestionBtn.textContent =
              lang === "ru" ? "💬 Вопрос дня" : "💬 Question of the Day";
          
          } catch (error) {
            console.error(error);
            loadQuestionBtn.textContent =
              lang === "ru" ? "Ошибка" : "Error";
          }
      });
    }
  }
  
  document.addEventListener("DOMContentLoaded", renderIndexPage);