function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createHelpHtml(definition, classes) {
  return `<button class="footer-help-btn ${classes.button}" type="button" aria-expanded="false" aria-label="${escapeHtml(definition.label)}">i</button><span class="footer-help-inline ${classes.inline}" hidden><span class="footer-help-box ${classes.box}"><button class="footer-help-close ${classes.close}" type="button" aria-label="${escapeHtml(definition.closeLabel)}">×</button>${escapeHtml(definition.text)}</span></span>`;
}

function findDefinitionMatches(text, definitions) {
  const matches = [];

  definitions.forEach((definition, order) => {
    const source = definition.pattern;
    const flags = source.flags.includes("g") ? source.flags : `${source.flags}g`;
    const pattern = new RegExp(source.source, flags);
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const before = match[1] || "";
      const word = match[2] || match[1] || match[0];
      const start = match.index + (match[2] ? before.length : 0);
      const end = start + word.length;

      matches.push({ start, end, definition, order });

      if (match[0] === "") pattern.lastIndex += 1;
      if (!source.flags.includes("g")) break;
    }
  });

  const selected = [];
  let lastEnd = -1;

  matches
    .sort((a, b) => a.start - b.start || a.order - b.order)
    .forEach((match) => {
      if (match.start < lastEnd) return;
      selected.push(match);
      lastEnd = match.end;
    });

  return selected;
}

function insertHelpButtons(text, definitions, classes) {
  const matches = findDefinitionMatches(text, definitions);
  let result = text;

  [...matches].reverse().forEach(({ end, definition }) => {
    result = `${result.slice(0, end)}${createHelpHtml(definition, classes)}${result.slice(end)}`;
  });

  return result;
}

function isVerseReference(verseRef, book, chapter, verse) {
  return verseRef?.book === book
    && Number(verseRef?.chapter) === chapter
    && String(verseRef?.verse) === String(verse);
}

function getVerseSpecificDefinitions(lang, verseRef) {
  if (!isVerseReference(verseRef, "Ephesians", 6, "18")) {
    return [];
  }

  if (lang === "ru") {
    return [
      {
        label: "Подробнее о слове «святых»",
        closeLabel: "Закрыть",
        text: "В Новом Завете так названы все верующие в Иисуса Христа, а не только особо почитаемые люди.",
        pattern: /(^|[^А-Яа-яЁё])(святых)(?=$|[^А-Яа-яЁё])/gi
      },
      {
        label: "Подробнее о слове «духом»",
        closeLabel: "Закрыть",
        text: "«Молиться духом» — значит молиться искренне, под руководством Святого Духа, доверяя Богу и ища Его воли.",
        pattern: /(^|[^А-Яа-яЁё])(духом)(?=$|[^А-Яа-яЁё])/gi
      }
    ];
  }

  return [
    {
      label: "More about saints",
      closeLabel: "Close",
      text: "In the New Testament, this refers to all believers in Jesus Christ, not only to specially honored individuals.",
      pattern: /\b(saints)\b/gi
    },
    {
      label: "More about praying in the Spirit",
      closeLabel: "Close",
      text: "“Praying in the Spirit” means praying sincerely, under the guidance of the Holy Spirit, trusting God and seeking His will.",
      pattern: /\b(in the Spirit)\b/gi
    }
  ];
}

