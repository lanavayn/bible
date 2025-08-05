document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("header").innerHTML = `
    <div class="top-bar">
      <div class="top-left dropdown">
       <button class="dropbtn">☰ Выбрать </button>
        <div class="dropdown-content">
          <a href="about.html">📄 О сайте</a>
          <a href="#" class="share-button" title="Поделиться">📤 Поделиться</a>
        </div>
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

