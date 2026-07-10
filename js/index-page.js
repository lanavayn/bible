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

  function closeDailyAndQuestion() {
    const daily = document.getElementById("daily-verse");
    const question = document.getElementById("question-of-day");
  
    if (daily) daily.innerHTML = "";
    if (question) question.innerHTML = "";
  
    document.querySelectorAll(".dv-reopen-btn").forEach(btn => {
      btn.classList.remove("is-active", "is-muted");
    });
  }
  
  function closeAllTopicCards() {
    document.querySelectorAll(".category.open").forEach(category => {
      category.classList.remove("open");
  
      const list = category.querySelector(".topic-list");
      if (list) {
        list.style.maxHeight = null;
      }
    });
  }
  
  function handleCategoryClick(button) {
    closeDailyAndQuestion();
    toggleCategory(button);
  }
  
  function handleBookDatesClick(button) {
    closeDailyAndQuestion();
  
    const footerTimelineBox = document.querySelector(".footer-timeline-box");
    if (footerTimelineBox) {
      footerTimelineBox.hidden = true;
    }
  
    const footerHelpInline = document.querySelector(".footer-help-inline");
    if (footerHelpInline) {
      footerHelpInline.setAttribute("hidden", "");
    }
  
    const footerHelpBtn = document.querySelector(".footer-help-btn");
    if (footerHelpBtn) {
      footerHelpBtn.setAttribute("aria-expanded", "false");
    }
  
    toggleBookDatesCategory(button);

    const category = button.closest('.category[data-category="book-dates-block"]');
    if (category?.classList.contains("open")) {
      setTimeout(() => {
        const timeline = category.querySelector("#book-dates") || category;
        timeline.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }
  
  function renderIndexPage() {
    sessionStorage.removeItem("openCategory");

    const root = document.getElementById("index-page");
    if (!root) return;
  
    const lang = getIndexLang();
    const t = getIndexPageContent(lang);
  
    root.innerHTML = `
      <h1 class="hero-title">${t.heroTitle}</h1>
      <div class="daily-question-row">
        <button id="loadDailyVerseBtn" class="dv-reopen-btn" type="button">
          ${lang === "ru" ? "📖 Стих дня" : "📖 Daily Verse"}
        </button>

        <button id="loadQuestionBtn" class="dv-reopen-btn" type="button">
          ${lang === "ru" ? "💬 Вопрос дня" : "💬 Daily Question"}
        </button>
      </div>

      <section id="daily-verse-block">
        <div id="daily-verse"></div>
      </section>

      <section id="question-of-day-block">
        <div id="question-of-day"></div>
      </section>

      <div class="topics-toolbar topic-toolbar-hidden">
        <p class="topics-label">${t.topicsLabel}</p>
        <button id="toggleAllCategoriesBtn" class="toggle-all-inline" type="button">
          ${t.toggleAllText}<span class="toggle-icon">▾</span>
        </button>
      </div>

      <div class="categories-list topic-tags-list">

        <div class="category topic-tag-category" data-category="salvation">
          <button class="category-header topic-tag" onclick="handleCategoryClick(this)" type="button">
            <span>${t.categories.salvation}</span>
            <span class="toggle-arrow">▾</span>
          </button>
          <ul class="topic-list topic-card">
            <li class="topic-card-close-row">
              <button class="topic-card-close" type="button" onclick="closeTopicCard(this)" aria-label="${lang === "ru" ? "Закрыть" : "Close"}">×</button>
            </li>
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

        <div class="category topic-tag-category" data-category="law">
          <button class="category-header topic-tag" onclick="handleCategoryClick(this)" type="button">
            <span>${t.categories.law}</span>
            <span class="toggle-arrow">▾</span>
          </button>
          <ul class="topic-list topic-card">
            <li class="topic-card-close-row">
              <button class="topic-card-close" type="button" onclick="closeTopicCard(this)" aria-label="${lang === "ru" ? "Закрыть" : "Close"}">×</button>
            </li> 
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

        <div class="category topic-tag-category" data-category="prayer">
          <button class="category-header topic-tag" onclick="handleCategoryClick(this)" type="button">
            <span>${t.categories.prayer}</span>
            <span class="toggle-arrow">▾</span>
          </button>
          <ul class="topic-list topic-card">
            <li class="topic-card-close-row">
              <button class="topic-card-close" type="button" onclick="closeTopicCard(this)" aria-label="${lang === "ru" ? "Закрыть" : "Close"}">×</button>
            </li>
            <li>
              <a class="button-link" href="${t.links.prayer.href}" onclick="rememberCategory('prayer')">
                ${t.links.prayer.text}
              </a>
            </li>
          </ul>
        </div>

        <div class="category topic-tag-category" data-category="golden">
          <button class="category-header topic-tag" onclick="handleCategoryClick(this)" type="button">
            <span>${t.categories.golden}</span>
            <span class="toggle-arrow">▾</span>
          </button>
          <ul class="topic-list topic-card">
            <li class="topic-card-close-row">
              <button class="topic-card-close" type="button" onclick="closeTopicCard(this)" aria-label="${lang === "ru" ? "Закрыть" : "Close"}">×</button>
            </li>
            <li>
              <a class="button-link" href="${t.links.golden.href}" onclick="rememberCategory('golden')">
                ${t.links.golden.text}
              </a>
            </li>
          </ul>
        </div>
        <div class="category topic-tag-category" data-category="book-dates-block">
          <button class="category-header topic-tag" onclick="handleBookDatesClick(this)" type="button">
          <span>${t.categories.timeline}</span>
          <span class="toggle-arrow">▾</span>
        </button>
        <ul class="topic-list topic-card">
          <li class="topic-card-close-row">
                  <button class="topic-card-close" type="button" onclick="closeTopicCard(this)" aria-label="${lang === "ru" ? "Закрыть" : "Close"}">×</button>
          </li>
          <li><section id="book-dates"></section></li>
        </ul>
      </div>  
    </div> 
    `;
  
    if (typeof initVerseSlider === "function") {
      initVerseSlider();
    }
  
    if (typeof initBookDates === "function") {
      initBookDates();
    }

    const loadDailyVerseBtn = document.getElementById("loadDailyVerseBtn");
    const loadQuestionBtn = document.getElementById("loadQuestionBtn");

    async function openDailyVerse() {
      if (!loadDailyVerseBtn) return;
        loadDailyVerseBtn.textContent =
          lang === "ru" ? "Загрузка..." : "Loading...";

          try {
            closeAllTopicCards();
            await import("/js/daily-verse.js");
          
            document.getElementById("question-of-day").innerHTML = "";
          
            if (typeof window.renderDailyVerse === "function") {
              await window.renderDailyVerse();
              loadDailyVerseBtn.classList.add("is-active");
              loadDailyVerseBtn.classList.remove("is-muted");

              if (loadQuestionBtn) {
                loadQuestionBtn.classList.remove("is-active");
                loadQuestionBtn.classList.add("is-muted");
              }
            }
          
            loadDailyVerseBtn.textContent =
              lang === "ru" ? "📖 Стих дня" : "📖 Daily Verse";
          
          } catch (error) {
            console.error("Daily verse lazy load error:", error);
            loadDailyVerseBtn.textContent =
              lang === "ru" ? "Стих не загрузился" : "Verse failed to load";
          }
    }

    if (loadDailyVerseBtn) {
      loadDailyVerseBtn.addEventListener("click", openDailyVerse);
    }

    async function openDailyQuestion() {
      if (!loadQuestionBtn) return;
      loadQuestionBtn.textContent =
        lang === "ru" ? "Загрузка..." : "Loading...";

        try {
          closeAllTopicCards();
          await import("/js/question-of-day.js");
        
          document.getElementById("daily-verse").innerHTML = "";
        
          if (typeof window.renderQuestionOfDay === "function") {
            await window.renderQuestionOfDay();
            loadQuestionBtn.classList.add("is-active");
            loadQuestionBtn.classList.remove("is-muted");

            if (loadDailyVerseBtn) {
              loadDailyVerseBtn.classList.remove("is-active");
              loadDailyVerseBtn.classList.add("is-muted");
            }
          }
        
          loadQuestionBtn.textContent =
            lang === "ru" ? "💬Вопрос дня" : "💬Daily Question";
        
        } catch (error) {
          console.error(error);
          loadQuestionBtn.textContent =
            lang === "ru" ? "Ошибка" : "Error";
        }
    }

    if (loadQuestionBtn) {
      loadQuestionBtn.addEventListener("click", openDailyQuestion);
    }

    const requestedDailyVerseDay = Number(new URLSearchParams(window.location.search).get("day"));
    if (loadDailyVerseBtn && Number.isInteger(requestedDailyVerseDay) && requestedDailyVerseDay > 0) {
      openDailyVerse();
    }

    const requestedDailyQuestion = Number(new URLSearchParams(window.location.search).get("question"));
    if (
      loadQuestionBtn &&
      (!Number.isInteger(requestedDailyVerseDay) || requestedDailyVerseDay <= 0) &&
      Number.isInteger(requestedDailyQuestion) &&
      requestedDailyQuestion > 0
    ) {
      openDailyQuestion();
    }
  }

  function closeTopicCard(button) {
    const category = button.closest(".category");
    if (!category) return;
  
    category.classList.remove("open");
  
    const list = category.querySelector(".topic-list");
    if (list) {
      list.style.maxHeight = null;
    }
  }
  
  document.addEventListener("DOMContentLoaded", renderIndexPage);