const RU_COMMON_DEFINITIONS = [
  {
    label: "Подробнее о слове «тварь»",
    closeLabel: "Закрыть",
    text: "В Синодальном переводе означает «творение» или созданный Богом мир.",
    pattern: /(тварь|твари|тварью|тварей|тварею|творение)/i
  },
  {
    label: "Подробнее о слове «бремена»",
    closeLabel: "Закрыть",
    text: "Жизненные трудности, заботы и переживания, в которых мы можем поддерживать друг друга.",
    pattern: /(^|[^А-Яа-яЁё])(Бремена|бремена)/i
  },
  {
    label: "Подробнее о слове «благодать»",
    closeLabel: "Закрыть",
    text: "Незаслуженная любовь, милость и помощь Бога, которые Он дарит человеку через Иисуса Христа.",
    pattern: /(^|[^А-Яа-яЁё])(благодать|благодати|благодатью)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о слове «спасение»",
    closeLabel: "Закрыть",
    text: "Божье избавление человека от греха и смерти через Иисуса Христа.",
    pattern: /(^|[^А-Яа-яЁё])(спасение|спасения|спасению|спасением)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о слове «покаяние»",
    closeLabel: "Закрыть",
    text: "Обращение от греха к Богу с верой и желанием жить по Его воле.",
    pattern: /(^|[^А-Яа-яЁё])(покаяние|покаяния|покаянию|покаянием)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о слове «праведность»",
    closeLabel: "Закрыть",
    text: "Правильные отношения с Богом и жизнь, угодная Ему.",
    pattern: /(^|[^А-Яа-яЁё])(праведность|праведности|праведностью)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о слове «освящение»",
    closeLabel: "Закрыть",
    text: "Божья работа, через которую человек становится ближе к Богу и учится жить свято.",
    pattern: /(^|[^А-Яа-яЁё])(освящение|освящения|освящению|освящением)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о слове «завет»",
    closeLabel: "Закрыть",
    text: "Священное обещание и союз, который Бог устанавливает с людьми.",
    pattern: /(^|[^А-Яа-яЁё])(завет|завета|завету|заветом|завете)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о слове «искушение»",
    closeLabel: "Закрыть",
    text: "Испытание или побуждение ко греху, во время которого человеку особенно нужна Божья помощь.",
    pattern: /(^|[^А-Яа-яЁё])(искушение|искушения|искушению|искушением)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о слове «искупление»",
    closeLabel: "Закрыть",
    text: "Божье освобождение от греха ценой жертвы Иисуса Христа.",
    pattern: /(^|[^А-Яа-яЁё])(искупление|искупления|искуплению|искуплением)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о слове «милость»",
    closeLabel: "Закрыть",
    text: "Божье сострадание и доброта к тем, кто нуждается в Его помощи.",
    pattern: /(^|[^А-Яа-яЁё])(милость|милости|милостью)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о местоимениях с большой буквы",
    closeLabel: "Закрыть",
    text: "В Синодальном переводе некоторые местоимения пишутся с большой буквы при обращении к Богу или упоминании о Нём.",
    pattern: /(^|[^А-Яа-яЁё])(Ты|Твой|Твоя|Твоё|Твои|Тебя|Тебе|Тобой)(?=$|[^А-Яа-яЁё])/
  }
];

const RU_QUESTION_DEFINITIONS = [
  {
    label: "Подробнее о слове «напрасно»",
    closeLabel: "Закрыть",
    text: "Без уважения, легкомысленно, впустую или с ложной целью. Имя Господа не следует использовать в шутках, пустых выражениях или для обмана.",
    pattern: /(^|[^А-Яа-яЁё])(напрасно)(?=$|[^А-Яа-яЁё])/gi
  },
  {
    label: "Подробнее о слове «блажен»",
    closeLabel: "Закрыть",
    text: "В Синодальном переводе означает «счастлив» или «благословен Богом». Речь идёт о глубоком счастье, которое приходит от жизни с Богом.",
    pattern: /(Блаженны|Блажен|блаженны|блажен)/
  },
  {
    label: "Подробнее о слове «твердь»",
    closeLabel: "Закрыть",
    text: "Небесный простор, видимое небо над землёй.",
    pattern: /(^|[^А-Яа-яЁё])(твердь)(?=$|[^А-Яа-яЁё])/i
  },
  {
    label: "Подробнее о слове «тук»",
    closeLabel: "Закрыть",
    text: "Изобилие и полное удовлетворение от Божьих благословений.",
    pattern: /(^|[^А-Яа-яЁё])(туком|тук)(?=$|[^А-Яа-яЁё])/i
  }
];

