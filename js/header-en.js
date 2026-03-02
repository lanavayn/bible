document.addEventListener("DOMContentLoaded", function () {
  const pageMapToRussian = {
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

  const russianVersion = pageMapToRussian[currentPage] || null;

  //console.log("📄 Все страницы (pageMapToRussian):", pageMapToRussian);
  //console.log("Current Page:", currentPage);
  //console.log("Русская версия:", russianVersion);

  const headerElement = document.getElementById("header");
  if (headerElement) {
    headerElement.innerHTML = `
      <div class="top-bar">
        <div class="top-left dropdown">
          <button class="dropbtn">☰ Select</button>
          <div class="dropdown-content">
            ${currentPage === 'about.html' || currentPage === 'comments.html' 
              ? `<a href="javascript:history.back()">← Back</a><a href="index.html">🏠 Home</a>`
              : (currentPage !== 'index.html' ? `<a href="index.html">🏠 Home</a>` : '')}
            <a href="#" class="share-button" title="Share">📤 Share</a>
            ${currentPage !== 'comments.html' ? `<a href="comments.html">✍️ Notes</a>` : ''}
            ${currentPage !== 'about.html' ? `<a href="about.html">ℹ️ Info</a>` : ''}
          </div>
        </div>

        <div class="top-right dropdown">
          <button class="dropbtn">🌐 Lang</button>
          <div class="dropdown-content">
            <a href="${currentPage}">Eng</a>
            <a href="${russianVersion === 'index.html' ? '/ru/' : '/ru/' + russianVersion}">Рус</a>
          </div>
        </div>
      </div>
    `;
  }
});



