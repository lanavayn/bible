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
      // Old Testament
      genesis: { ru: "1", en: "Genesis" },
      exodus: { ru: "2", en: "Exodus" },
      leviticus: { ru: "3", en: "Leviticus" },
      numbers: { ru: "4", en: "Numbers" },
      deuteronomy: { ru: "5", en: "Deuteronomy" },    
      joshua: { ru: "6", en: "Joshua" },
      judges: { ru: "7", en: "Judges" },
      ruth: { ru: "8", en: "Ruth" },    
      "1-samuel": { ru: "9", en: "1Samuel" },
      "2-samuel": { ru: "10", en: "2Samuel" },
      "1-kings": { ru: "11", en: "1Kings" },
      "2-kings": { ru: "12", en: "2Kings" },
      "1-chronicles": { ru: "13", en: "1Chronicles" },
      "2-chronicles": { ru: "14", en: "2Chronicles" },    
      ezra: { ru: "15", en: "Ezra" },
      nehemiah: { ru: "16", en: "Nehemiah" },
      esther: { ru: "17", en: "Esther" },    
      job: { ru: "18", en: "Job" },
      psalms: { ru: "19", en: "Psalms" },
      proverbs: { ru: "20", en: "Proverbs" },
      ecclesiastes: { ru: "21", en: "Ecclesiastes" },
      "song-of-solomon": { ru: "22", en: "Song of Solomon" },    
      isaiah: { ru: "23", en: "Isaiah" },
      jeremiah: { ru: "24", en: "Jeremiah" },
      lamentations: { ru: "25", en: "Lamentations" },
      ezekiel: { ru: "26", en: "Ezekiel" },
      daniel: { ru: "27", en: "Daniel" },    
      hosea: { ru: "28", en: "Hosea" },
      joel: { ru: "39", en: "Joel" },
      amos: { ru: "30", en: "Amos" },
      obadiah: { ru: "31", en: "Obadiah" },
      jonah: { ru: "32", en: "Jonah" },
      micah: { ru: "33", en: "Micah" },
      nahum: { ru: "34", en: "Nahum" },
      habakkuk: { ru: "35", en: "Habakkuk" },
      zephaniah: { ru: "36", en: "Zephaniah" },
      haggai: { ru: "37", en: "Haggai" },
      zechariah: { ru: "38", en: "Zechariah" },
      malachi: { ru: "39", en: "Malachi" },
    
      // New Testament
      matthew: { ru: "40", en: "Matthew" },
      mark: { ru: "41", en: "Mark" },
      luke: { ru: "42", en: "Luke" },
      john: { ru: "43", en: "John" },
      acts: { ru: "44", en: "Acts" },
      james: { ru: "45", en: "James" },
      "1-peter": { ru: "46", en: "1Peter" },
      "2-peter": { ru: "47", en: "2Peter" },
      "1-john": { ru: "48", en: "1John" },
      "2-john": { ru: "49", en: "2John" },
      "3-john": { ru: "50", en: "3John" },
      jude: { ru: "51", en: "Jude" },
      romans: { ru: "52", en: "Romans" },
      "1-corinthians": { ru: "53", en: "1Corinthians" },
      "2-corinthians": { ru: "54", en: "2Corinthians" },
      galatians: { ru: "55", en: "Galatians" },
      ephesians: { ru: "56", en: "Ephesians" },
      philippians: { ru: "57", en: "Philippians" },
      colossians: { ru: "58", en: "Colossians" },
      "1-thessalonians": { ru: "59", en: "1Thessalonians" },
      "2-thessalonians": { ru: "60", en: "2Thessalonians" },
      "1-timothy": { ru: "61", en: "1Timothy" },
      "2-timothy": { ru: "62", en: "2Timothy" },
      titus: { ru: "63", en: "Titus" },
      philemon: { ru: "64", en: "Philemon" },
      hebrews: { ru: "65", en: "Hebrews" },      
      revelation: { ru: "66", en: "Revelation" }
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