document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("header").innerHTML = `
    <div class="top-bar">
      <div class="top-left dropdown">
       <button class="dropbtn">☰ Выбрать </button>
        <div class="dropdown-content">
          <a href="about.html">📄 О нас</a>
          <a href="#" class="share-button" title="Поделиться">📤 Ссылка</a>
        </div>
      </div>

      <div class="top-right dropdown">
        <button class="dropbtn">🌐 Lang</button>
        <div class="dropdown-content">
          <a href="index-en.html">Eng</a>
          <a href="index.html">Рус</a>
        </div>
      </div>
    </div>
  `;
});

