document.addEventListener("DOMContentLoaded", function () {
    const pageMapToEnglish = {
        "10-commandments.html": "10-commandments-en.html",
        "purpose.html": "purpose-en.html",
        "golden-verses.html": "golden-verses-en.html",
        "prayfrombible.html": "prayfrombible-en.html",
        "about.html": "about-en.html",
        "index.html": "index-en.html"
    };

    let currentPage = decodeURIComponent(window.location.pathname.split("/").pop().split("?")[0]);

    if (!currentPage || currentPage === '') {
    currentPage = 'index.html';
    } else if (!currentPage.endsWith('.html')) {
    currentPage += '.html';
    }
    const englishVersion = pageMapToEnglish[currentPage] || null;

    console.log("📄 Все страницы (pageMapToEnglish):", pageMapToEnglish);
    console.log("Current Page:", currentPage);
    console.log("English version:", englishVersion);

    document.getElementById("header").innerHTML = `
        <div class="top-bar">
        <div class="top-left dropdown">
            <button class="dropbtn">☰ Выбрать</button>
            <div class="dropdown-content">
            ${currentPage === 'about.html'
                ? `<a href="javascript:history.back()">← Назад</a>`
                : (currentPage !== 'index.html' ? `<a href="index.html">🏠 Домой</a>` : '')}
            <a href="comments.html">✍️ Отзыв</a>
            <a href="#" class="share-button" title="Поделиться">📤 Ссылка</a>
            ${currentPage !== 'about.html' ? `<a href="about.html">ℹ️ О нас</a>` : ''}
            </div>
        </div>
        <div class="top-right dropdown">
            <button class="dropbtn">🌐 Lang</button>
            <div class="dropdown-content">
            ${englishVersion ? `<a href="${englishVersion}">Eng</a>` : `<span style="opacity: 0.5;">Eng</span>`}
            <a href="${currentPage}">Рус</a>
            </div>
        </div>
        </div>
    `;
});
