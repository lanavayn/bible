(function(){
    // ====== CONFIG ======
    // change to:
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
      ru: { title:'📖 Стихи из Библии — слайдер', modalTitle:'Толкование', close:'Закрыть', prev:'Назад', next:'Вперёд', langLabel:'Язык',
            btnFull:'Полный текст ↗' },
      en: { title:'📖 Bible Verses — Slider',   modalTitle:'Interpretation', close:'Close',  prev:'Previous', next:'Next', langLabel:'Language',
            btnFull:'Read full ↗' }
    };
    const $ = sel => document.querySelector(sel);
    const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const isHttpUrl = u => /^https?:\/\//i.test(String(u||''));
    
        // --- add above toLangRef (book maps) ---
        const BOOKS_EN_RU = {
            // Gospels + Acts
            "Matthew":"Матфея","Mark":"Марка","Luke":"Луки","John":"Иоанна","Acts":"Деяния",
            // Paul’s letters
            "Romans":"Римлянам","1 Corinthians":"1 Коринфянам","2 Corinthians":"2 Коринфянам",
            "Galatians":"Галатам","Ephesians":"Ефесянам","Philippians":"Филиппийцам",
            "Colossians":"Колоссянам","1 Thessalonians":"1 Фессалоникийцам","2 Thessalonians":"2 Фессалоникийцам",
            "1 Timothy":"1 Тимофею","2 Timothy":"2 Тимофею","Titus":"Титу","Philemon":"Филимону",
            "Hebrews":"Евреям",
            // General letters + Revelation
            "James":"Иакова","1 Peter":"1 Петра","2 Peter":"2 Петра",
            "1 John":"1 Иоанна","2 John":"2 Иоанна","3 John":"3 Иоанна",
            "Jude":"Иуды","Revelation":"Откровение"
        };
        const BOOKS_RU_EN = Object.fromEntries(Object.entries(BOOKS_EN_RU).map(([en, ru]) => [ru, en]));
        const _reEsc = (s)=> s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        
        // --- replace your old toLangRef with this one ---
        function toLangRef(reference, lang){
            const ref = String(reference || "");
            if (!ref) return ref;
        
            // choose direction
            const map = (lang === "ru") ? BOOKS_EN_RU : BOOKS_RU_EN;
        
            // match the book at the start, prefer longest keys (e.g., "1 John" before "John")
            const keys = Object.keys(map).sort((a,b)=> b.length - a.length);
            for (const key of keys){
            const rx = new RegExp("^" + _reEsc(key) + "\\b", "i");
            if (rx.test(ref)) return ref.replace(rx, map[key]);
            }
            return ref; // fallback: leave as is
        }
  
  
    // ====== CACHE ======
    const LS_KEY = 'verses-cache-v1';
    const LS_CUR_ID = 'verses-current-id-v1';
    const LS_TTL_MS = 12 * 60 * 60 * 1000;
    function readCache(){ try{ const o=JSON.parse(localStorage.getItem(LS_KEY)||'{}'); if(o && Array.isArray(o.data) && o.ts && (Date.now()-o.ts)<LS_TTL_MS) return o.data; }catch(e){} return null; }
    function writeCache(items){ try{ localStorage.setItem(LS_KEY, JSON.stringify({data:items, ts:Date.now()})); }catch(e){} }
  
    // ====== DATA ======
    function normalizeRows(rows){
      if(!Array.isArray(rows)) throw new Error('Endpoint JSON is not an array');
      return rows.filter(r=>r && String(r.id||'').trim()!=='').map(r=>({
        id:String(r.id||'').trim(),
        reference:String(r.reference||'').trim(),
        verse_en:String(r.verse_en||''), verse_ru:String(r.verse_ru||''),
        interp_en:String(r.interp_en||''), interp_ru:String(r.interp_ru||''),
        link_en:String(r.link_en||''), link_ru:String(r.link_ru||'')
      }));
    }
    function computeLink(item, lang){
      if(lang==='ru'){ return isHttpUrl(item.link_ru) ? item.link_ru : (item.link_ru || 'https://bible.by/syn/40/8/'); }
      if (isHttpUrl(item.link_en)) return item.link_en;
      const ref = toLangRef(item.reference,'en').trim();
      return ref ? `https://www.esv.org/${encodeURIComponent(ref)}/` : 'https://www.esv.org/';
    }
    async function fetchVerses(){
      const res = await fetch(SHEETS_JSON_ENDPOINT);
      const raw = await res.text();
      if(!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}\n${raw.slice(0,200)}`);
      let data; try{ data = JSON.parse(raw);}catch(e){ throw new Error('Invalid JSON from endpoint'); }
      if (!Array.isArray(data) && data && Array.isArray(data.data)) data = data.data;
      return normalizeRows(data);
    }
  
    // ====== RENDER ======
    let swiper, cachedItems=[], slidesEl, btnRu, btnEn, statusBox, backdrop, modalText, closeModal;
    function renderShell(root){
      const t = I18N[currentLang] || I18N.ru;
      root.innerHTML = `
        <div class="verse-slider">
          <div style="display:flex; align-items:center; gap:12px;">
            <h2>${esc(t.title)}</h2>
            <div class="lang" role="group" aria-label="${esc(t.langLabel)}">
              <button id="btnRu">RU</button>
              <button id="btnEn">EN</button>
            </div>
          </div>
  
          <div id="status" class="status"></div>
  
          <div class="swiper">
            <div class="swiper-wrapper" id="slides"></div>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-prev" aria-label="${esc(t.prev)}"></div>
            <div class="swiper-button-next" aria-label="${esc(t.next)}"></div>
          </div>
  
          <div class="modal-backdrop" id="backdrop">
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
              <h3 id="modalTitle">${esc(t.modalTitle)}</h3>
              <div class="text" id="modalText"></div>
              <div style="text-align:right"><button id="closeModal" class="close">${esc(t.close)}</button></div>
            </div>
          </div>
        </div>
      `;
  
      // cache DOM
      slidesEl   = $('#slides');
      btnRu      = $('#btnRu');
      btnEn      = $('#btnEn');
      statusBox  = $('#status');
      backdrop   = $('#backdrop');
      modalText  = $('#modalText');
      closeModal = $('#closeModal');
    }
  
    function syncLangButtons(){
      btnRu.classList.toggle('active', currentLang==='ru');
      btnEn.classList.toggle('active', currentLang==='en');
      document.documentElement.setAttribute('lang', currentLang);
      // update a11y labels
      const t = I18N[currentLang] || I18N.ru;
      $('.swiper-button-prev')?.setAttribute('aria-label', t.prev);
      $('.swiper-button-next')?.setAttribute('aria-label', t.next);
      $('#modalTitle').textContent = t.modalTitle;
      closeModal.textContent = t.close;
    }
  
    function showError(html){ statusBox.innerHTML = html; statusBox.classList.add('show'); }
  
    function renderSlides(items, {keepIndex=false}={}){
      const currentId = keepIndex && swiper ? cachedItems[swiper.activeIndex]?.id : null;
      slidesEl.innerHTML = '';
      const t = I18N[currentLang] || I18N.ru;
  
      for(const item of items){
        const verse  = currentLang==='ru' ? item.verse_ru  : item.verse_en;
        const interp = currentLang==='ru' ? item.interp_ru : item.interp_en;
        const link   = computeLink(item, currentLang);
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
          <div class="ref">${esc(toLangRef(item.reference,currentLang))}</div>
          <div class="verse">${esc(verse)}</div>
          <div class="actions">
            <a class="link" target="_blank" rel="noopener" href="${esc(link)}">${esc(t.btnFull)}</a>
          </div>`;
        slidesEl.appendChild(slide);
      }
  
      if (swiper) swiper.destroy(true,true);

      swiper = new Swiper('.swiper',{
        loop:false,
        pagination:{ el:'.swiper-pagination', clickable:true },
        navigation:{ nextEl:'.swiper-button-next', prevEl:'.swiper-button-prev' },
        keyboard:{ enabled:true },
        autoHeight:true
      });
        // 1) Restore last viewed verse when not explicitly keeping the index
        if (!keepIndex) {
        const savedId = localStorage.getItem(LS_CUR_ID);
        if (savedId) {
            const idx = items.findIndex(x => x.id === savedId);
            if (idx >= 0) swiper.slideTo(idx, 0);  // no animation
        }
        }

        // 2) Save current verse id now and on every slide change
        (function saveCurrent(){
        const id = cachedItems[swiper.activeIndex]?.id;
        if (id) localStorage.setItem(LS_CUR_ID, id);
        })();
        swiper.on('slideChange', () => {
        const id = cachedItems[swiper.activeIndex]?.id;
        if (id) localStorage.setItem(LS_CUR_ID, id);
        });

      if (keepIndex && currentId){
        let idx = items.findIndex(x=>x.id===currentId); if(idx<0) idx=0;
        swiper.slideTo(idx,0);
      }
    }
  
    async function initInto(rootSelector){
        const root = document.querySelector(rootSelector);
        if (!root) return;
        
        currentLang = getInitialLang(root);
        renderShell(root);
        
        const useGlobal = root.dataset.useGlobalLang === 'true';
        if (useGlobal) {
          root.querySelector('.lang').style.display = 'none'; // hide RU/EN pills on home
        }
        syncLangButtons();
        
  
      const cached = readCache();
      if (cached){ cachedItems=cached; renderSlides(cachedItems); }
      else {
        // tiny first-paint sample to avoid blank
        cachedItems=[{id:'matt-8-19', reference:'Matthew 8:19', verse_en:'And a scribe came...', verse_ru:'Тогда один книжник...', interp_en:'Enthusiasm...', interp_ru:'Рвение...', link_en:'', link_ru:''}];
        renderSlides(cachedItems);
      }
  
      try{
        const fresh = await fetchVerses();
        cachedItems = fresh; writeCache(fresh);
        renderSlides(cachedItems, { keepIndex:true });
      }catch(err){
        showError('<b>Нет связи с Google Sheets — показан кэш/пример.</b>');
        console.warn(err);
      }
  
      // modal

      const hide=()=>{ backdrop.style.display='none'; };
      closeModal.addEventListener('click', hide);
      backdrop.addEventListener('click', e=>{ if(e.target===backdrop) hide(); });
  
      // lang
      if (!useGlobal) {
        btnRu.addEventListener('click', ()=>{ currentLang='ru'; localStorage.setItem('verses-lang', currentLang); syncLangButtons(); renderSlides(cachedItems,{keepIndex:true}); });
        btnEn.addEventListener('click', ()=>{ currentLang='en'; localStorage.setItem('verses-lang', currentLang); syncLangButtons(); renderSlides(cachedItems,{keepIndex:true}); });
      }
    }
  
    // Auto-mount into #verse-slider if present
    document.addEventListener('DOMContentLoaded', ()=> initInto('#verse-slider'));
  })();
  