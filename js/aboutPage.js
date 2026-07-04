import { buildBibleLink } from "./bibleLinks.js";

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("about-page");
  if (!root) return;

  const lang = document.documentElement.lang === "ru" ? "ru" : "en";

  try {
    const response = await fetch(getBasePath() + "data/aboutBibleData.json");
    const data = await response.json();

    renderPage(data, lang, root);
  } catch (err) {
    console.error("Error loading About Bible:", err);
    root.innerHTML = `<p>${lang === "ru" ? "Ошибка загрузки страницы" : "Failed to load page"}</p>`;
  }
});

function getBasePath() {
  const path = window.location.pathname;
  if (path.includes("/ru/") || path.includes("/en/")) return "../";
  return "./";
}

/* =========================
   MAIN RENDER
========================= */
function renderPage(data, lang, root) {
    root.innerHTML = "";
  
    const title = document.createElement("h1");
    title.className = "page-title";
    title.textContent = data.page.title[lang];
    root.appendChild(title);
  
    const intro = document.createElement("p");
    intro.className = "page-intro";
    intro.textContent = data.page.intro[lang];
    root.appendChild(intro);
  
    if (Array.isArray(data.topNav) && data.topNav.length) {
      root.appendChild(createTopNav(data.topNav, lang));
    }
  
    data.sections.forEach(section => {
      root.appendChild(renderSection(section, lang));
    });
    bindFooterStyleHelp(root);
  }

