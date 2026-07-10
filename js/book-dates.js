// /js/book-dates.js
(function() {
  const RU = {
    title: "📚 Хронология Библии",
    search: "Найти книгу…",
    ot: "Ветхий Завет", nt: "Новый Завет",
    thBook: "Название книги", thDate: "Годы написания (~)"
  };
  const EN = {
    title: "📚 Bible Timeline",
    search: "Search a book…",
    ot: "Old Testament", nt: "New Testament",
    thBook: "Book Title", thDate: "Years of Writing (~)"
  };

  const getLang = () =>
    (document.documentElement.getAttribute("lang") || "ru")
      .toLowerCase().startsWith("en") ? "en" : "ru";
  const T = () => (getLang() === "ru" ? RU : EN);

  let DATA = null;
  let chronologyPromise = null;

  function ensureBibleChronology() {
    if (window.BibleChronology) return Promise.resolve(window.BibleChronology);
    if (chronologyPromise) return chronologyPromise;

    chronologyPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/js/bible-chronology.js";
      script.onload = () => resolve(window.BibleChronology);
      script.onerror = () => reject(new Error("Failed to load /js/bible-chronology.js"));
      document.head.appendChild(script);
    });

    return chronologyPromise;
  }

  function rowHTML(b, chronology) {
    const isRu = getLang() === "ru";
    const name = chronology.formatBookHeading
      ? chronology.formatBookHeading(b, getLang())
      : `${isRu ? "Книга" : "Book"} ${isRu ? b.book_ru : b.book_en}`;
    const dates = isRu ? b.dates_ru : b.dates_en;
    const btn = chronology.hasDetails(b)
      ? `<button class="bd-info" type="button" data-id="${b.id}">i</button>`
      : "";

    return `<tr id="book-${b.id}">
      <td class="bd-book-cell">
        ${btn}
        <span class="bd-book-name">${name}</span>
      </td>
      <td>${dates}</td>
    </tr>`;
  }

  function tableHTML(arr, chronology) {
    const t = T();
    return `
      <table class="book-dates">
        <thead>
          <tr>
            <th>${t.thBook}</th>
            <th>${t.thDate}</th>
          </tr>
        </thead>
        <tbody>${arr.map((book) => rowHTML(book, chronology)).join("")}</tbody>
      </table>`;
  }

  window.initBookDates = async function initBookDates(selector = "#book-dates", jsonPath = "/data/bible-books.json") {
    const root = document.querySelector(selector);
    if (!root) return;

    const chronology = await ensureBibleChronology();
    const t = T();
    root.innerHTML = `
        <input type="search" class="bd-search" placeholder="${t.search}"
          style="margin:.5rem 0; width:100%; max-width:420px; padding:.5rem .7rem; border:1px solid #eadfbe; border-radius:8px;">
        <h1 class="hero-title">${t.title}</h1>

          <details id="old-testament">
            <summary><strong>${t.ot}</strong></summary>
            <div class="bd-ot">Загрузка…</div>
          </details>

          <details id="new-testament">
            <summary><strong>${t.nt}</strong></summary>
            <div class="bd-nt">Загрузка…</div>
          </details>
    `;

    const allDetails = root.querySelectorAll("details");
    allDetails.forEach((current) => {
      current.addEventListener("toggle", () => {
        if (current.open) {
          allDetails.forEach((other) => {
            if (other !== current) other.open = false;
          });
        }
      });
    });

    try {
      DATA = await chronology.loadBibleBooks(jsonPath);
      root.querySelector(".bd-ot").innerHTML = tableHTML(DATA.ot, chronology);
      root.querySelector(".bd-nt").innerHTML = tableHTML(DATA.nt, chronology);
    } catch (e) {
      const msg = "Не удалось загрузить данные. Откройте сайт через http(s) или проверьте путь к data/bible-books.json.";
      root.querySelector(".bd-ot").innerHTML = `<div class="err">${msg}</div>`;
      root.querySelector(".bd-nt").innerHTML = "";
      console.error(e);
    }

    const input = root.querySelector(".bd-search");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      for (const tr of root.querySelectorAll("tbody tr")) {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
      }
    });

    root.addEventListener("click", (e) => {
      if (chronology.closeFromEvent(e)) return;

      const btn = e.target.closest(".bd-info");
      if (!btn) return;

      const book = chronology.findBookById(btn.dataset.id, DATA);
      if (book) chronology.toggleInlineDetails(btn, book);
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("#book-dates");
    if (root) window.initBookDates();
  });
})();

setTimeout(() => {
  const section = document.querySelector("#book-dates");
  if (!section) return;

  let parent = section.closest(".topic-list");

  while (parent) {
    if (parent.style.maxHeight) {
      parent.style.maxHeight = parent.scrollHeight + "px";
    }
    parent = parent.parentElement;
  }
}, 0);
