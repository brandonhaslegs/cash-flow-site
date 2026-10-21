// Picks the visitor's language from their device/browser settings (never their location) and translates the page.
// English is written in index.html; other languages come from translations.js. Elements carry data-i18n
// (inner HTML) or data-i18n-aria (aria-label) keys.
(() => {
  const TABLES = window.TRANSLATIONS || {};
  const english = {
    today: "Today",
    salary: "Salary",
    studioInvoice: "Studio invoice",
    lisbon: "Lisbon",
    flightsToLisbon: "Flights to Lisbon",
    notInYear: "Not in the next 12 months",
    wouldGoNegative: "Buying it would push the balance below zero.",
    yesToday: "Yes, today!",
    staysAbove: "The balance stays above zero afterwards.",
    yesOn: "Yes, on {date}",
    inDays: "In {n} days. The balance stays above zero afterwards.",
  };

  // Map a browser language tag to one of our tables: regional and script variants first, then the base language.
  function match(tag) {
    const t = tag.toLowerCase();
    const base = t.split("-")[0];
    if (base === "en") return "en";
    if (base === "zh") return /hant|tw|hk|mo/.test(t) ? "zh-Hant" : "zh-Hans";
    if (base === "pt") return /-pt\b/.test(t) ? "pt-PT" : "pt-BR";
    if (base === "no" || base === "nn" || base === "nb") return "nb";
    return TABLES[base] ? base : null;
  }
  const lang = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"])
    .map(match).find(Boolean) || "en";
  const table = TABLES[lang] || {};

  window.I18N = {
    lang,
    // Dates and numbers follow the page's language. The visitor's region is kept only where it speaks that
    // language (en-GB, de-AT, fr-CA…), so English on a German device shows "€13.00", never "13,00 €".
    locale: (() => {
      const tag = (navigator.languages || [navigator.language]).find(l => l && match(l) === lang) || lang;
      try {
        const loc = new Intl.Locale(tag);
        if (!loc.region) return tag;
        return new Intl.Locale("und-" + loc.region).maximize().language === loc.language ? tag : lang;
      } catch (e) { return lang; }
    })(),
    t: (key) => (key in table ? table[key] : english[key]),
    fmt: (key, values) => window.I18N.t(key).replace(/\{(\w+)\}/g, (_, k) => values[k]),
  };

  if (lang === "en") return;
  document.documentElement.lang = lang;
  if (lang === "ar" || lang === "he") document.documentElement.dir = "rtl";
  const apply = () => {
    document.querySelectorAll("[data-i18n]").forEach(el => { const v = table[el.dataset.i18n]; if (v) el.innerHTML = v; });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => { const v = table[el.dataset.i18nAria]; if (v) el.setAttribute("aria-label", v); });
    const meta = document.querySelector('meta[name="description"]');
    if (meta && table.metaDescription) meta.content = table.metaDescription;
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply); else apply();
})();

// App Store links. Apple's app links open the visitor's own country's store automatically.
// Set APP_STORE_ID once the app exists in App Store Connect (the number in its App Store URL).
(() => {
  const APP_STORE_ID = "";
  if (!APP_STORE_ID) return;
  const set = () => {
    document.querySelectorAll(".store.ios").forEach(a => a.href = `https://apps.apple.com/app/id${APP_STORE_ID}`);
    document.querySelectorAll(".store.mac").forEach(a => a.href = `https://apps.apple.com/app/id${APP_STORE_ID}?platform=mac`);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", set); else set();
})();
