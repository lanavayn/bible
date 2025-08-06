document.addEventListener("DOMContentLoaded", function () {
  const pageMapToRussian = {
    "10-commandments-en.html": "10-commandments.html",
    "purpose-en.html": "purpose.html",
    "golden-verses-en.html": "golden-verses.html",
    "prayfrombible-en.html": "prayfrombible.html"
  };

  let currentPage = decodeURIComponent(window.location.pathname.split("/").pop().split("?")[0]);
  if (!currentPage.endsWith('.html')) {
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
            <a href="index-en.html">🏠 Home</a>
            <a href="about-en.html">📄 About</a>
            <a href="#" class="share-button" title="Share">📤 Share</a>
          </div>
        </div>

        <div class="top-right dropdown">
          <button class="dropbtn">🌐 Lang</button>
          <div class="dropdown-content">
            <a href="${currentPage}">Eng</a>
            <a href="${russianVersion ? russianVersion : '#'}" ${russianVersion ? '' : 'style="pointer-events: none; opacity: 0.5;"'}>Рус</a>
          </div>
        </div>
      </div>
    `;
  }
});



