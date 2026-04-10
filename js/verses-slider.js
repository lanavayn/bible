(function(){
  // ====== CONFIG ======
  let currentLang; // set later based on page or storage

  function getInitialLang(root){
    // if homepage asked to use global language, take it from <html lang>
    if (root?.dataset.useGlobalLang === 'true') {
      const lg = (document.documentElement.getAttribute('lang') || 'ru').toLowerCase();
      return lg.startsWith('en') ? 'en' : 'ru';
    }
    // otherwise keep the old behavior
    const saved = (localStorage.getItem('verses-lang') || '').toLowerCase();
    return saved === 'en' ? 'en' : 'ru';
  }

  const SHEETS_JSON_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw0VloBYu_8tQhC3YUp9B-wUjiq-_GQbSBYFVl_djNwRvMIBJeU6KxOlzbMcTP5b4A/exec';

  // ====== UTIL / I18N ======
  const I18N = {
    ru: {
      prev:'Назад',
      next:'Вперёд',
      langLabel:'Язык',
      btnFull:'Полный текст ↗',
      btnRelated:'Размышление + ссылки',
      reflectionLabel:'Размышление',
      relatedLabel:'См. также в Писании',
      noExtra:'Нет дополнительных данных.',
      closeLabel:'Закрыть'
    },
    en: {
      prev:'Previous',
      next:'Next',
      langLabel:'Language',
      btnFull:'Read full ↗',
      btnRelated:'Reflection + links',
      reflectionLabel:'Reflection',
      relatedLabel:'See also in Scripture',
      noExtra:'No additional data.',
      closeLabel:'Close'
    }
  };

  const $ = sel => document.querySelector(sel);
  const esc = s => String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

  const isHttpUrl = u => /^https?:\/\//i.test(String(u||''));

  // --- book maps ---
  const BOOKS_EN_RU = {
    "Matthew":"Матфея","Mark":"Марка","Luke":"Луки","John":"Иоанна","Acts":"Деяния",
    "Romans":"Римлянам","1 Corinthians":"1 Коринфянам","2 Corinthians":"2 Коринфянам",
    "Galatians":"Галатам","Ephesians":"Ефесянам","Philippians":"Филиппийцам",
    "Colossians":"Колоссянам","1 Thessalonians":"1 Фессалоникийцам","2 Thessalonians":"2 Фессалоникийцам",
    "1 Timothy":"1 Тимофею","2 Timothy":"2 Тимофею","Titus":"Титу","Philemon":"Филимону",
    "Hebrews":"Евреям",
    "James":"Иакова","1 Peter":"1 Петра","2 Peter":"2 Петра",
    "1 John":"1 Иоанна","2 John":"2 Иоанна","3 John":"3 Иоанна",
    "Jude":"Иуды","Revelation":"Откровение"
  };

  const BOOKS_RU_EN = Object.fromEntries(
    Object.entries(BOOKS_EN_RU).map(([en, ru]) => [ru, en])
  );

  const _reEsc = (s)=> s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function toLangRef(reference, lang){
    const ref = String(reference || "").trim();
    if (!ref) return ref;
  
    const normalizedRef = ref
      .replace(/^PSALM\b/i, 'Psalm')
      .replace(/^JOHN\b/i, 'John')
      .replace(/^MATTHEW\b/i, 'Matthew')
      .replace(/^LUKE\b/i, 'Luke')
      .replace(/^MARK\b/i, 'Mark');
  
    const map = (lang === "ru") ? BOOKS_EN_RU : BOOKS_RU_EN;
    const keys = Object.keys(map).sort((a,b)=> b.length - a.length);
  
    for (const key of keys){
      const rx = new RegExp("^" + _reEsc(key) + "\\b", "i");
      if (rx.test(normalizedRef)) return normalizedRef.replace(rx, map[key]);
    }
    return normalizedRef;
  }

  // ====== CACHE ======
  const LS_KEY = 'verses-cache-v1';
  const LS_CUR_ID = 'verses-current-id-v1';
  const LS_TTL_MS = 12 * 60 * 60 * 1000;

  function readCache(){
    try{
      const o = JSON.parse(localStorage.getItem(LS_KEY)||'{}');
      if(o && Array.isArray(o.data) && o.ts && (Date.now()-o.ts)<LS_TTL_MS) return o.data;
    }catch(e){}
    return null;
  }

  function writeCache(items){
    try{
      localStorage.setItem(LS_KEY, JSON.stringify({data:items, ts:Date.now()}));
    }catch(e){}
  }

  // ====== DATA ======
  function normalizeRows(rows){
    if(!Array.isArray(rows)) throw new Error('Endpoint JSON is not an array');

    return rows
      .filter(r => r && String(r.id || '').trim() !== '')
      .map(r => ({
        id: String(r.id || '').trim(),
        reference: String(r.reference || '').trim(),
        topic_en: String(r.topic_en || '').trim(),
        topic_ru: String(r.topic_ru || '').trim(),
        verse_en: String(r.verse_en || ''),
        verse_ru: String(r.verse_ru || ''),
        reflection_en: String(r.reflection_en || r.interp_en || ''),
        reflection_ru: String(r.reflection_ru || r.interp_ru || ''),
        related_en: String(r.related_en || ''),
        related_ru: String(r.related_ru || ''),
        related_links_en: String(r.related_links_en || ''),
        related_links_ru: String(r.related_links_ru || ''),
        link_en: String(r.link_en || ''),
        link_ru: String(r.link_ru || '')
      }));
  }

  function parseRelatedLinks(raw){
    return String(raw || '')
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);
  }

  function parseRelatedReferences(raw){
    return String(raw || '')
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);
  }

  function computeLink(item, lang){
    if(lang === 'ru'){
      return isHttpUrl(item.link_ru) ? item.link_ru : (item.link_ru || 'https://bible.by/syn/40/8/');
    }
    if (isHttpUrl(item.link_en)) return item.link_en;
    const ref = toLangRef(item.reference,'en').trim();
    return ref ? `https://www.esv.org/${encodeURIComponent(ref)}/` : 'https://www.esv.org/';
  }

  function getTopic(item, lang){
    return String(lang === 'ru' ? item.topic_ru : item.topic_en || '').trim();
  }

  function compactRelatedReferences(refs, links){
    const result = [];
    let i = 0;
  
    while (i < refs.length) {
      const current = refs[i];
      const next = refs[i + 1];
  
      const matchCurrent = current.match(/^(.+?)\s+(\d+):(\d+)$/);
      const matchNext = next ? next.match(/^(.+?)\s+(\d+):(\d+)$/) : null;
  
      if (
        matchCurrent &&
        matchNext &&
        matchCurrent[1] === matchNext[1] &&
        matchCurrent[2] === matchNext[2] &&
        Number(matchNext[3]) === Number(matchCurrent[3]) + 1
      ) {
        result.push({
          ref: `${matchCurrent[1]} ${matchCurrent[2]}:${matchCurrent[3]}–${matchNext[3]}`,
          href: links[i] || '#'
        });
        i += 2;
        continue;
      }
  
      result.push({
        ref: current,
        href: links[i] || '#'
      });
      i += 1;
    }
  
    return result;
  }

  function buildDetailsContent(item, lang){
    const t = I18N[lang] || I18N.ru;

    const reflection = lang === 'ru' ? item.reflection_ru : item.reflection_en;
    const relatedRaw = lang === 'ru' ? item.related_ru : item.related_en;
    const relatedLinksRaw = lang === 'ru' ? item.related_links_ru : item.related_links_en;

    const relatedRefs = parseRelatedReferences(relatedRaw);
    const relatedLinks = parseRelatedLinks(relatedLinksRaw);
    const compactRefs = compactRelatedReferences(relatedRefs, relatedLinks);

    return `
      <div class="verse-note-box">
        <div class="verse-close-row">
          <button
            class="verse-close"
            type="button"
            data-target="details-${esc(item.id)}"
            aria-label="${esc(t.closeLabel)}"
            title="${esc(t.closeLabel)}"
          >×</button>
        </div>

        ${
          reflection
            ? `
              <p class="verse-reflection">
                <strong>${esc(t.reflectionLabel)}:</strong>
                ${esc(reflection)}
              </p>
            `
            : ''
        }

        ${
          relatedRefs.length
            ? `
              <div class="verse-related-block">
                <p class="verse-related-title">
                  <strong>${esc(t.relatedLabel)}:</strong>
                </p>
                <ul class="verse-related-list">
                  ${relatedRefs.map((ref, i) => {
                    const href = relatedLinks[i] || '#';
                    return `
                      <li class="verse-related-item">
                        <a
                          class="verse-related-ref"
                          target="_blank"
                          rel="noopener"
                          href="${esc(href)}"
                        >
                          ${esc(ref)}
                        </a>
                      </li>
                    `;
                  }).join('')}
                </ul>
              </div>
            `
            : `<div>${esc(t.noExtra)}</div>`
        }
      </div>
    `;
  }

  async function fetchVerses(){
    const res = await fetch(SHEETS_JSON_ENDPOINT);
    const raw = await res.text();
    if(!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}\n${raw.slice(0,200)}`);
    let data;
    try{
      data = JSON.parse(raw);
    }catch(e){
      throw new Error('Invalid JSON from endpoint');
    }
    if (!Array.isArray(data) && data && Array.isArray(data.data)) data = data.data;
    return normalizeRows(data);
  }

  // ====== RENDER ======
  let swiper, cachedItems = [], slidesEl, btnRu, btnEn, statusBox;
  let keepDetailsOpen = false;

  function refreshVerseSliderLayout() {
    if (!swiper) return;
  
    swiper.update();
    swiper.updateSize();
    swiper.updateSlides();
    swiper.updateProgress();
    swiper.updateAutoHeight(keepDetailsOpen ? 250 : 200);
  }

  function renderShell(root){
    const t = I18N[currentLang] || I18N.ru;
    root.innerHTML = `
      <div class="verse-slider">
        <div id="status" class="status"></div>
  
        <div class="swiper">
          <div class="swiper-wrapper" id="slides"></div>
          <div class="swiper-pagination"></div>
          <div class="swiper-button-prev" aria-label="${esc(t.prev)}"></div>
          <div class="swiper-button-next" aria-label="${esc(t.next)}"></div>
        </div>
      </div>
    `;
  
    slidesEl   = $('#slides');
    statusBox  = $('#status');
  }

  function syncLangButtons(){
    document.documentElement.setAttribute('lang', currentLang);
  
    const t = I18N[currentLang] || I18N.ru;
    $('.swiper-button-prev')?.setAttribute('aria-label', t.prev);
    $('.swiper-button-next')?.setAttribute('aria-label', t.next);
  }

  function showError(html){
    if (!statusBox) return;
    statusBox.innerHTML = html;
    statusBox.classList.add('show');
  }

  function renderSlides(items, {keepIndex=false} = {}){
    const currentId = keepIndex && swiper ? cachedItems[swiper.activeIndex]?.id : null;
    slidesEl.innerHTML = '';
    const t = I18N[currentLang] || I18N.ru;

    for(const item of items) {
      const verse = currentLang === 'ru' ? item.verse_ru : item.verse_en;
      const link = computeLink(item, currentLang);
      const topic = getTopic(item, currentLang);
      const refText = toLangRef(item.reference, currentLang);
    
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      slide.innerHTML = `
        <section class="scripture-item verse-slide-item">
          ${
            topic
              ? `
                <h3 class="scripture-heading">
                  <span class="scripture-topic">${esc(topic)} —</span>
                  <span class="scripture-topic">${esc(refText)}</span>
                  ${
                    link
                      ? `<a class="scripture-book-link main-book-link"
                           href="${esc(link)}"
                           target="_blank"
                           rel="noopener noreferrer"
                           data-tooltip="${esc(currentLang === 'ru' ? 'Открыть в Библии' : 'Open in Bible')}"
                           aria-label="${esc(currentLang === 'ru' ? 'Открыть в Библии' : 'Open in Bible')}"
                           title="${esc(currentLang === 'ru' ? 'Открыть в Библии' : 'Open in Bible')}">
                           <span class="book-icon">&#128214;</span>
                         </a>`
                      : ''
                  }
                </h3>
              `
              : `
                <div class="ref-row">
                  <div class="ref">${esc(refText)}</div>
                  ${
                    link
                      ? `<a class="scripture-book-link main-book-link"
                           href="${esc(link)}"
                           target="_blank"
                           rel="noopener noreferrer"
                           data-tooltip="${esc(currentLang === 'ru' ? 'Открыть в Библии' : 'Open in Bible')}"
                           aria-label="${esc(currentLang === 'ru' ? 'Открыть в Библии' : 'Open in Bible')}"
                           title="${esc(currentLang === 'ru' ? 'Открыть в Библии' : 'Open in Bible')}">
                           <span class="book-icon">&#128214;</span>
                         </a>`
                      : ''
                  }
                </div>
              `
          }
    
          <div class="verse">${esc(verse)}</div>
    
          <div class="actions">
            <button
              type="button"
              class="related-btn"
              data-id="${esc(item.id)}"
              data-target="details-${esc(item.id)}"
            >
              ${esc(t.btnRelated)}
            </button>
          </div>
    
          <div
            class="verse-details"
            id="details-${esc(item.id)}"
            style="display:${keepDetailsOpen ? 'block' : 'none'};"
          >
            ${buildDetailsContent(item, currentLang)}
          </div>
        </section>
      `;
      slidesEl.appendChild(slide);
    }

    if (swiper) swiper.destroy(true, true);

    swiper = new Swiper('.swiper', {
      loop: false,
      speed: 380,
      spaceBetween: 16,
      grabCursor: true,
      centeredSlides: false,
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      keyboard: {
        enabled: true
      },
      autoHeight: true
    });

    if (!keepIndex) {
      const savedId = localStorage.getItem(LS_CUR_ID);
      if (savedId) {
        const idx = items.findIndex(x => x.id === savedId);
        if (idx >= 0) swiper.slideTo(idx, 0);
      }
    }

    (function saveCurrent(){
      const id = cachedItems[swiper.activeIndex]?.id;
      if (id) localStorage.setItem(LS_CUR_ID, id);
    })();

    swiper.on('slideChange', () => {
      const id = cachedItems[swiper.activeIndex]?.id;
      if (id) localStorage.setItem(LS_CUR_ID, id);
    
      const activeItem = cachedItems[swiper.activeIndex];
      if (!activeItem) return;
    
      const activeDetails = document.getElementById(`details-${activeItem.id}`);
      if (activeDetails) {
        activeDetails.style.display = keepDetailsOpen ? 'block' : 'none';
      }
    
      swiper.updateAutoHeight(keepDetailsOpen ? 250 : 200);
    });

    if (keepIndex && currentId){
      let idx = items.findIndex(x => x.id === currentId);
      if(idx < 0) idx = 0;
      swiper.slideTo(idx, 0);
    }

    slidesEl.querySelectorAll('.related-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        toggleVerseDetails(targetId);
      });
    });

    slidesEl.querySelectorAll('.verse-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        closeVerseDetails(targetId);
      });
    });
  }

  function toggleVerseDetails(targetId){
    const target = document.getElementById(targetId);
    if (!target) return;

    const isOpen = target.style.display === 'block';

    document.querySelectorAll('.verse-details').forEach(el => {
      el.style.display = 'none';
    });

    if (!isOpen) {
      keepDetailsOpen = true;
      target.style.display = 'block';
      if (swiper) swiper.updateAutoHeight(250);
      scrollToVerseDetails(target);
    } else {
      keepDetailsOpen = false;
      if (swiper) swiper.updateAutoHeight(200);
    }
  }

  function closeVerseDetails(targetId){
    const target = document.getElementById(targetId);
    if (!target) return;
    target.style.display = 'none';
    keepDetailsOpen = false;
    if (swiper) swiper.updateAutoHeight(200);
  }

  function scrollToVerseDetails(detailsEl){
    const slide = detailsEl.closest('.swiper-slide') || detailsEl;

    requestAnimationFrame(() => {
      const rect = slide.getBoundingClientRect();
      const absoluteTop = window.pageYOffset + rect.top;
      const offset = 80;

      window.scrollTo({
        top: Math.max(absoluteTop - offset, 0),
        behavior: 'smooth'
      });
    });
  }

  async function initInto(rootSelector){
    const root = document.querySelector(rootSelector);
    if (!root) return;

    currentLang = getInitialLang(root);
    renderShell(root);

    syncLangButtons();

    const cached = readCache();
    if (cached){
      cachedItems = cached;
      renderSlides(cachedItems);
    } else {
      cachedItems = [{
        id:'matt-8-19',
        topic_en:'Following Jesus',
        topic_ru:'Следование за Иисусом',
        reference:'Matthew 8:19',
        verse_en:'And a scribe came up and said to him, “Teacher, I will follow you wherever you go.”',
        verse_ru:'Тогда один книжник, подойдя, сказал Ему: Учитель! я пойду за Тобою, куда бы Ты ни пошел.',
        reflection_en:'A quick response to Jesus is not always the same as true discipleship.',
        reflection_ru:'Быстрый отклик на призыв Иисуса — не всегда то же самое, что настоящее ученичество.',
        related_en:'Luke 9:57; John 6:66',
        related_ru:'Луки 9:57; Иоанна 6:66',
        related_links_en:'https://www.esv.org/Luke%209:57/; https://www.esv.org/John%206:66/',
        related_links_ru:'https://bible.by/syn/42/9/#57; https://bible.by/syn/43/6/#66',
        link_en:'',
        link_ru:''
      }];
      renderSlides(cachedItems);
    }

    try{
      const fresh = await fetchVerses();
      cachedItems = fresh;
      writeCache(fresh);
      renderSlides(cachedItems, { keepIndex:true });
    }catch(err){
      showError('<b>Нет связи с Google Sheets — показан кэш/пример.</b>');
      console.warn(err);
    }

  }

  document.addEventListener('verseSliderOpened', () => {
    setTimeout(() => {
      refreshVerseSliderLayout();
    }, 50);
  });

  // Auto-mount into #verse-slider if present
  document.addEventListener('DOMContentLoaded', ()=> initInto('#verse-slider'));
})();