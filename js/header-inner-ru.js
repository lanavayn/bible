document.addEventListener("DOMContentLoaded", function () {
  const pageMap = {
    "10-commandments-en.html": "10-commandments.html",
    "purpose-en.html": "purpose.html",
    "golden-verses-en.html": "golden-verses.html",
    "prayFromBible-en.html": "prayFromBible.html",
    "about-en.html": "about.html"
  };

  const currentPage = location.pathname.split("/").pop();
  const russianVersion = pageMap[currentPage] || currentPage;

  document.getElementById("header").innerHTML = `
    <div class="top-bar">
      <div class="top-left">
        <a href="index.html">🏠 Главная</a>
      </div>
      <div>
        <a href="about.html">📄 О сайте</a>
      </div>
      <div class="top-center">
        <a href="#" class="share-button" title="Поделиться"> 
          <img src="images/share.png" alt="Поделиться" width="28">
        </a>
      </div>
      <div class="top-right dropdown">
        <button class="dropbtn">🌐 Language</button>
        <div class="dropdown-content">
          <a href="${Object.keys(pageMap).find(key => pageMap[key] === currentPage) || currentPage}" class="lang">English</a>
          <a href="${russianVersion}" class="lang">Русский</a>
        
        </div>
      </div>
    </div>
  `;
});
