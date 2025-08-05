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
      <div class="top-left dropdown">
       <button class="dropbtn">☰ Select </button>
        <div class="dropdown-content">
          <a href="index-en.html">🏠 Home</a>
          <a href="about-en.html">📄 About</a>
          <a href="#" class="share-button" title="Share">📤 Share</a>
        </div> 
      </div> 
    </div>
  `;
});

