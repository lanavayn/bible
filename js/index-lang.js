const indexLang = {
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
        purpose: "🎯 What is the meaning of life according to the Bible?",
        salvation: "⚖️ Is salvation by the works of the law or by grace?",
        commandments: "📜 What do the Ten Commandments say?",
        sabbath: "✨ Should we keep the Sabbath in the New Testament?",
        prayer: "🕊 What does the Lord’s Prayer teach?",
        golden: "⭐ Golden Verses — about God's love, salvation, and life with Him"
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
        purpose: "🎯 В чём смысл жизни по Библии?",
        salvation: "⚖️ Спасение — по делам закона или по благодати?",
        commandments: "📜 Что говорят 10 заповедей?",
        sabbath: "✨ Нужно ли соблюдать субботу в Новом Завете?",
        prayer: "🕊 Чему учит молитва «Отче наш»?",
        golden: "⭐ Золотые стихи — о любви, спасении и вере"
      }
    }
  };
  
  function getLang() {
    return document.documentElement.lang?.startsWith("ru") ? "ru" : "en";
  }
  
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  
  function applyIndexLang() {
    const lang = getLang();
    const t = indexLang[lang];
  
    setText("heroTitle", t.heroTitle);
    setText("topicsLabel", t.topicsLabel);
    setText("toggleAllText", t.toggleAllText);
  
    setText("cat-salvation", t.categories.salvation);
    setText("cat-law", t.categories.law);
    setText("cat-prayer", t.categories.prayer);
    setText("cat-golden", t.categories.golden);
    setText("cat-slider", t.categories.slider);
    setText("cat-timeline", t.categories.timeline);
  
    setText("link-purpose", t.links.purpose);
    setText("link-salvation", t.links.salvation);
    setText("link-commandments", t.links.commandments);
    setText("link-sabbath", t.links.sabbath);
    setText("link-prayer", t.links.prayer);
    setText("link-golden", t.links.golden);
  }
  
  document.addEventListener("DOMContentLoaded", applyIndexLang);