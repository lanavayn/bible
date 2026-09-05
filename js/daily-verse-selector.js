(function exposeDailyVerseSelector(root) {
  const TORONTO_TIME_ZONE = "America/Toronto";
  function getTorontoParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: TORONTO_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    return Object.fromEntries(
      formatter.formatToParts(date)
        .filter(part => part.type !== "literal")
        .map(part => [part.type, part.value])
    );
  }

  function getTorontoDateKey(date = new Date()) {
    const parts = getTorontoParts(date);
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function dateKeyToUtc(dateKey) {
    const [year, month, day] = String(dateKey).split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  }

  function addDaysToDateKey(dateKey, days) {
    return new Date(dateKeyToUtc(dateKey) + Number(days) * 86400000)
      .toISOString()
      .slice(0, 10);
  }

  function getGregorianEasterDateKey(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = (h + l - 7 * m + 114) % 31 + 1;

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getEasterDateKey(dateKey) {
    const year = Number(String(dateKey).slice(0, 4));
    const easterThisYear = getGregorianEasterDateKey(year);
    const easterLastYear = getGregorianEasterDateKey(year - 1);

    return dateKey >= easterThisYear ? easterThisYear : easterLastYear;
  }

  function getDayNumberFromEaster(date = new Date()) {
    const dateKey = typeof date === "string" ? date : getTorontoDateKey(date);
    const easterDateKey = getEasterDateKey(dateKey);
    if (!easterDateKey) return null;
    return Math.floor((dateKeyToUtc(dateKey) - dateKeyToUtc(easterDateKey)) / 86400000) + 1;
  }

  function isEasterDate(dateKey) {
    return getEasterDateKey(dateKey) === dateKey;
  }

  function getReservedVerseId(slotId, dateKey, rotationConfig) {
    const assignment = rotationConfig?.reserved?.[slotId];
    const verseId = Number(assignment?.verseId);
    const activeFrom = assignment?.activeFrom;

    if (!Number.isInteger(verseId) || verseId <= 0) return null;
    if (activeFrom && dateKey < activeFrom) return null;
    return verseId;
  }

  function validateRotationConfig(rotationConfig) {
    const slots = Array.isArray(rotationConfig?.slots) ? rotationConfig.slots : [];
    const reserved = rotationConfig?.reserved && typeof rotationConfig.reserved === "object"
      ? rotationConfig.reserved
      : {};
    const verseIds = slots.filter(slot => Number.isInteger(slot));
    const reservedSlots = slots.filter(slot => typeof slot === "string");
    const duplicateVerseIds = verseIds.filter((id, index) => verseIds.indexOf(id) !== index);
    const invalidReservedSlots = reservedSlots.filter(slot => !Object.hasOwn(reserved, slot));

    return {
      valid: Boolean(rotationConfig?.rotationStartDate)
        && slots.length > 0
        && !duplicateVerseIds.length
        && !invalidReservedSlots.length,
      positionCount: slots.length,
      verseCount: verseIds.length,
      reservedCount: reservedSlots.length,
      duplicateVerseIds: [...new Set(duplicateVerseIds)],
      invalidReservedSlots
    };
  }

  function getRotationSelection(dateKey, rotationConfig) {
    const validation = validateRotationConfig(rotationConfig);
    if (!validation.valid) {
      return {
        dateKey,
        verseId: null,
        source: "rotation",
        skipReason: "rotation-config-invalid",
        validation
      };
    }

    let slotIndex = 0;
    let cursorDateKey = rotationConfig.rotationStartDate;
    const slots = rotationConfig.slots;

    while (cursorDateKey <= dateKey) {
      if (isEasterDate(cursorDateKey)) {
        if (cursorDateKey === dateKey) {
          return {
            dateKey,
            verseId: Number(rotationConfig.easterVerseId),
            source: "easter",
            slotId: null,
            rotationSlotIndex: null,
            skipReason: null
          };
        }

        cursorDateKey = addDaysToDateKey(cursorDateKey, 1);
        continue;
      }

      let selectedVerseId = null;
      let selectedSlotId = null;
      let selectedSlotIndex = null;

      for (let attempts = 0; attempts < slots.length; attempts += 1) {
        const slot = slots[slotIndex];
        const currentSlotIndex = slotIndex;
        slotIndex = (slotIndex + 1) % slots.length;

        const verseId = Number.isInteger(slot)
          ? slot
          : getReservedVerseId(slot, cursorDateKey, rotationConfig);

        if (verseId) {
          selectedVerseId = verseId;
          selectedSlotId = typeof slot === "string" ? slot : null;
          selectedSlotIndex = currentSlotIndex;
          break;
        }
      }

      if (!selectedVerseId) {
        return {
          dateKey,
          verseId: null,
          source: "rotation",
          skipReason: "rotation-no-selectable-verse",
          validation
        };
      }

      if (cursorDateKey === dateKey) {
        return {
          dateKey,
          verseId: selectedVerseId,
          source: "rotation",
          slotId: selectedSlotId,
          rotationSlotIndex: selectedSlotIndex,
          skipReason: null
        };
      }

      cursorDateKey = addDaysToDateKey(cursorDateKey, 1);
    }

    return {
      dateKey,
      verseId: null,
      source: "rotation",
      skipReason: "rotation-date-before-start"
    };
  }

  function selectDailyVerse({ date = new Date(), rotationConfig } = {}) {
    const dateKey = typeof date === "string" ? date : getTorontoDateKey(date);
    const legacyDayNumber = getDayNumberFromEaster(dateKey);

    if (!rotationConfig?.rotationStartDate || dateKey < rotationConfig.rotationStartDate) {
      return {
        dateKey,
        verseId: legacyDayNumber,
        legacyDayNumber,
        source: isEasterDate(dateKey) ? "easter" : "legacy",
        slotId: null,
        rotationSlotIndex: null,
        skipReason: legacyDayNumber ? null : "easter-date-unavailable"
      };
    }

    return {
      ...getRotationSelection(dateKey, rotationConfig),
      legacyDayNumber
    };
  }

  const api = {
    TORONTO_TIME_ZONE,
    addDaysToDateKey,
    getGregorianEasterDateKey,
    getDayNumberFromEaster,
    getTorontoDateKey,
    getTorontoParts,
    isEasterDate,
    selectDailyVerse,
    validateRotationConfig
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.DailyVerseSelector = api;
})(globalThis);
