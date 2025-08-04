document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("header").innerHTML = `
    <div class="top-bar">
      <div class="top-left">
        <a href="about.html">📄 О сайте</a>
      </div>
      <div class="top-centre">
        <a href="#" class="share-button" title="Поделиться">
          <img src="images/share.png" alt="Поделиться" width="20"> Поделиться
        </a>
      </div>
      <div class="top-right dropdown">
        <button class="dropbtn">🌐 Language</button>
        <div class="dropdown-content">
          <a href="index-en.html">English</a>
          <a href="index.html">Русский</a>
        </div>
      </div>
    </div>
  `;
});

