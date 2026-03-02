// /js/book-dates.js  (замените содержимое файла)
(function(){
  const RU = {
    title: "📚 Хронология Библии",
    search: "Найти книгу…",
    ot: "Ветхий Завет", nt: "Новый Завет",
    thBook: "Название книги", thDate: "Годы написания (~)", thInfo: "",
    more: "Подробнее", close: "Закрыть",
    langLabel: "Исходный язык", authorLabel: "Автор", annoLabel: "Аннотация",
    langMap: { he: "древнееврейский", ar: "арамейский", gr: "греческий" }
  };
  const EN = {
    title: "📚 Bible Timeline",
    search: "Search a book…",
    ot: "Old Testament", nt: "New Testament",
    thBook: "Book Title", thDate: "Years of Writing (~)", thInfo: "",
    more: "Details", close: "Close",
    langLabel: "Original language", authorLabel: "Author", annoLabel: "Annotation",
    langMap: { he: "Hebrew", ar: "Aramaic", gr: "Greek" }
  };

  const getLang = () =>
    (document.documentElement.getAttribute("lang")||"ru")
      .toLowerCase().startsWith("en") ? "en" : "ru";
  const T = () => (getLang()==="ru" ? RU : EN);

  let DATA = null; // весь JSON, чтобы искать книгу по id

  const hasDetails = (b) => !!(b && (
    b.ol || b.author_ru || b.author_en || b.anno_ru || b.anno_en ||
    b.year_ru || b.year_en || b.place_ru || b.place_en ||
    b.lang_detail_ru || b.lang_detail_en || b.orig_ru || b.orig_en
  ));
  

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
      <div class="bd-modal" role="dialog" aria-modal="true"
          style="width:min(720px,92vw);
            max-height:85vh;                /* allow scrolling in modal */
            overflow:auto;                  /* scrollable content */
            -webkit-overflow-scrolling:touch; /* smooth iOS scroll */
            background:#fff; color:#2b2b2b;
            border:1px solid #eadfbe; border-radius:14px;
            padding:18px; box-shadow:0 10px 30px rgba(0,0,0,.15);
            word-break:break-word; overflow-wrap:anywhere;">
        <h3 id="bdTitle" style="margin:0 0 10px;"></h3>
        <div id="bdBody" style="line-height:1.6;margin-top:.25rem;"></div>
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
  
    const title   = isRu ? book.book_ru : book.book_en;
    const year    = isRu ? (book.year_ru || book.dates_ru) : (book.year_en || book.dates_en);
    const place   = isRu ? book.place_ru : book.place_en;
    const langStr = book.ol ? (t.langMap[book.ol] || book.ol) : "—";
    const langDet = isRu ? book.lang_detail_ru : book.lang_detail_en;
    const author  = isRu ? (book.author_ru||"—") : (book.author_en||book.author_ru||"—");
    const anno    = isRu ? (book.anno_ru||"") : (book.anno_en||book.anno_ru||"");
    const orig    = isRu ? book.orig_ru : book.orig_en;
  
    document.getElementById("bdTitle").textContent = title;
  
    const rows = [];
    rows.push(`<p><strong>${t.authorLabel}:</strong> ${author}</p>`);
    //if (year)   rows.push(`<p><strong>${isRu?'Годы написания (приблизительно)':'Dates of Writing (approx.)'}:</strong> ${year}</p>`);
    if (year) {
      const yearLabel = isRu ? 'Годы написания ~' : 'Dates of Writing ~';
    
      // кастомные tooltip’ы: перенос строки через \n
      const tradTip = isRu
        ? '<span class="tip" tabindex="0" data-tip="Традиционная\n(церковная/раввинская традиция)">Традиционная</span>'
        : '<span class="tip" tabindex="0" data-tip="Traditional\n(church/rabbinic tradition)">Traditional</span>';
    
      const critTip = isRu
        ? '<span class="tip" tabindex="0" data-tip="Критическая\n(современный научный взгляд)">Критическая</span>'
        : '<span class="tip" tabindex="0" data-tip="Critical\n(modern scholarly view)">Critical</span>';
    
      const yearText = year
        .replace(/Традиц\./, tradTip)
        .replace(/критич\./i, critTip)
        .replace(/Trad\./, tradTip)
        .replace(/crit\./i, critTip)
        .replace(/Традиционная\./, tradTip)
        .replace(/Критическая\./i, critTip)
        .replace(/Traditional\./, tradTip)
        .replace(/Critical\./i, critTip)       
        ;
    
      rows.push(`<p><strong>${yearLabel}:</strong> ${yearText}</p>`);
    }  
    
    if (place)  rows.push(`<p><strong>${isRu?'Место написания':'Place'}:</strong> ${place}</p>`);
    rows.push(`<p><strong>${t.langLabel}:</strong> ${langStr}${langDet?(' — '+langDet):''}</p>`);
   

    if (orig)   rows.push(`<p><strong>${isRu?'Древнейшие рукописи':'Ancient Manuscripts'}:</strong> ${orig}</p>`);
    if (anno)   rows.push(`<p><strong>${t.annoLabel}:</strong> ${anno}</p>`);
    if (book.chapters) 
      rows.push(`<p><strong>${isRu?'Количество глав':'Number of Chapters'}:</strong> ${book.chapters}</p>`);
    document.getElementById("bdBody").innerHTML = rows.join("\n");
    document.querySelector('.bd-modal').scrollTop = 0;
    document.getElementById("bdBackdrop").style.display = "grid";
  }
  

  async function init(selector="#book-dates", jsonPath="/data/bible-books.json"){
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
