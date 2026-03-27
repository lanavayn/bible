document.addEventListener("DOMContentLoaded", () => {
    const dropdowns = document.querySelectorAll(".dropdown");
  
    dropdowns.forEach((dropdown) => {
      const button = dropdown.querySelector(".dropbtn");
      const menu = dropdown.querySelector(".dropdown-content");
  
      if (!button || !menu) return;
  
      button.setAttribute("aria-haspopup", "true");
      button.setAttribute("aria-expanded", "false");
  
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
  
        const isOpen = dropdown.classList.contains("is-open");
  
        dropdowns.forEach((d) => {
          d.classList.remove("is-open");
          const btn = d.querySelector(".dropbtn");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });
  
        if (!isOpen) {
          dropdown.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  
    document.addEventListener("click", (e) => {
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("is-open");
          const btn = dropdown.querySelector(".dropbtn");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });
    });
  
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        dropdowns.forEach((dropdown) => {
          dropdown.classList.remove("is-open");
          const btn = dropdown.querySelector(".dropbtn");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });
      }
    });
  });