const EN_COMMON_DEFINITIONS = [
  {
    label: "More about burdens",
    closeLabel: "Close",
    text: "Difficulties, cares, and struggles of life that we can help one another carry.",
    pattern: /\b(Burdens|burdens)\b/g
  },
  {
    label: "More about grace",
    closeLabel: "Close",
    text: "God’s undeserved love, mercy, and help, given to us through Jesus Christ.",
    pattern: /\b(Grace|grace)\b/g
  },
  {
    label: "More about salvation",
    closeLabel: "Close",
    text: "God’s rescue from sin and death through Jesus Christ.",
    pattern: /\b(Salvation|salvation)\b/g
  },
  {
    label: "More about repentance",
    closeLabel: "Close",
    text: "Turning from sin to God with faith and a desire to follow Him.",
    pattern: /\b(Repentance|repentance)\b/g
  },
  {
    label: "More about righteousness",
    closeLabel: "Close",
    text: "Being right with God and living in a way that pleases Him.",
    pattern: /\b(Righteousness|righteousness)\b/g
  },
  {
    label: "More about sanctification",
    closeLabel: "Close",
    text: "God’s work of making a person more holy and more like Christ.",
    pattern: /\b(Sanctification|sanctification)\b/g
  },
  {
    label: "More about covenant",
    closeLabel: "Close",
    text: "A sacred promise and relationship that God establishes with people.",
    pattern: /\b(Covenant|covenant)\b/g
  },
  {
    label: "More about temptation",
    closeLabel: "Close",
    text: "A test or pull toward sin, where we need God’s help to remain faithful.",
    pattern: /\b(Temptation|temptation)\b/g
  },
  {
    label: "More about redemption",
    closeLabel: "Close",
    text: "God’s rescue from sin through the costly sacrifice of Jesus Christ.",
    pattern: /\b(Redemption|redemption)\b/g
  },
  {
    label: "More about mercy",
    closeLabel: "Close",
    text: "God’s compassion and kindness toward those who need His help.",
    pattern: /\b(Mercy|mercy)\b/g
  }
];

const EN_QUESTION_DEFINITIONS = [
  {
    label: "More about in vain",
    closeLabel: "Close",
    text: "Without reverence, carelessly, needlessly, or for a false purpose. The LORD’s name should not be used in jokes, empty expressions, or to deceive others.",
    pattern: /\b(in vain)\b/gi
  }
];

const EN_OLD_TESTAMENT_DEFINITION = {
  label: "More about LORD",
  closeLabel: "Close",
  text: "In the Old Testament, this often represents God’s personal name, Yahweh.",
  pattern: /\b(LORD|Lord|lord)\b/g
};

export function addInlineWordHelp(text, options = {}) {
  if (!text) return "";

  const {
    lang = "ru",
    isOldTestament = false,
    includeQuestionTerms = false,
    verseRef = null,
    classes
  } = options;

  let safeText = escapeHtml(text);

  if (lang === "ru") {
    return insertHelpButtons(
      safeText,
      [
        ...RU_COMMON_DEFINITIONS,
        ...(includeQuestionTerms ? RU_QUESTION_DEFINITIONS : []),
        ...getVerseSpecificDefinitions(lang, verseRef)
      ],
      classes
    );
  }

  const definitions = [];

  if (lang === "en" && isOldTestament) {
    definitions.push(EN_OLD_TESTAMENT_DEFINITION);
  }

  if (lang === "en") {
    definitions.push(...EN_COMMON_DEFINITIONS);
  }

  if (lang === "en" && includeQuestionTerms) {
    definitions.push(...EN_QUESTION_DEFINITIONS);
  }

  definitions.push(...getVerseSpecificDefinitions(lang, verseRef));

  return insertHelpButtons(safeText, definitions, classes);
}
