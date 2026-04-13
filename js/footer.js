document.addEventListener("DOMContentLoaded", () => {
    const isRu = document.documentElement.lang?.toLowerCase().startsWith("ru");
  
    const footerText = {
      en: {
        sourcesTitle: "📚 Sources:",
        bibleLinkLabel: "🔹 Bible text references:",
        bibleLinkHref: "https://www.esv.org/",
        bibleLinkText: "ESV.org",
        bibleLinkTail: "— English Standard Version (ESV), Crossway.",
        line2: "🔹 All texts are presented according to the Synodal translation of the Bible.",
        line3: "🔹 The website features biblical texts and topics for reflection, so that everyone can personally turn to the Word of God.",
        copyright: "© 2025 Bible for All. All rights reserved."
      },
      ru: {
        sourcesTitle: "📚 Источники:",
        bibleLinkLabel: "🔹 Ссылки на тексты Библии:",
        bibleLinkHref: "https://bible.by/syn",
        bibleLinkText: "bible.by/syn",
        bibleLinkTail: "— Синодальный перевод Библии, 1876 г.",
        line2: "🔹 Все тексты приведены по Синодальному переводу Библии.",
        line3: "🔹 На сайте представлены библейские тексты и темы для размышления, чтобы каждый мог самостоятельно обратиться к Слову Божьему.",
        copyright: "© 2025 Bible for All. Все права защищены."
      }
    };
  
    const t = isRu ? footerText.ru : footerText.en;
    const footer = document.getElementById("footer");
    if (!footer) return;
  
    footer.innerHTML = `
      <footer class="footer" role="contentinfo">
        <div class="source-note">
          <p><strong>${t.sourcesTitle}</strong></p>
          <p class="bible-link-note">
            ${t.bibleLinkLabel}
            <a href="${t.bibleLinkHref}" target="_blank" rel="noopener noreferrer">${t.bibleLinkText}</a>
            ${t.bibleLinkTail}
          </p>
          <p>${t.line2}</p>
          <p>${t.line3}</p>
        </div>
        <p>${t.copyright}</p>
      </footer>
    `;
  });