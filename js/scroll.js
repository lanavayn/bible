// scroll.js
function initBackToTopButton() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn || btn.dataset.visibilityReady === "true") return;

  btn.dataset.visibilityReady = "true";

  const hero = document.querySelector(
    ".page-hero, .comments-hero, .hero-title, #header"
  );

  const setVisible = (visible) => {
    btn.classList.toggle("is-visible", visible);
    btn.setAttribute("aria-hidden", String(!visible));
  };

  if (!hero) {
    const updateFromScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    updateFromScroll();
    return;
  }

  const updateFromHero = () => {
    setVisible(hero.getBoundingClientRect().bottom <= 0);
  };

  let updatePending = false;
  window.addEventListener("scroll", () => {
    if (updatePending) return;

    updatePending = true;
    window.requestAnimationFrame(() => {
      updateFromHero();
      updatePending = false;
    });
  }, { passive: true });

  updateFromHero();
}

if (document.readyState === "complete") {
  initBackToTopButton();
} else {
  window.addEventListener("load", initBackToTopButton, { once: true });
}

window.scrollToTop = function() {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
