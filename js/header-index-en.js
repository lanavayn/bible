document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("header").innerHTML = `
    <div class="top-bar">
        <div>
          <a href="about-en.html">📄 About</a>
        </div> <!-- Placeholder on the left to align language right -->
            <!-- 🔗 Share -->
      <a href="#" class="share-button" title="Share">
        <img src="images/share.png" alt="Share" width="24" >
      </a>
      <div class="dropdown">
        <button class="dropbtn">🌐 Language</button>
        <div class="dropdown-content">
          <a href="index-en.html">English</a>
          <a href="index.html">Русский</a>
        </div>
      </div>
    </div>
  `;
});
