// /js/share.js
document.addEventListener("click", async function (event) {
  const shareBtn = event.target.closest(".share-button");

  if (!shareBtn) return;

  event.preventDefault();

  const shareData = {
    title: document.title,
    text: "Check out this page:",
    url: window.location.href
  };

  // Native share
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      console.log("Native share cancelled or failed");
    }
  }

  // Fallback
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    } catch (error) {
      prompt("Copy this link:", window.location.href);
    }
  } else {
    prompt("Copy this link:", window.location.href);
  }
});
