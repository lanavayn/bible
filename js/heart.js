import { buildBibleLink, BOOK_MAP } from "./bibleLinks.js";
import "./bible-chronology.js";
import { addInlineWordHelp } from "./inline-word-help.js";

export async function renderHeart(root, language) {
  const lang = language === "ru" ? "ru" : "en";
  const response = await fetch("/data/heart.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`Heart data: ${response.status}`);
  const data = await response.json();
  const books = await window.BibleChronology.loadBibleBooks();
  if (!root.isConnected || root.hidden) return;

  const heading = document.createElement("h2");
  heading.textContent = lang === "ru" ? "Что ты чувствуешь?" : "How do you feel?";
  const subtitle = document.createElement("span");
  subtitle.className = "heart-chooser-subtitle";
  subtitle.textContent = lang === "ru"
    ? "Выбери то, что на твоем сердце"
    : "Choose what’s on your heart";
  heading.append(subtitle);
  const categories = document.createElement("div");
  categories.className = "heart-categories";
  const chooser = document.createElement("div");
  chooser.className = "heart-card heart-chooser";
  chooser.append(heading, categories);
  const content = document.createElement("div");
  content.className = "heart-card heart-verses text-size-content";
  content.hidden = true;
  const pairs = new Map();
  const buttons = [];
  let slideIndex = 0;
  const slides = [];
  const dots = [];
  const controls = document.createElement("div");
  controls.className = "heart-slider-controls";
  const previous = document.createElement("button");
  const next = document.createElement("button");
  const pagination = document.createElement("div");
  pagination.className = "heart-slider-dots";
  for (const [button, label, symbol] of [
    [previous, lang === "ru" ? "Предыдущая пара" : "Previous pair", "‹"],
    [next, lang === "ru" ? "Следующая пара" : "Next pair", "›"]
  ]) {
    button.type = "button";
    button.className = "heart-slider-arrow";
    button.setAttribute("aria-label", label);
    button.textContent = symbol;
  }
  controls.append(previous, pagination, next);
  const slider = document.createElement("div");
  slider.className = "heart-slider";
  slider.append(categories, controls);
  chooser.append(slider);

  function showSlide(index) {
    slideIndex = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach((slide, i) => { slide.hidden = i !== slideIndex; });
    dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === slideIndex)));
    previous.disabled = slideIndex === 0;
    next.disabled = slideIndex >= slides.length - 1;
  }
  previous.addEventListener("click", () => showSlide(slideIndex - 1));
  next.addEventListener("click", () => showSlide(slideIndex + 1));
  let touchStart = null;
  let suppressClick = false;
  categories.addEventListener("touchstart", event => {
    suppressClick = false;
    touchStart = event.touches.length === 1 && !chooser.classList.contains("is-collapsed")
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  categories.addEventListener("touchend", event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      suppressClick = true;
      showSlide(slideIndex + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });
  categories.addEventListener("touchcancel", () => { touchStart = null; });
  categories.addEventListener("click", event => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, { capture: true });

  function closeCategory() {
    chooser.classList.remove("is-collapsed");
    const selected = buttons.find(button => button.getAttribute("aria-pressed") === "true");
    content.hidden = true;
    content.replaceChildren();
    for (const button of buttons) {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    }
    const url = new URL(window.location.href);
    url.searchParams.set("heart", "");
    history.replaceState(null, "", url);
    selected?.focus();
  }

  for (const category of data.categories) {
    if (!pairs.has(category.pair)) {
      const pair = document.createElement("div");
      pair.className = "heart-pair";
      pairs.set(category.pair, pair);
      const index = slides.length;
      slides.push(pair);
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `${lang === "ru" ? "Пара" : "Pair"} ${index + 1}`);
      dot.addEventListener("click", () => showSlide(index));
      dots.push(dot);
      pagination.append(dot);
      categories.append(pair);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.heartCategory = category.id;
    button.className = "dv-reopen-btn";
    const color = category.color || "#245c35";
    button.style.setProperty("--heart-category-color", color);
    const label = [category.icon, category[`title_${lang}`]].filter(Boolean).join(" ");
    const icon = document.createElement("span");
    icon.className = "heart-category-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = category.icon || "";
    const buttonTitle = document.createElement("span");
    buttonTitle.textContent = category[`title_${lang}`];
    button.append(icon, buttonTitle);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") {
        closeCategory();
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.set("heart", category.id);
      showSlide(slides.indexOf(pairs.get(category.pair)));
      history.replaceState(null, "", url);
      for (const item of buttons) {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      }
      const title = document.createElement("h3");
      title.dataset.heartCategory = category.id;
      title.style.setProperty("--heart-category-color", color);
      title.textContent = label;
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "dv-close";
      closeButton.textContent = "×";
      closeButton.setAttribute("aria-label", lang === "ru" ? "Закрыть" : "Close");
      closeButton.addEventListener("click", closeCategory);
      content.replaceChildren(closeButton, title);
      content.hidden = false;
      chooser.classList.add("is-collapsed");
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
      requestAnimationFrame(() => {
        if (!window.matchMedia("(max-width: 480px)").matches
          || !root.isConnected || root.hidden || content.hidden
          || button.getAttribute("aria-pressed") !== "true") return;
        const header = document.querySelector(".top-bar");
        const inset = (header?.getBoundingClientRect().height || 0) + 24;
        const top = button.getBoundingClientRect().top;
        if (top < inset || content.getBoundingClientRect().top > window.innerHeight - 120) {
          window.scrollTo({
            top: Math.max(0, window.scrollY + top - inset),
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
          });
        }
      });
    });
    buttons.push(button);
    pairs.get(category.pair).append(button);
  }
  showSlide(0);
  controls.hidden = slides.length < 2;
  root.replaceChildren(chooser, content);
  const mainButton = document.getElementById("loadHeartBtn");
  if (mainButton && !mainButton.dataset.heartRestoreBound) {
    mainButton.dataset.heartRestoreBound = "true";
    mainButton.addEventListener("click", event => {
      const heart = document.getElementById("heart");
      const selected = heart?.querySelector('[data-heart-category][aria-pressed="true"]');
      if (!heart || heart.hidden || !selected) return;
      // Restore through the existing toggle before the homepage reload handler.
      event.stopImmediatePropagation();
      selected.click();
    }, { capture: true });
  }
  const selectedCategory = new URLSearchParams(window.location.search).get("heart");
  buttons.find(button => button.dataset.heartCategory === selectedCategory)?.click();
}
