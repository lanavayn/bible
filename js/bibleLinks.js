// bibleLinks.js

// =========================
// SOURCES
// =========================
const BIBLE_SOURCES = {
    ru: {
      buildUrl: ({ bookCode, chapter, verse }) =>
        `https://bible.by/syn/${bookCode}/${chapter}/#${verse}`
    },
    en: {
      buildUrl: ({ bookCode, chapter, verse }) =>
        `https://www.esv.org/${bookCode}+${chapter}:${verse}/`
    }
  };
  
  // =========================
  // BOOK MAPPING (YOUR NUMBERS)
  // =========================
  const BOOK_MAP = {
    matthew: { ru: "40", en: "Matthew" },
    john: { ru: "43", en: "John" },
    acts: { ru: "44", en: "Acts" },
  
    romans: { ru: "52", en: "Romans" },
    "1-corinthians": { ru: "53", en: "1Corinthians" },
  
    galatians: { ru: "55", en: "Galatians" },
    ephesians: { ru: "56", en: "Ephesians" },
  
    titus: { ru: "63", en: "Titus" },
    hebrews: { ru: "65", en: "Hebrews" },
  
    colossians: { ru: "58", en: "Colossians" } 
  };
  
  // =========================
  // NORMALIZE INPUT
  // =========================
  function normalizeVerseRef(ref) {
    if (!ref || typeof ref !== "object") return null;
  
    const book = String(ref.book || "").trim().toLowerCase();
    const chapter = String(ref.chapter || "").trim();
    const verse = String(ref.verse || "").trim();
  
    if (!book || !chapter || !verse) return null;
  
    return { book, chapter, verse };
  }
  
  // =========================
  // GET BOOK CODE
  // =========================
  function getBookCode(bookKey, lang) {
    return BOOK_MAP[bookKey]?.[lang] || "";
  }
  
  // =========================
  // BUILD LINK
  // =========================
  export function buildBibleLink(ref, lang = "ru") {
    const normalized = normalizeVerseRef(ref);
    if (!normalized) return "";
  
    const source = BIBLE_SOURCES[lang];
    if (!source) return "";
  
    const bookCode = getBookCode(normalized.book, lang);
    if (!bookCode) return "";
  
    return source.buildUrl({
      bookCode,
      chapter: normalized.chapter,
      verse: normalized.verse
    });
  }
  
  // =========================
  // CHECK LINK EXISTS
  // =========================
  export function hasBibleLink(ref, lang = "ru") {
    return Boolean(buildBibleLink(ref, lang));
  }
  
  // =========================
  // OPTIONAL EXPORTS (DEBUG)
  // =========================
  export { BOOK_MAP, BIBLE_SOURCES };