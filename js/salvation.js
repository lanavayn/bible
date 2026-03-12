let verses = [];

const isRu = window.location.pathname.includes("/ru/");
const lang = isRu ? "ru" : "en";

const ruBookNumber = {
  "Римлянам": 52,
  "Галатам": 55,
  "Ефесянам": 56,
  "Иоанна": 43,
  "Титу": 63
};

function getBibleUrl(v) {
  if (isRu) {

    const [book, ref] = v.reference_ru.split(" ");
    const [chapter, verse] = ref.split(":");

    const bookNum = ruBookNumber[book];

    return `https://bible.by/syn/${bookNum}/${chapter}/#${verse}`;
  }
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(v.reference_en)}`;
}

function getBibleUrlFromRef(ref) {
  if (isRu) {
    const [book, chapterVerse] = ref.split(" ");
    const [chapter, verse] = chapterVerse.split(":");

    const bookNum = ruBookNumber[book];

    if (!bookNum || !chapter || !verse) return "#";

    return `https://bible.by/syn/${bookNum}/${chapter}/#${verse}`;
  }

  return "https://www.biblegateway.com/passage/?search=" + encodeURIComponent(ref);
}

const dataPath = isRu
  ? "../data/salvationData.json"
  : "data/salvationData.json";

fetch(dataPath)
  .then(response => response.json())
  .then(data => {
    verses = data.verses;
    renderVerses();
  })
  .catch(error => {
    console.error("Error loading JSON:", error);
  });

  function renderVerses() {
    const container = document.getElementById("salvation-verses");
    if (!container) return;
  
    container.innerHTML = "";
  
    verses.forEach(v => {
      const card = document.createElement("div");
      card.className = "verse-card";
  
      const topicLabel =
        v.topic === "law"
          ? (isRu ? "Закон" : "Law")
          : (isRu ? "Благодать" : "Grace");
      const topicClass =
          v.topic === "law" ? "topic-law" : "topic-grace";
      
      card.innerHTML = `
          <h3>
            <span class="${topicClass}">${topicLabel}</span>
            —
          <a href="#" class="verse-link" onclick="toggleExplanation('${v.id}'); return false;">
            ${v[`reference_${lang}`]}
          </a>

          <span class="verse-arrow" id="arrow-${v.id}">▾</span>

          <a class="bible-link" href="${getBibleUrl(v)}" target="_blank">📖</a>
            
          </h3>
        
          <p>${v[`text_${lang}`]}</p>
        
          <div id="explanation-${v.id}" class="verse-explanation"></div>
      `;
  
      container.appendChild(card);
    });
  }

function openPopup(id) {
  const verse = verses.find(v => v.id === id);
  if (!verse) return;

  const popupContent = document.getElementById("popup-content");
  if (!popupContent) return;

  let relatedHTML = "";

  if (verse.related) {
    verse.related.forEach(r => {
      relatedHTML += `<li><strong>${r[`reference_${lang}`]}</strong> — ${r[`text_${lang}`]}</li>`;
    });
  }

  popupContent.innerHTML = `
    <h3>${verse[`reference_${lang}`]}</h3>
    <p>${verse[`interpretation_${lang}`]}</p>
    <h4>${isRu ? "Другие стихи" : "Related verses"}</h4>
    <ul>${relatedHTML}</ul>
  `;

  document.getElementById("popup").style.display = "block";
}

function toggleExplanation(id) {
  const arrow = document.getElementById(`arrow-${id}`);
  const verse = verses.find(v => v.id === id);
  if (!verse) return;

  const box = document.getElementById(`explanation-${id}`);
  if (!box) return;

  const isAlreadyOpen = box.classList.contains("open");

  document.querySelectorAll('.verse-explanation').forEach(otherBox => {
    const otherId = otherBox.id.replace("explanation-", "");
    const otherArrow = document.getElementById(`arrow-${otherId}`);
    if (otherArrow) otherArrow.textContent = "▾";
    
    if (otherBox.id !== `explanation-${id}`) {
      otherBox.classList.remove("open");
      setTimeout(() => {
        otherBox.innerHTML = "";
      }, 300);
    }
  });

  if (isAlreadyOpen) {
    box.classList.remove("open");
    if (arrow) arrow.textContent = "▾";
    setTimeout(() => {
      box.innerHTML = "";
    }, 300);
    return;
  }

  let relatedHTML = "";

  if (verse.related) {
    verse.related.forEach(r => {
      relatedHTML += `
      <li>
      <strong>${r[`reference_${lang}`]}</strong>
      <a class="bible-link" href="${getBibleUrlFromRef(r[`reference_${lang}`])}" target="_blank">📖</a>
      — ${r[`text_${lang}`]}
      </li>
      `;
    });
  }

  box.innerHTML = `
    <div class="explanation-inner">
      <button
        class="explanation-close"
        onclick="toggleExplanation('${id}')"
        aria-label="${isRu ? "Закрыть" : "Close"}"
      >×</button>

      <p><strong>${isRu ? "Смысл —" : "Meaning —"}</strong> ${verse[`interpretation_${lang}`]}</p>

      <h4>${isRu ? "Другие стихи" : "Related verses"}</h4>
      <ul>${relatedHTML}</ul>
    </div>
  `;

  requestAnimationFrame(() => {
    box.classList.add("open");
    if (arrow) arrow.textContent = "▴";
  });
}