/* =========================
   SECTION RENDER
========================= */
function renderSection(section, lang) {
  const container = document.createElement("section");
  container.className = `about-section ${section.type}`;

  if (section.id) {
    container.id = section.id;
  }

  if (section.type === "highlights") {
    const ul = document.createElement("ul");
    ul.className = "about-highlights";

    section.items.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${item.icon}</span> ${item.text[lang]}`;
      ul.appendChild(li);
    });

    container.appendChild(ul);
  }

  if (section.type === "scripture_section") {
    if (section.title?.[lang]) {
      container.appendChild(createTitle(section.title[lang]));
    }

    if (section.intro) {
      container.appendChild(createText(section.intro[lang]));
    }

    section.verses.forEach((verse, index) => {
      container.appendChild(renderVerse(verse, lang, index));
    });
  }

  if (section.type === "text_section") {
    if (section.title?.[lang]) {
      container.appendChild(createTitle(section.title[lang]));
    }

    section.paragraphs[lang].forEach(p => {
      container.appendChild(createText(p));
    });
  }

  if (section.type === "link_note" || section.type === "motto") {
    container.appendChild(createTitle(section.title[lang]));
    container.appendChild(createText(section.text[lang]));
  }

  return container;
}

/* =========================
   VERSE BLOCK
========================= */
function renderVerse(item, lang, index) {
    const block = document.createElement("div");
    block.className = "scripture-item";
  
    const ref = item[`reference_${lang}`];
    const topic = item[`topic_${lang}`] || "";
    const text = item[`text_${lang}`];
    const interpretation = item[`interpretation_${lang}`];
    const related = Array.isArray(item.related) ? item.related : [];
  
    const verseRef = item.verse_ref_lang?.[lang];
    const link = buildBibleLink(verseRef, lang);
  
    const detailsId = `about-details-${index}`;
  
    const detailsTitle =
      lang === "ru" ? "Размышление:" : "Reflection";
  
    const relatedTitle =
      lang === "ru" ? "См. также в Писании:" : "See also in Scripture:";
  
    block.innerHTML = `
      <h3 class="scripture-heading">
  
        <span class="scripture-topic">${topic}</span>
        —
        <a href="#"
           class="scripture-reference explain-link"
           data-target="${detailsId}">
           ${ref}
        </a>
  
        ${
          link
            ? `<a href="${link}" target="_blank" class="scripture-book-link">📖</a>`
            : ""
        }
      </h3>
  
      <p class="scripture-text">${text}</p>
  
      <div class="scripture-details" id="${detailsId}" style="display:none;">
        <div class="scripture-note-box">
  
          <div class="scripture-close-row">
            <button class="scripture-close" type="button" data-target="${detailsId}">
              ×
            </button>
          </div>
  
          ${
            interpretation
              ? `
            <p class="scripture-interpretation">
              <strong>${detailsTitle}</strong>
              ${interpretation}
            </p>
          `
              : ""
          }
  
          ${
            related.length
              ? `
            <div class="scripture-related-block">
              <p class="scripture-related-title">
                <strong>${relatedTitle}</strong>
              </p>
              <ul class="scripture-related-list">
                ${related.map(rel => renderRelated(rel, lang)).join("")}
              </ul>
            </div>
          `
              : ""
          }
  
        </div>
      </div>
    `;
  
    bindExplainLinks(block);
  
    return block;
  }

/* =========================
   HELPERS
========================= */
function createTitle(text) {
  const el = document.createElement("h2");
  el.className = "section-title";
  el.textContent = text;
  return el;
}

function createText(text) {
  const el = document.createElement("p");
  el.className = "section-text";
  el.innerHTML  = text;
  return el;
}

  
  function toggleDetails(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
  
    const isOpen = el.style.display === "block";
  
    document.querySelectorAll(".scripture-details").forEach(e => {
      e.style.display = "none";
    });
  
    if (!isOpen) el.style.display = "block";
  }
  
  function closeDetails(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.style.display = "none";
  }
  
  function renderRelated(rel, lang) {
    const ref = rel[`reference_${lang}`] || "";
    const text = rel[`text_${lang}`] || "";
    const verseRef = rel?.verse_ref_lang?.[lang];
    const link = buildBibleLink(verseRef, lang);
  
    return `
      <li class="scripture-related-item">
        <span class="scripture-related-ref">${ref}</span>
        ${
          link
            ? `<a class="scripture-book-link" href="${link}" target="_blank">📖</a>`
            : ""
        }
        <span class="scripture-related-text">— ${text}</span>
      </li>
    `;
  }

  function bindExplainLinks(root) {
    root.querySelectorAll(".explain-link").forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const id = this.dataset.target;
        toggleDetails(id);
      });
    });
  
    root.querySelectorAll(".scripture-close").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.target;
        closeDetails(id);
      });
    });

    root.querySelectorAll("a.scripture-book-link").forEach(link => {
      link.addEventListener("click", () => {
        document.querySelectorAll(".scripture-details").forEach(el => {
          el.style.display = "none";
        });
      });
    });
  }

  function createTopNav(items, lang) {
    const nav = document.createElement("div");
    nav.className = "top-nav";
  
    items.forEach(item => {
      const link = document.createElement("a");
      link.href = `#${item.id}`;
      link.className = "top-nav-link";
      link.textContent = item.label?.[lang] || "";
      nav.appendChild(link);
    });
  
    return nav;
  }

  function bindFooterStyleHelp(root) {
    const helpButtons = root.querySelectorAll(".footer-help-btn");
  
    helpButtons.forEach(btn => {
      const helpInline = btn.nextElementSibling;
      if (!helpInline || !helpInline.classList.contains("footer-help-inline")) return;
  
      const helpClose = helpInline.querySelector(".footer-help-close");
  
      btn.addEventListener("click", () => {
        const isOpen = !helpInline.hasAttribute("hidden");
  
        root.querySelectorAll(".footer-help-inline").forEach(el => {
          el.setAttribute("hidden", "");
        });
  
        root.querySelectorAll(".footer-help-btn").forEach(b => {
          b.setAttribute("aria-expanded", "false");
        });
  
        if (!isOpen) {
          helpInline.removeAttribute("hidden");
          btn.setAttribute("aria-expanded", "true");
        }
      });
  
      if (helpClose) {
        helpClose.addEventListener("click", () => {
          helpInline.setAttribute("hidden", "");
          btn.setAttribute("aria-expanded", "false");
        });
      }
    });
  }
