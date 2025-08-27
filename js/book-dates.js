// /js/book-dates.js
(function(){
  const RU = {
    title: "📚 Годы написания книг Библии (ориентировочно)",
    search: "Найти книгу…", ot: "Ветхий Завет", nt: "Новый Завет",
    thBook: "Книга", thDate: "Датировка", thNote: "Примечание"
  };
  const EN = {
    title: "📚 Approximate Dates of Bible Books",
    search: "Search a book…", ot: "Old Testament", nt: "New Testament",
    thBook: "Book", thDate: "Date", thNote: "Note"
  };

  function lang(){
    return (document.documentElement.getAttribute("lang")||"ru").toLowerCase().startsWith("en") ? "en" : "ru";
  }

  function t(){
    return lang()==="ru" ? RU : EN;
  }

  function rowHTML(b){
    const isRu = lang()==="ru";
    const name  = isRu ? b.book_ru : b.book_en;
    const dates = isRu ? b.dates_ru : b.dates_en;
    const note  = isRu ? (b.note_ru||"") : (b.note_en||b.note_ru||"");
    return `<tr id="book-${b.id}"><td>${name}</td><td>${dates}</td><td>${note||""}</td></tr>`;
  }

  function tableHTML(arr){
    const L = t();
    return `
      <table class="book-dates">
        <thead><tr><th>${L.thBook}</th><th>${L.thDate}</th><th>${L.thNote}</th></tr></thead>
        <tbody>${arr.map(rowHTML).join("")}</tbody>
      </table>`;
  }

  async function init(selector="#book-dates", jsonPath="data/bible-books.json"){
    const root = document.querySelector(selector);
    if (!root) return;

    const L = t();
    root.innerHTML = `
      <h2>${L.title}</h2>
      <input type="search" class="bd-search" placeholder="${L.search}" style="margin:.5rem 0; width:100%; max-width:420px; padding:.5rem .7rem; border:1px solid #eadfbe; border-radius:8px;">
      <details open><summary><strong>${L.ot}</strong></summary><div class="bd-ot">Загрузка…</div></details>
      <details><summary><strong>${L.nt}</strong></summary><div class="bd-nt">Загрузка…</div></details>
    `;

    try {
      const res = await fetch(jsonPath, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      root.querySelector(".bd-ot").innerHTML = tableHTML(data.ot);
      root.querySelector(".bd-nt").innerHTML = tableHTML(data.nt);
    } catch (e) {
      const msg = 'Не удалось загрузить данные. Откройте сайт через http(s) или проверьте путь к data/bible-books.json.';
      root.querySelector(".bd-ot").innerHTML = `<div class="err">${msg}</div>`;
      root.querySelector(".bd-nt").innerHTML = '';
      console.error(e);
    }

    // search filter
    const input = root.querySelector(".bd-search");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      for (const tr of root.querySelectorAll("tbody tr")){
        const text = tr.textContent.toLowerCase();
        tr.style.display = text.includes(q) ? "" : "none";
      }
    });
  }

  // auto-mount
  document.addEventListener("DOMContentLoaded", () => init());
})();


