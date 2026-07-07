(function(global) {
  function isSameOrContains(element, except) {
    return Boolean(element && except && (element === except || element.contains(except)));
  }

  function closeAll(options = {}) {
    const except = options.except || null;

    document.querySelectorAll(".footer-help-inline").forEach((inline) => {
      if (!isSameOrContains(inline, except)) {
        inline.setAttribute("hidden", "");
      }
    });

    document.querySelectorAll(".footer-help-btn, .daily-tomorrow-btn, .question-tomorrow-btn").forEach((btn) => {
      const popup = btn.nextElementSibling;
      if (!isSameOrContains(popup, except)) {
        btn.setAttribute("aria-expanded", "false");
      }
    });

    document.querySelectorAll(".bd-inline").forEach((details) => {
      if (!isSameOrContains(details, except)) {
        details.remove();
      }
    });

    document.querySelectorAll(".scripture-details, .verse-details").forEach((details) => {
      if (!isSameOrContains(details, except)) {
        details.style.display = "none";
      }
    });

    document.querySelectorAll(".footer-timeline-box").forEach((box) => {
      if (!isSameOrContains(box, except)) {
        box.hidden = true;
      }
    });

    const sharePopup = document.getElementById("share-popup");
    if (sharePopup && !isSameOrContains(sharePopup, except)) {
      sharePopup.remove();
    }

    document.querySelectorAll(".dropdown.is-open").forEach((dropdown) => {
      if (!isSameOrContains(dropdown, except)) {
        dropdown.classList.remove("is-open");
        const btn = dropdown.querySelector(".dropbtn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  global.PopupManager = {
    closeAll
  };
})(window);
