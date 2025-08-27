// /js/book-dates.js  (замените содержимое файла)
(function(){
  const RU = {
    title: "📚 Годы написания книг Библии (ориентировочно)",
    search: "Найти книгу…",
    ot: "Ветхий Завет", nt: "Новый Завет",
    thBook: "Книга", thDate: "Датировка", thInfo: "",
    more: "Подробнее", close: "Закрыть",
    langLabel: "Исходный язык", authorLabel: "Автор", annoLabel: "Аннотация",
    langMap: { he: "древнееврейский", ar: "арамейский", gr: "греческий" }
  };
  const EN = {
    title: "📚 Approximate Dates of Bible Books",
    search: "Search a book…",
    ot: "Old Testament", nt: "New Testament",
    thBook: "Book", thDate: "Date", thInfo: "",
    more: "Details", close: "Close",
    langLabel: "Original language", authorLabel: "Author", annoLabel: "Annotation",
    langMap: { he: "Hebrew", ar: "Aramaic", gr: "Greek" }
  };

  const getLang = () =>
    (document.documentElement.getAttribute("lang")||"ru")
      .toLowerCase().startsWith("en") ? "en" : "ru";
  const T = () => (getLang()==="ru" ? RU : EN);

  let DATA = null; // весь JSON, чтобы искать книгу по id

  const hasDetails = (b) =>
    !!(b && (b.ol || b.author_ru || b.author_en || b.anno_ru || b.anno_en));

  function rowHTML(b){
    const isRu = getLang()==="ru";
    const name  = isRu ? b.book_ru : b.book_en;
    const dates = isRu ? b.dates_ru : b.dates_en;
    const showBtn = hasDetails(b);
    const btn = showBtn
      ? `<button class="bd-info" data-id="${b.id}" aria-label="${T().more}">ℹ︎</button>`
      : "";
    return `<tr id="book-${b.id}">
      <td>${name}</td>
      <td>${dates}</td>
      <td class="bd-actions" style="text-align:right; white-space:nowrap;">${btn}</td>
    </tr>`;
  }

  function tableHTML(arr){
    const t = T();
    return `
      <table class="book-dates">
        <thead>
          <tr>
            <th>${t.thBook}</th>
            <th>${t.thDate}</th>
            <th style="width:1%">${t.thInfo}</th>
          </tr>
        </thead>
        <tbody>${arr.map(rowHTML).join("")}</tbody>
      </table>`;
  }

  function modalShell(root){
    const t = T();
    root.insertAdjacentHTML("beforeend", `
      <div class="bd-backdrop" id="bdBackdrop" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.25);place-items:center;z-index:9999;">
        <div class="bd-modal" role="dialog" aria-modal="true" style="width:min(720px,90vw);background:#fff;border:1px solid #eadfbe;border-radius:14px;padding:18px;box-shadow:0 10px 30px rgba(0,0,0,.15);">
          <h3 id="bdTitle" style="margin:0 0 10px;"></h3>
          <div id="bdBody" style="line-height:1.6;"></div>
          <div style="text-align:right;margin-top:12px;">
            <button id="bdClose" class="bd-close" style="padding:8px 12px;border:1px solid #eadfbe;background:#f6e7c1;border-radius:10px;">${t.close}</button>
          </div>
        </div>
      </div>
    `);
  }

  function openModal(book){
    const isRu = getLang()==="ru";
    const t = T();
    const langStr = book.ol ? (t.langMap[book.ol] || book.ol) : "—";
    const author  = isRu ? (book.author_ru||"—") : (book.author_en||book.author_ru||"—");
    const anno    = isRu ? (book.anno_ru||"") : (book.anno_en||book.anno_ru||"");
    const title   = isRu ? book.book_ru : book.book_en;

    document.getElementById("bdTitle").textContent = title;
    document.getElementById("bdBody").innerHTML = `
      <p><strong>${t.langLabel}:</strong> ${langStr}</p>
      <p><strong>${t.authorLabel}:</strong> ${author}</p>
      ${anno ? `<p><strong>${t.annoLabel}:</strong> ${anno}</p>` : "" }
    `;
    document.getElementById("bdBackdrop").style.display = "grid";
  }

  async function init(selector="#book-dates", jsonPath="data/bible-books.json"){
    const root = document.querySelector(selector);
    if (!root) return;

    const t = T();
    root.innerHTML = `
      <h2>${t.title}</h2>
      <input type="search" class="bd-search" placeholder="${t.search}"
             style="margin:.5rem 0; width:100%; max-width:420px; padding:.5rem .7rem; border:1px solid #eadfbe; border-radius:8px;">
      <details open><summary><strong>${t.ot}</strong></summary><div class="bd-ot">Загрузка…</div></details>
      <details><summary><strong>${t.nt}</strong></summary><div class="bd-nt">Загрузка…</div></details>
    `;
    modalShell(root);

    try {
      const res = await fetch(jsonPath, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      DATA = await res.json();

      root.querySelector(".bd-ot").innerHTML = tableHTML(DATA.ot);
      root.querySelector(".bd-nt").innerHTML = tableHTML(DATA.nt);
    } catch (e) {
      const msg = 'Не удалось загрузить данные. Откройте сайт через http(s) или проверьте путь к data/bible-books.json.';
      root.querySelector(".bd-ot").innerHTML = `<div class="err">${msg}</div>`;
      root.querySelector(".bd-nt").innerHTML = '';
      console.error(e);
    }

    // поиск
    const input = root.querySelector(".bd-search");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      for (const tr of root.querySelectorAll("tbody tr")){
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
      }
    });

    // клики по "Подробнее" и закрытие модалки
    root.addEventListener("click", (e) => {
      const btn = e.target.closest(".bd-info");
      if (btn) {
        const id = btn.dataset.id;
        const book = [...(DATA?.ot||[]), ...(DATA?.nt||[])].find(x => x.id===id);
        if (book) openModal(book);
      }
    });
    root.querySelector("#bdClose").addEventListener("click", () =>
      (document.getElementById("bdBackdrop").style.display = "none")
    );
    root.querySelector("#bdBackdrop").addEventListener("click", (e) => {
      if (e.target.id === "bdBackdrop") e.currentTarget.style.display = "none";
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.getElementById("bdBackdrop").style.display = "none";
  });
  document.addEventListener("DOMContentLoaded", () => init());
})();
