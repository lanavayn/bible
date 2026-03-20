// /js/share.js
document.addEventListener("DOMContentLoaded", function () {
  const shareBtn = document.querySelector('.share-button');

  if (!shareBtn) return;

  shareBtn.addEventListener("click", async function (event) {
    event.preventDefault();

    const shareData = {
      title: document.title,
      text: "Check out this page:",
      url: window.location.href
    };

    // 1. Попробовать нативный Share (мобилки, некоторые браузеры)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        console.log("Native share cancelled or failed");
      }
    }

    // 2. Fallback — копирование ссылки
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch (error) {
        prompt("Copy this link:", window.location.href);
      }
    } else {
      prompt("Copy this link:", window.location.href);
    }
  });
});
