document.addEventListener("DOMContentLoaded", () => {
    const isRu = document.documentElement.lang?.toLowerCase().startsWith("ru");
  
    const footerText = {
      en: {
        intro: `
          <div class="footer-intro">
            <p>Let Scripture explain Scripture.</p>
          </div>
        `,
        sourcesTitle: "Sources:",
        bibleLinkLabel: "🔹 Bible texts:",
        bibleLinkHref: "https://www.bible.com/bible/206/GEN.1.WEBUS",
        bibleLinkText: "Bible.com",
        bibleLinkTail: "— Bible texts and translations.",
        line2: ``,
      line3: `
        <span>
          🔹 The Bible consists of 66 books — <button class="footer-timeline-link" type="button" data-testament="old">39 in the Old Testament</button> and <button class="footer-timeline-link" type="button" data-testament="new">27 in the New Testament</button>.
        </span>
      `,
        copyright: "© 2025 Bible for All. All rights reserved."
      },
      ru: {
        intro: `
          <div class="footer-intro">
            <p>Пусть Писание объясняет Писание.</p>
          </div>
        `,
        sourcesTitle: "Источники:",
        bibleLinkLabel: "🔹",
        bibleLinkHref: "https://www.bible.com/ru/bible/400/GEN.1.SYNO",
        bibleLinkText: "Bible.com",
        bibleLinkTail: "— тексты Библии и переводы.",
        line2: `
        <div class="footer-help-row">
        <span>
          🔹 Русские тексты Библии используются в Синодальном <button class="footer-help-btn" type="button" aria-expanded="false" aria-label="Подробнее о Синодальном переводе">i</button> переводe Библии (66 книг: <button class="footer-timeline-link" type="button" data-testament="old">39 Ветхого Завета</button> и <button class="footer-timeline-link" type="button" data-testament="new">27 Нового Завета</button>).
        </span>      

        <div class="footer-help-inline" hidden>
          <div class="footer-help-box">
            <button class="footer-help-close" type="button" aria-label="Закрыть">×</button>
            Синодальный перевод — это русский перевод Библии, завершённый в XIX веке. Он остаётся одним из самых распространённых переводов среди русскоязычных христиан.
          </div>
        </div>
      </div>
      `,
        copyright: "© 2025 Bible for All. Все права защищены."
      }
    };
  
    const t = isRu ? footerText.ru : footerText.en;
    const footer = document.getElementById("footer");
    if (!footer) return;
  
    footer.innerHTML = `
    <footer class="footer" role="contentinfo">
  
      ${t.intro}
  
      <div class="source-note">
        <p><strong>${t.sourcesTitle}</strong></p>
        <p class="bible-link-note">
          ${t.bibleLinkLabel}
          <a href="${t.bibleLinkHref}" target="_blank" rel="noopener noreferrer">${t.bibleLinkText}</a>
          ${t.bibleLinkTail}
        </p>
        ${t.line2 || ""}
        ${t.line3 || ""}
      </div>
  
      <p>${t.copyright}</p>
    </footer>
  `;
  const helpBtn = footer.querySelector(".footer-help-btn");
const helpInline = footer.querySelector(".footer-help-inline");
const helpClose = footer.querySelector(".footer-help-close");

if (helpBtn && helpInline) {
  helpBtn.addEventListener("click", () => {
    const timelineBox = footer.querySelector(".footer-timeline-box");
    if (timelineBox) timelineBox.hidden = true;

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

const timelineButtons = footer.querySelectorAll(".footer-timeline-link");

timelineButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (helpInline) {
      helpInline.setAttribute("hidden", "");
    }
    
    if (helpBtn) {
      helpBtn.setAttribute("aria-expanded", "false");
    }
    
    const mainTimelineCategory = document.querySelector(
      '.category[data-category="book-dates-block"]'
    );
    
    if (mainTimelineCategory) {
      mainTimelineCategory.classList.remove("open");
    
      const list = mainTimelineCategory.querySelector(".topic-list");
    
      if (list) {
        list.style.maxHeight = null;
      }
    }

    let box = footer.querySelector(".footer-timeline-box");

    if (!box) {
      footer.insertAdjacentHTML("beforeend", `
        <div class="footer-timeline-box">
          <button class="footer-timeline-close" type="button" aria-label="Close">×</button>
          <div id="footer-book-dates"></div>
        </div>
      `);

      box = footer.querySelector(".footer-timeline-box");

      if (window.initBookDates) {
        await window.initBookDates("#footer-book-dates");
      }
    }

    box.hidden = false;

    const testament = btn.dataset.testament;
    const oldSection = box.querySelector("#old-testament");
    const newSection = box.querySelector("#new-testament");

    if (oldSection && newSection) {
      oldSection.open = false;
      newSection.open = false;
    
      if (testament === "old") {
        oldSection.open = true;
      }
    
      if (testament === "new") {
        newSection.open = true;
      }
    }

    //box.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

footer.addEventListener("click", (e) => {
  if (e.target.classList.contains("footer-timeline-close")) {
    const box = footer.querySelector(".footer-timeline-box");
    if (box) box.hidden = true;
  }
});

  });