document.addEventListener("DOMContentLoaded", () => {
    const isRu = document.documentElement.lang?.toLowerCase().startsWith("ru");
  
    const footerText = {
      en: {
        intro: `
          <div class="footer-intro">
            <p>✨ Verses. Short reflections. Meaning.</p>
            <p>❖ No pressure. No imposed teachings.</p>
            <p>▸ Simply the Word of God — for everyone seeking truth.</p>
          </div>
        `,
        sourcesTitle: "📚 Sources:",
        bibleLinkLabel: "🔹 Bible texts:",
        bibleLinkHref: "https://www.bible.com/bible/206/GEN.1.WEBUS",
        bibleLinkText: "Bible.com",
        bibleLinkTail: "— Bible texts and translations.",
        line2: ``,
      line3: `
        <span>
          🔹 The Bible consists of 66 books — 39 in the Old Testament and 27 in the New Testament.
        </span>
      `,
        copyright: "© 2025 Bible for All. All rights reserved."
      },
      ru: {
        intro: `
          <div class="footer-intro">
            <p>✨ Стихи. Краткие размышления. Смысл.</p>
            <p>❖ Без давления. Без навязывания учений.</p>
            <p>▸ Просто Слово Божие — для каждого, кто ищет истину.</p>
          </div>
        `,
        sourcesTitle: "📚 Источники:",
        bibleLinkLabel: "🔹",
        bibleLinkHref: "https://www.bible.com/ru/bible/400/GEN.1.SYNO",
        bibleLinkText: "Bible.com",
        bibleLinkTail: "— тексты Библии и переводы.",
        line2: `
        <div class="footer-help-row">
        <span>
          🔹 Русские тексты Библии используются в Синодальном <button class="footer-help-btn" type="button" aria-expanded="false" aria-label="Подробнее о Синодальном переводе">i</button> переводe Библии (66 книг: 39 Ветхого Завета и 27 Нового Завета).
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
  });