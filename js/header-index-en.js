document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("header").innerHTML = `
    <div class="top-bar">
      <div class="top-left dropdown">
       <button class="dropbtn">☰ Select </button>
        <div class="dropdown-content">
          <a href="about-en.html">📄 About</a>
          <a href="#" class="share-button" title="Share">📤 Share</a>
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
