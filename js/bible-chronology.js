(function(global) {
  const RU = {
    authorLabel: "Автор",
    annoLabel: "Аннотация"
  };

  const EN = {
    authorLabel: "Author",
    annoLabel: "Annotation"
  };

  let DATA = null;
  let dataPromise = null;
  let dataPath = null;

  function getLang() {
    return (document.documentElement.getAttribute("lang") || "ru")
      .toLowerCase()
      .startsWith("en") ? "en" : "ru";
  }

  function T() {
    return getLang() === "ru" ? RU : EN;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderReference(reference = "", chronologyRef = null, options = {}) {
    if (!reference) return "";

    const bookName = extractBookPart(reference);
    if (!bookName) return escapeHtml(reference);

    const rest = String(reference).slice(bookName.length);
    const payload = chronologyRef || reference;
    const lang = options.lang || getLang();
    const label = lang === "ru" ? "Открыть хронологию книги" : "Open book chronology";

    return `<span class="bible-chronology-book-link" role="button" tabindex="0" aria-label="${escapeHtml(label)}" data-chronology-reference='${escapeHtml(JSON.stringify(payload))}'>${escapeHtml(bookName)}</span>${escapeHtml(rest)}`;
  }
  async function loadBibleBooks(jsonPath = "/data/bible-books.json") {
    if (DATA && dataPath === jsonPath) return DATA;
    if (dataPromise && dataPath === jsonPath) return dataPromise;

    dataPath = jsonPath;
    dataPromise = fetch(jsonPath, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        DATA = json;
        return DATA;
      })
      .catch((err) => {
        dataPromise = null;
        throw err;
      });

    return dataPromise;
  }

  function allBooks(data = DATA) {
    return [...(data?.ot || []), ...(data?.nt || [])];
  }

  function stripListNumber(value = "") {
    return String(value).replace(/^\s*\d+\.\s*/, "").trim();
  }

  function normalizeBookText(value = "") {
    return stripListNumber(value)
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[–—]/g, "-")
      .replace(/[^a-zа-я0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractBookPart(reference) {
    if (!reference) return "";
    if (typeof reference === "object") return reference.book || "";

    return String(reference)
      .replace(/\s+\d+\s*[:.]\s*\d+.*$/, "")
      .replace(/\s+\d+\s*[:.]?.*$/, "")
      .trim();
  }

  function addAlias(index, alias, book) {
    const key = normalizeBookText(alias);
    if (key && !index.has(key)) index.set(key, book);
  }

  function buildIndex(data = DATA) {
    const index = new Map();

    allBooks(data).forEach((book) => {
      addAlias(index, book.id, book);
      addAlias(index, book.book_ru, book);
      addAlias(index, book.book_en, book);

      const enName = normalizeBookText(book.book_en);
      if (enName.endsWith("s")) addAlias(index, enName.slice(0, -1), book);
    });

    const aliases = {
      psalm: "psalms",
      psa: "psalms",
      псалом: "псалтирь",
      псалмы: "псалтирь",
      song: "song of songs",
      "song of solomon": "song of songs",
      revelation: "revelation",
      "1-john": "1 john",
      "2-john": "2 john",
      "3-john": "3 john",
      "1-corinthians": "1 corinthians",
      "2-corinthians": "2 corinthians",
      "1-thessalonians": "1 thessalonians",
      "2-thessalonians": "2 thessalonians",
      "1-peter": "1 peter",
      "2-peter": "2 peter",
      "1-иоанна": "1 иоанна",
      "2-иоанна": "2 иоанна",
      "3-иоанна": "3 иоанна",
      "1-коринфянам": "1 коринфянам",
      "2-коринфянам": "2 коринфянам",
      "1-фессалоникийцам": "1 фессалоникийцам",
      "2-фессалоникийцам": "2 фессалоникийцам",
      "1-петра": "1 петра",
      "2-петра": "2 петра"
    };

    Object.entries(aliases).forEach(([alias, target]) => {
      const book = index.get(normalizeBookText(target));
      if (book) addAlias(index, alias, book);
    });

    return index;
  }

  function findBookById(id, data = DATA) {
    return allBooks(data).find((book) => book.id === id) || null;
  }

  function findBookInData(reference, data = DATA) {
    const bookPart = extractBookPart(reference);
    if (!bookPart || !data) return null;

    return buildIndex(data).get(normalizeBookText(bookPart)) || null;
  }

  async function findBookByReference(reference, jsonPath = "/data/bible-books.json") {
    const data = await loadBibleBooks(jsonPath);
    return findBookInData(reference, data);
  }

  function hasDetails(book) {
    return !!(book && (
      book.ol || book.author_ru || book.author_en || book.anno_ru || book.anno_en ||
      book.year_ru || book.year_en || book.place_ru || book.place_en ||
      book.lang_detail_ru || book.lang_detail_en || book.orig_ru || book.orig_en
    ));
  }

  function detailsBoxHTML(book) {
    const isRu = getLang() === "ru";
    const t = T();
    const title = isRu ? book.book_ru : book.book_en;
    const year = isRu ? (book.year_ru || book.dates_ru) : (book.year_en || book.dates_en);
    const place = isRu ? book.place_ru : book.place_en;
    const author = isRu ? (book.author_ru || "—") : (book.author_en || book.author_ru || "—");
    const anno = isRu ? (book.anno_ru || "") : (book.anno_en || book.anno_ru || "");

    return `
      <div class="bd-inline-box">
        <button class="bd-inline-close" type="button">×</button>

        <div class="bd-inline-title">
          <strong>${title}</strong>
        </div>

        <strong>${t.authorLabel}:</strong> ${author}<br>
        <strong>${isRu ? 'Годы' : 'Dates'}:</strong> ${year}<br>
        ${place ? `<strong>${isRu ? 'Место' : 'Place'}:</strong> ${place}<br>` : ""}
        ${anno ? `<strong>${t.annoLabel}:</strong> ${anno}` : ""}
      </div>
    `;
  }

  function inlineRowHTML(book) {
    return `
      <tr class="bd-inline">
        <td colspan="2">
          ${detailsBoxHTML(book)}
        </td>
      </tr>
    `;
  }

  function closeOpenDetails() {
    document.querySelectorAll(".bd-inline").forEach((el) => el.remove());
  }

  function closeFromEvent(event) {
    if (!event.target.classList.contains("bd-inline-close")) return false;

    const row = event.target.closest(".bd-inline");
    if (row) row.remove();
    return true;
  }

  function toggleInlineDetails(button, book) {
    const tr = button.closest("tr");
    if (!tr || !book) return;

    const next = tr.nextElementSibling;
    if (next && next.classList.contains("bd-inline")) {
      next.remove();
      return;
    }

    closeOpenDetails();
    tr.insertAdjacentHTML("afterend", inlineRowHTML(book));
  }

  async function showReferenceDetails(reference, target, options = {}) {
    const book = await findBookByReference(reference, options.jsonPath);
    if (!book || !target) return null;

    if (target.closest("tr")) {
      toggleInlineDetails(target, book);
      return book;
    }

    closeOpenDetails();
    const insertionTarget = target.closest(".daily-verse-title-inline") || target;
    insertionTarget.insertAdjacentHTML("afterend", `<div class="bd-inline">${detailsBoxHTML(book)}</div>`);
    return book;
  }

  global.BibleChronology = {
    getLang,
    loadBibleBooks,
    allBooks,
    hasDetails,
    findBookById,
    findBookInData,
    findBookByReference,
    renderReference,
    toggleInlineDetails,
    closeFromEvent,
    closeOpenDetails,
    showReferenceDetails
  };
})(window);