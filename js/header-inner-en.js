document.addEventListener("DOMContentLoaded", function () {
  const pageMap = {
    "10-commandments.html": "10-commandments-en.html",
    "purpose.html": "purpose-en.html",
    "golden-verses.html": "golden-verses-en.html",
    "prayFromBible.html": "prayFromBible-en.html",
    "about.html": "about-en.html"
  };

  const currentPage = location.pathname.split("/").pop();
  const englishVersion = pageMap[currentPage] || currentPage;

  document.getElementById("header").innerHTML = `
    <div class="top-bar">
      <div class="top-left">
        <a href="index-en.html">🏠 Home</a>
      </div>
       <div class="top-centre">
        <a href="about-en.html">📄 About</a>
      </div>
      <div class="top-right">
        <a href="#" class="share-button" title="Share"> 
          <img src="images/share.png" alt="Share" width="28"> 
        </a>
      </div>

    </div>
  `;
});

