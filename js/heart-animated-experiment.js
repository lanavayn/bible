import { buildBibleLink, BOOK_MAP } from "./bibleLinks.js";
import { addInlineWordHelp } from "./inline-word-help.js";

export async function renderAnimatedHeart(root, language) {
  const lang = language === "ru" ? "ru" : "en";
  const response = await fetch("/data/heart.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`Heart data: ${response.status}`);
  const data = await response.json();
  const books = await window.BibleChronology.loadBibleBooks();
  if (!root.isConnected || root.hidden) return;

  const categories = data.categories || [];
  const chooser = document.createElement("section");
  chooser.className = "heart-card heart-chooser heart-experiment";
  const closeChooser = document.createElement("button");
  closeChooser.type = "button";
  closeChooser.className = "dv-close";
  closeChooser.textContent = "×";
  closeChooser.setAttribute("aria-label", lang === "ru" ? "Закрыть" : "Close");
  const heading = document.createElement("h2");
  heading.textContent = lang === "ru" ? "Что ты чувствуешь?" : "How do you feel?";
  const subtitle = document.createElement("span");
  subtitle.className = "heart-chooser-subtitle";
  subtitle.textContent = lang === "ru" ? "Листай и выбери, что на сердце" : "Choose what’s on your heart";
  heading.append(subtitle);

  const viewport = document.createElement("div");
  viewport.className = "heart-experiment-viewport";
  viewport.setAttribute("aria-label", lang === "ru" ? "Чувства" : "Feelings");
  const track = document.createElement("div");
  track.className = "heart-experiment-track";
  viewport.append(track);

  const actions = document.createElement("div");
  actions.className = "heart-experiment-actions";
  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "heart-experiment-control heart-experiment-play";
  const shuffleButton = document.createElement("button");
  shuffleButton.type = "button";
  shuffleButton.className = "heart-experiment-control";
  shuffleButton.textContent = lang === "ru" ? "🎲 Перемешать" : "🎲 Shuffle";
  actions.append(playButton, shuffleButton);
  chooser.append(closeChooser, heading, viewport, actions);

  const result = document.createElement("section");
  result.className = "heart-card heart-verses text-size-content";
  result.hidden = true;
  let order = [...categories];
  let manuallyPaused = false;
  let shuffleInProgress = false;
  let pointerGesture = null;
  let suppressDraggedClick = false;
  let selectionFrame = null;

  const updatePlayButton = () => {
    const paused = manuallyPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    playButton.textContent = paused
      ? (lang === "ru" ? "▶ Продолжить" : "▶ Resume")
      : (lang === "ru" ? "Ⅱ Пауза" : "Ⅱ Pause");
    playButton.setAttribute("aria-pressed", String(manuallyPaused));
    playButton.setAttribute("aria-label", paused
      ? (lang === "ru" ? "Анимация приостановлена" : "Animation paused")
      : (lang === "ru" ? "Приостановить движение" : "Pause movement"));
  };

  function closeResult({ resetPosition = true } = {}) {
    if (selectionFrame !== null) cancelAnimationFrame(selectionFrame);
    selectionFrame = null;
    result.hidden = true;
    result.replaceChildren();
    viewport.classList.remove("has-selection");
    chooser.classList.remove("is-focus-paused");
    chooser.classList.toggle("is-paused", manuallyPaused);
    if (resetPosition) track.style.marginLeft = "0px";
    track.querySelectorAll("[data-heart-category]").forEach(card => {
      card.classList.remove("is-active");
      card.setAttribute("aria-pressed", "false");
    });
    const url = new URL(window.location.href);
    url.searchParams.set("heart", "");
    history.replaceState(null, "", url);
  }

  function createCard(category, duplicate = false) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "heart-experiment-card dv-reopen-btn";
    card.dataset.heartCategory = category.id;
    card.style.setProperty("--heart-category-color", category.color || "#245c35");
    card.setAttribute("aria-pressed", "false");
    if (duplicate) {
      card.tabIndex = -1;
      card.setAttribute("aria-hidden", "true");
    }
    const icon = document.createElement("span");
    icon.className = "heart-category-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = category.icon || "";
    const label = document.createElement("span");
    label.textContent = category[`title_${lang}`] || "";
    card.append(icon, label);
    if (!duplicate) card.addEventListener("click", () => showResult(category));
    return card;
  }

  function renderTrack() {
    track.replaceChildren();
    for (const duplicate of [false, true]) {
      const group = document.createElement("div");
      group.className = "heart-experiment-group";
      if (duplicate) group.setAttribute("aria-hidden", "true");
      for (const category of order) group.append(createCard(category, duplicate));
      track.append(group);
    }
    track.style.animationDuration = `${Math.max(48, order.length * 5)}s`;
  }

  function showResult(category) {
    closeResult({ resetPosition: false });
    viewport.classList.add("has-selection");
    chooser.classList.add("is-paused");
    const matchingCards = track.querySelectorAll(`[data-heart-category="${CSS.escape(category.id)}"]`);
    matchingCards.forEach(card => {
      card.classList.add("is-active");
      card.setAttribute("aria-pressed", "true");
    });
    const selectedCard = [...matchingCards].find(card => card.closest(".heart-experiment-group:not([aria-hidden='true'])"));
    selectionFrame = requestAnimationFrame(() => {
      selectionFrame = null;
      if (!selectedCard?.isConnected || result.hidden) return;
      const viewportRect = viewport.getBoundingClientRect();
      const cardRect = selectedCard.getBoundingClientRect();
      const offset = viewportRect.left + viewport.clientWidth / 2 - (cardRect.left + cardRect.width / 2);
      track.style.marginLeft = `${offset}px`;
    });
    const url = new URL(window.location.href);
    url.searchParams.set("heart", category.id);
    history.replaceState(null, "", url);

    const title = document.createElement("h3");
    title.dataset.heartCategory = category.id;
    title.style.setProperty("--heart-category-color", category.color || "#245c35");
    title.textContent = [category.icon, category[`title_${lang}`]].filter(Boolean).join(" ");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "dv-close";
    close.textContent = "×";
    close.setAttribute("aria-label", lang === "ru" ? "Закрыть" : "Close");
    close.addEventListener("click", closeResult);
    const list = document.createElement("ul");
    list.className = "scripture-related-list";
    result.replaceChildren(close, title, list);

    const shownDefinitions = new Set();
    for (const verse of category.verses || []) {
      const referenceText = verse[`reference_${lang}`] || "";
      const book = window.BibleChronology.findBookInData(verse.reference_en, books);
      const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, "");
      const bookKey = Object.keys(BOOK_MAP).find(key =>
        normalize(BOOK_MAP[key].en) === normalize((book?.book_en || "").replace(/^\d+\.\s*/, "")));
      const numbers = window.BibleChronology.splitReference(referenceText).rest.match(/(\d+):(\d+(?:[-–]\d+)?)/);
      const verseRef = bookKey && numbers
        ? { book: bookKey, chapter: numbers[1], verse: numbers[2].replace("–", "-") }
        : null;
      const item = document.createElement("li");
      item.className = "scripture-related-item";
      const reference = document.createElement("span");
      reference.className = "scripture-related-ref";
      reference.innerHTML = window.BibleChronology.renderReference(referenceText, null, { lang });
      const line = document.createElement("span");
      line.className = "scripture-related-line-anchor";
      line.append(reference, document.createTextNode(" "));
      const bibleUrl = buildBibleLink(verseRef, lang);
      if (bibleUrl) {
        const link = document.createElement("a");
        link.className = "scripture-book-link";
        link.href = bibleUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "📖";
        link.title = lang === "ru" ? "Открыть стих в Библии" : "Open verse in Bible";
        link.addEventListener("click", () => window.BibleChronology.closeOpenDetails());
        line.append(link);
      }
      line.append(document.createTextNode(" — "));
      item.append(line);
      const verseText = document.createElement("span");
      verseText.className = "scripture-related-text";
      verseText.innerHTML = addInlineWordHelp(verse[`text_${lang}`] || "", {
        lang, verseRef, shownDefinitions, includeQuestionTerms: true,
        classes: { button: "daily-help-btn", inline: "daily-help-inline", box: "daily-help-box", close: "daily-help-close" }
      });
      item.append(verseText);
      list.append(item);
      const bookName = reference.querySelector(".bible-chronology-book-link");
      const openBook = () => window.BibleChronology.showReferenceDetails(referenceText, reference, { insertAfter: line });
      bookName?.addEventListener("click", openBook);
      bookName?.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openBook(); }
      });
    }
    result.onclick = event => {
      if (window.BibleChronology.closeFromEvent(event)) return;
      const closeHelp = event.target.closest(".daily-help-close");
      const helpButton = event.target.closest(".daily-help-btn");
      const popup = closeHelp?.closest(".daily-help-inline") || helpButton?.nextElementSibling;
      if (!popup) return;
      const opening = !closeHelp && popup.hidden;
      window.PopupManager?.closeAll({ except: popup });
      popup.hidden = !opening;
      popup.previousElementSibling?.setAttribute("aria-expanded", String(opening));
    };
    result.hidden = false;
  }

  closeChooser.addEventListener("click", () => {
    closeResult();
    const url = new URL(window.location.href);
    url.searchParams.delete("heart");
    history.replaceState(null, "", url);
    root.hidden = true;
    const mainButton = document.getElementById("loadHeartBtn");
    mainButton?.classList.remove("is-active");
    mainButton?.setAttribute("aria-selected", "false");
  });
  playButton.addEventListener("click", () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (manuallyPaused && !result.hidden) closeResult({ resetPosition: false });
    manuallyPaused = !manuallyPaused;
    chooser.classList.toggle("is-paused", manuallyPaused);
    updatePlayButton();
  });
  shuffleButton.addEventListener("click", async () => {
    if (shuffleInProgress) return;
    shuffleInProgress = true;
    closeResult();
    chooser.classList.add("is-paused");
    const fade = track.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
    await fade.finished.catch(() => {});
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    renderTrack();
    track.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: "both" });
    chooser.classList.toggle("is-paused", manuallyPaused);
    shuffleInProgress = false;
  });
  viewport.addEventListener("focusin", () => chooser.classList.add("is-paused", "is-focus-paused"));
  viewport.addEventListener("focusout", event => {
    if (viewport.contains(event.relatedTarget)) return;
    chooser.classList.toggle("is-paused", manuallyPaused || !result.hidden);
    chooser.classList.remove("is-focus-paused");
  });
  track.addEventListener("mouseenter", () => chooser.classList.add("is-hover-paused"));
  track.addEventListener("mouseleave", () => chooser.classList.remove("is-hover-paused"));
  viewport.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0 || shuffleInProgress) return;
    pointerGesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      dragging: false,
      cancelled: false,
      resumeAfter: !manuallyPaused
        && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    };
  });
  viewport.addEventListener("pointermove", event => {
    if (!pointerGesture || event.pointerId !== pointerGesture.pointerId) return;
    if (pointerGesture.cancelled) return;
    const deltaX = event.clientX - pointerGesture.startX;
    const deltaY = event.clientY - pointerGesture.startY;
    if (!pointerGesture.dragging) {
      if (Math.abs(deltaY) >= 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
        pointerGesture.cancelled = true;
        return;
      }
      if (Math.abs(deltaX) < 10 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      pointerGesture.dragging = true;
      pointerGesture.animation = track.getAnimations().find(animation =>
        animation.animationName === "heart-experiment-drift");
      pointerGesture.startTime = Number(pointerGesture.animation?.currentTime || 0);
      pointerGesture.period = Number(pointerGesture.animation?.effect?.getComputedTiming().duration || 0);
      pointerGesture.distance = track.querySelector(".heart-experiment-group")?.getBoundingClientRect().width || 0;
      viewport.setPointerCapture(event.pointerId);
      chooser.classList.remove("is-hover-paused");
      chooser.classList.add("is-dragging");
      if (!result.hidden) closeResult({ resetPosition: false });
    }
    event.preventDefault();
    const { animation, period, distance, startTime } = pointerGesture;
    if (!animation || !Number.isFinite(period) || !distance) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        viewport.scrollLeft = pointerGesture.startScrollLeft - deltaX;
      }
      return;
    }
    const nextTime = startTime - (deltaX / distance) * period;
    animation.currentTime = ((nextTime % period) + period) % period;
  });
  const finishPointerGesture = event => {
    if (!pointerGesture || event.pointerId !== pointerGesture.pointerId) return;
    const { dragging, cancelled, resumeAfter } = pointerGesture;
    pointerGesture = null;
    if (!dragging && !cancelled) return;
    suppressDraggedClick = true;
    requestAnimationFrame(() => { suppressDraggedClick = false; });
    if (!dragging) {
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      return;
    }
    chooser.classList.remove("is-dragging");
    if (resumeAfter && !manuallyPaused && result.hidden) {
      requestAnimationFrame(() => {
        if (manuallyPaused || !result.hidden) return;
        chooser.classList.remove("is-focus-paused", "is-hover-paused", "is-paused");
        if (viewport.matches(":hover")) viewport.classList.add("is-drag-resume");
      });
    }
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  };
  viewport.addEventListener("pointerup", finishPointerGesture);
  viewport.addEventListener("pointercancel", finishPointerGesture);
  viewport.addEventListener("lostpointercapture", finishPointerGesture);
  viewport.addEventListener("click", event => {
    if (!suppressDraggedClick) return;
    suppressDraggedClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, { capture: true });
  viewport.addEventListener("pointerleave", () => {
    viewport.classList.remove("is-drag-resume");
  });
  updatePlayButton();
  renderTrack();

  const mainButton = document.getElementById("loadHeartBtn");
  if (mainButton && !mainButton.dataset.heartRestoreBound) {
    mainButton.dataset.heartRestoreBound = "true";
    mainButton.addEventListener("click", event => {
      const heart = document.getElementById("heart");
      const selected = heart?.querySelector('[data-heart-category][aria-pressed="true"]');
      if (!heart || heart.hidden || !selected) return;
      event.stopImmediatePropagation();
      selected.click();
    }, { capture: true });
  }
  root.replaceChildren(chooser, result);
  const selectedId = new URLSearchParams(window.location.search).get("heart");
  const initial = categories.find(category => category.id === selectedId);
  if (initial) showResult(initial);
}
