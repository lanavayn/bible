// /js/share.js
document.addEventListener("DOMContentLoaded", function () {
  const shareBtn = document.querySelector('.share-button');

  if (shareBtn && navigator.share) {
    shareBtn.addEventListener("click", function (event) {
      event.preventDefault();

      navigator.share({
        title: document.title,
        text: "Check out this page:",
        url: window.location.href
      }).catch((error) => {
        console.error("Sharing failed", error);
      });
    });
  }
});

