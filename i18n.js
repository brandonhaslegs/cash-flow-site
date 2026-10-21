// Translations. The page is written in English; visitors whose browser prefers a language listed here get it instead.
// Elements carry data-i18n (inner HTML) or data-i18n-aria (aria-label) keys.
(() => {
  const STRINGS = {
    de: {
      title: "Future Cash",
      tagline: "Sieh die Zukunft (deines Kontos)",
      metaDescription: "Sieh die Zukunft (deines Kontos). Future Cash zeigt deinen Kontostand für jeden kommenden Tag, für iPhone, iPad und Mac.",
      downloadFor: "Laden für",
      ariaDownloadIos: "Future Cash für iPhone und iPad im App Store laden",
      ariaDownloadMac: "Future Cash für Mac im Mac App Store laden",
      ariaTour: "Eine Tour durch Future Cash auf dem iPhone: Prognose-Diagramm und Zeitleiste, das Kann-ich-mir-das-leisten-Rad, dann Rechnungen, Einnahmen, Einkäufe und Reisen",
      ariaFeatures: "Funktionen",
      ariaTiles: "Frei verfügbar, Tiefster Stand und Monatlich netto",
      safeToMove: "Frei verfügbar",
      beforePayday: "bis zum nächsten Zahltag",
      lowestPoint: "Tiefster Stand",
      on22Oct: "am 22. Okt.",
      monthlyNet: "Monatlich netto",
      inOut: "4,1K € rein · 2,2K € raus",
      feature1: "<strong>Die kommenden Monate, ohne Überraschungen.</strong> Dein Kontostand aus deinen Rechnungen und Zahltagen, was du vor dem Zahltag bewegen kannst und wann du deinen tiefsten Stand erreichst.",
      ariaTimeline: "Zeitleiste der Zahlungen mit dem Kontostand danach, und eine Reise nach Lissabon daneben markiert",
      sun: "So", mon: "Mo", tue: "Di", wed: "Mi", thu: "Do",
      streaming: "Streaming", insurance: "Versicherung", cloudStorage: "Cloud-Speicher",
      lisbon: "Lissabon", income: "Einnahme", salary: "Gehalt", savings: "Sparen",
      rent: "Miete", phone: "Handy", internet: "Internet",
      feature2: "<strong>Jede Zahlung der Reihe nach.</strong> Jede Rechnung und jedes Gehalt mit dem, was danach übrig bleibt, und deine Reisen gleich daneben.",
      ariaSidebar: "Die Mac-Seitenleiste: Prognose, Kann ich mir das leisten?, Rechnungen, Einnahmen, Einkäufe und Reisen",
      forecast: "Prognose", canIAfford: "Kann ich mir das leisten?", bills: "Rechnungen",
      incomeNav: "Einnahmen", expenses: "Einkäufe", trips: "Reisen",
      feature3: "<strong>Überall, wo du bist.</strong> iPhone, iPad und Mac, synchronisiert über deine eigene iCloud.",
      affordTitle: "Kann ich mir das leisten?",
      affordIntro: "Dreh am Rad. Future Cash findet den ersten Tag, an dem du es kaufen kannst, ohne je ins Minus zu rutschen.",
      ariaPrice: "Preis",
      ariaPriceEuros: "Preis in Euro",
      dialHint: "Knopf ziehen oder tippen",
      note: "Läuft mit einem Beispielplan aus Rechnungen und Zahltagen, ab heute.",
      impressum: "Impressum",
      privacy: "Datenschutz",
      faqTitle: "Fragen",
      q1: "Ist die App mit meiner Bank verbunden?",
      a1: "Nein. Future Cash verbindet sich nie mit deiner Bank und sieht weder deine Konten noch deine Umsätze. Du trägst deinen Kontostand selbst ein und aktualisierst ihn, wann immer du die neuesten Zahlen sehen willst. Rechnungen und Zahltage wiederholen sich von selbst, meist reicht also ein kurzes Update des Kontostands.",
      q2: "Wie halte ich alles aktuell?",
      a2: "Öffne die App, tippe auf deinen Kontostand und gib ein, was deine Bank anzeigt. Wenn eine Rechnung abgeht oder Gehalt eingeht, wische darüber, um sie als bezahlt oder erhalten zu markieren. Dann verschwindet sie aus der Prognose.",
      q3: "Was bedeutet „Frei verfügbar“?",
      a3: "Der höchste Betrag, den du heute ausgeben kannst, ohne dass dein Kontostand im nächsten Jahr je unter null fällt, mit allen Rechnungen, Gehältern und geplanten Einkäufen, die du eingetragen hast.",
      q4: "Wo werden meine Daten gespeichert?",
      a4: "Auf deinen Geräten und in deinem eigenen iCloud-Konto, das iPhone, iPad und Mac synchron hält. Es gibt keine Konten, keine Server und kein Tracking. Wir können deine Daten nicht sehen.",
      q5: "Ich bin selbstständig. Was ist mit Steuern?",
      a5: "Markiere Einnahmen als freiberuflich, und Future Cash legt einen Anteil für die Steuer zurück, sodass dieses Geld nie als verfügbar zählt. Den Prozentsatz wählst du in den Einstellungen.",
      // Used by script.js
      today: "Heute",
      notInYear: "Nicht in den nächsten 12 Monaten",
      wouldGoNegative: "Der Kauf würde deinen Kontostand ins Minus bringen.",
      yesToday: "Ja, heute!",
      staysAbove: "Dein Kontostand bleibt danach über null.",
      yesOn: (date) => `Ja, am ${date}`,
      inDays: (n) => `In ${n} Tagen. Dein Kontostand bleibt danach über null.`,
    },
  };

  const english = {
    today: "Today",
    notInYear: "Not in the next 12 months",
    wouldGoNegative: "Buying it would push the balance below zero.",
    yesToday: "Yes, today!",
    staysAbove: "The balance stays above zero afterwards.",
    yesOn: (date) => `Yes, on ${date}`,
    inDays: (n) => `In ${n} days. The balance stays above zero afterwards.`,
  };

  // First preferred browser language we have, by its base code (de-AT, de-CH → de).
  const lang = (navigator.languages || [navigator.language || "en"])
    .map(l => l.toLowerCase().split("-")[0])
    .find(l => l === "en" || STRINGS[l]) || "en";
  const table = STRINGS[lang] || {};

  window.I18N = {
    lang,
    // Locale for dates and numbers: the visitor's own (keeps de-AT, de-CH details), defaulting to British English.
    locale: lang === "en" ? "en-GB" : (navigator.languages || []).find(l => l.toLowerCase().startsWith(lang)) || lang,
    t: (key) => (key in table ? table[key] : english[key]),
  };

  if (lang === "en") return;
  document.documentElement.lang = lang;
  const apply = () => {
    document.querySelectorAll("[data-i18n]").forEach(el => { if (table[el.dataset.i18n]) el.innerHTML = table[el.dataset.i18n]; });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => { if (table[el.dataset.i18nAria]) el.setAttribute("aria-label", table[el.dataset.i18nAria]); });
    const meta = document.querySelector('meta[name="description"]');
    if (meta && table.metaDescription) meta.content = table.metaDescription;
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply); else apply();
})();
