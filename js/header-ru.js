document.addEventListener("DOMContentLoaded", function () {
    const pageMapToEnglish = {
        "10-commandments.html": "10-commandments.html",
        "purpose.html": "purpose.html",
        "golden-verses.html": "golden-verses.html",
        "prayfrombible.html": "prayfrombible.html",
        "about.html": "about.html",
        "index.html": "index.html",
        "comments.html": "comments.html"
    };

    let currentPage = decodeURIComponent(window.location.pathname.split("/").pop().split("?")[0]);
    currentPage = currentPage.toLowerCase();
    if (!currentPage || currentPage === '') {
    currentPage = 'index.html';
    } else if (!currentPage.endsWith('.html')) {
    currentPage += '.html';
    }
    const englishVersion = pageMapToEnglish[currentPage] || null;

    document.getElementById("header").innerHTML = `
        <div class="top-bar">
        <div class="top-left dropdown">
            <button class="dropbtn">☰ Выбрать</button>
            <div class="dropdown-content">
            ${currentPage === 'about.html' || currentPage === 'comments.html' 
                ? `<a href="javascript:history.back()">← Назад</a><a href="index.html">🏠 Домой</a>`
                : (currentPage !== 'index.html' ? `<a href="index.html">🏠 Домой</a>` : '')}
            <a href="#" class="share-button" title="Share">📤 Ссылка</a>
            ${currentPage !== 'comments.html' ? `<a href="comments.html">✍️ Отзыв</a>` : ''}
            ${currentPage !== 'about.html' ? `<a href="about.html">ℹ️ О нас</a>` : ''}
            </div>
        </div>
        <div class="top-right dropdown">
            <button class="dropbtn">🌐 Lang</button>
            <div class="dropdown-content">
            ${englishVersion ? `<a href="/${englishVersion}">Eng</a>` : `<span style="opacity: 0.5;">Eng</span>`}
            <a href="${currentPage}">Рус</a>
            </div>
        </div>
        </div>
    `;
});
