document.addEventListener("DOMContentLoaded", function () {
    const translations = {
      en: {
        title: "Welcome to the Bible for All",
        back: "← Back",
        home: "🏠 Home",
        share: "📤 Share link",
        comments: "✍️ Leave feedback",
        about: "ℹ️ About the Bible",
        english: "English",
        russian: "Русский"
      },
      ru: {
        title: "Добро пожаловать в мир Библии",
        back: "← Назад",
        home: "🏠 Домой",
        share: "📤 Поделиться",
        comments: "✍️ Оставить отзыв",
        about: "ℹ️ О Библии",
        english: "English",
        russian: "Русский"
      }
    };
  
    const pageMap = {
      "10-commandments.html": "10-commandments.html",
      "purpose.html": "purpose.html",
      "golden-verses.html": "golden-verses.html",
      "prayfrombible.html": "prayfrombible.html",
      "about.html": "about.html",
      "index.html": "index.html",
      "salvation.html": "salvation.html",
      "comments.html": "comments.html",
      "sabbath.html": "sabbath.html"
    };
  
    let currentPage = decodeURIComponent(window.location.pathname.split("/").pop().split("?")[0]);
    currentPage = currentPage.toLowerCase();
  
    if (!currentPage || currentPage === "") {
      currentPage = "index.html";
    } else if (!currentPage.endsWith(".html")) {
      currentPage += ".html";
    }
  
    const isRu = document.documentElement.lang?.toLowerCase().startsWith("ru");
    const lang = isRu ? "ru" : "en";
    const t = translations[lang];
  
    const pairedPage = pageMap[currentPage] || "index.html";
  
    const homeHref = isRu ? "index.html" : "index.html";
    const aboutHref = isRu ? "about.html" : "about.html";
    const commentsHref = isRu ? "comments.html" : "comments.html";
  
    const enHref = lang === "en"
      ? currentPage
      : `/${pairedPage}`;
  
    const ruHref = lang === "ru"
      ? currentPage
      : (pairedPage === "index.html" ? "/ru/" : `/ru/${pairedPage}`);
  
    const showBack = currentPage === "about.html" || currentPage === "comments.html";
    const showHome = currentPage !== "index.html";
    const showComments = currentPage !== "comments.html";
    const showAbout = currentPage !== "about.html";
  
    const headerElement = document.getElementById("header");
    if (!headerElement) return;
  
    headerElement.innerHTML = `
      <div class="top-bar">
        <div class="top-left dropdown">
          <button class="dropbtn">☰</button>
          <div class="dropdown-content">
          ${showBack ? `<a href="#" id="menuBack">${t.back}</a>` : ""}
            ${showHome ? `<a href="${homeHref}">${t.home}</a>` : ""}
            <a href="#" class="share-button" title="${t.share}">${t.share}</a>
            ${showComments ? `<a href="${commentsHref}">${t.comments}</a>` : ""}
            ${showAbout ? `<a href="${aboutHref}">${t.about}</a>` : ""}
          </div>
        </div>
  
        <div class="top-title">${t.title}</div>
  
        <div class="top-right dropdown">
          <button class="dropbtn">🌐</button>
          <div class="dropdown-content lang-dropdown">
            <a href="${enHref}" id="langEn">${t.english}</a>
            <a href="${ruHref}" id="langRu">${t.russian}</a>
          </div>
        </div>
      </div>
    `;

    window.addEventListener("pageshow", function () {
      document.querySelectorAll(".dropdown").forEach(dropdown => {
        dropdown.classList.remove("is-open");
      });
    
      document.querySelectorAll(".dropbtn").forEach(btn => {
        btn.blur();
      });
    
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    });
    
    const backBtn = document.getElementById("menuBack");
    if (backBtn) {
      backBtn.addEventListener("click", function (e) {
        e.preventDefault();
    
        document.querySelectorAll(".dropdown").forEach(dropdown => {
          dropdown.classList.remove("is-open");
        });
    
        document.querySelectorAll(".dropbtn").forEach(btn => {
          btn.blur();
        });
    
        backBtn.blur();
    
        const referrer = document.referrer;
        const sameSite = referrer && new URL(referrer).origin === window.location.origin;
    
        if (sameSite) {
          history.back();
        } else {
          window.location.href = homeHref;
        }
      });
    }
    
    const langEn = document.getElementById("langEn");
    const langRu = document.getElementById("langRu");
    
    if (langEn) {
      langEn.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.replace(enHref);
      });
    }
    
    if (langRu) {
      langRu.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.replace(ruHref);
      });
    }


  });