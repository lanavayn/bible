import { buildBibleLink, BOOK_MAP } from "./bibleLinks.js";
import "./bible-chronology.js";
import { addInlineWordHelp } from "./inline-word-help.js";

const categoryIcons = { joy: "😊", sadness: "😢", peace: "🕊️", anxiety: "😟" };

export async function renderHeart(root, language) {
  const lang = language === "ru" ? "ru" : "en";
  const response = await fetch("/data/heart.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`Heart data: ${response.status}`);
  const data = await response.json();
  const books = await window.BibleChronology.loadBibleBooks();
  if (!root.isConnected || root.hidden) return;

  const heading = document.createElement("h2");
  heading.textContent = lang === "ru" ? "Что ты чувствуешь?" : "How do you feel?";
  const categories = document.createElement("div");
  categories.className = "heart-categories";
  const content = document.createElement("div");
  content.className = "heart-verses text-size-content";
  const pairs = new Map();
  const buttons = [];

  for (const category of data.categories) {
    if (!pairs.has(category.pair)) {
      const pair = document.createElement("div");
      pair.className = "heart-pair";
      pairs.set(category.pair, pair);
      categories.append(pair);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dv-reopen-btn";
    const label = [categoryIcons[category.id], category[`title_${lang}`]].filter(Boolean).join(" ");
    button.textContent = label;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      for (const item of buttons) {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      }
      const title = document.createElement("h3");
      title.textContent = label;
      content.replaceChildren(title);
      const list = document.createElement("ul");
      list.className = "scripture-related-list";
      content.append(list);
      const shownDefinitions = new Set();
      for (const verse of category.verses) {
        const ref = verse[`reference_${lang}`];
        const book = window.BibleChronology.findBookInData(verse.reference_en, books);
        const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, "");
        const bookKey = Object.keys(BOOK_MAP).find(key =>
          normalize(BOOK_MAP[key].en) === normalize((book?.book_en || "").replace(/^\d+\.\s*/, "")));
        const numbers = window.BibleChronology.splitReference(ref).rest.match(/(\d+):(\d+(?:[-–]\d+)?)/);
        const verseRef = bookKey && numbers ? { book: bookKey, chapter: numbers[1], verse: numbers[2].replace("–", "-") } : null;
        const item = document.createElement("li");
        item.className = "scripture-related-item";
        const reference = document.createElement("span");
        reference.className = "scripture-related-ref";
        reference.innerHTML = window.BibleChronology.renderReference(ref, null, { lang });
        item.append(reference, document.createTextNode(" "));
        const url = buildBibleLink(verseRef, lang);
        if (url) {
          const link = document.createElement("a");
          link.className = "scripture-book-link";
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "📖";
          link.title = lang === "ru" ? "Открыть стих в Библии" : "Open verse in Bible";
          link.addEventListener("click", () => window.BibleChronology.closeOpenDetails());
          item.append(link);
        }
        const text = document.createElement("span");
        text.className = "scripture-related-text";
        text.innerHTML = addInlineWordHelp(verse[`text_${lang}`], {
          lang, verseRef, shownDefinitions, includeQuestionTerms: true,
          classes: { button: "daily-help-btn", inline: "daily-help-inline", box: "daily-help-box", close: "daily-help-close" }
        });
        item.append(document.createTextNode(" — "), text);
        list.append(item);
        const bookName = reference.querySelector(".bible-chronology-book-link");
        const openBook = () => window.BibleChronology.showReferenceDetails(ref, reference, { insertAfter: text });
        bookName?.addEventListener("click", openBook);
        bookName?.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openBook(); }
        });
      }
      content.onclick = event => {
        if (window.BibleChronology.closeFromEvent(event)) return;
        const close = event.target.closest(".daily-help-close");
        const button = event.target.closest(".daily-help-btn");
        const popup = close?.closest(".daily-help-inline") || button?.nextElementSibling;
        if (!popup) return;
        const opening = !close && popup.hidden;
        window.PopupManager?.closeAll({ except: popup });
        popup.hidden = !opening;
        popup.previousElementSibling?.setAttribute("aria-expanded", String(opening));
      };
    });
    buttons.push(button);
    pairs.get(category.pair).append(button);
  }
  root.replaceChildren(heading, categories, content);
}
