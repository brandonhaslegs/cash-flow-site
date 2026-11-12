// A/B tests. Each page load picks one variant per test at random and puts it on <html> as data-<test>="<variant>",
// so the CSS can show it. Nothing is stored on the visitor's device. ?btn=e&line=none in the URL forces variants for previews.
// GoatCounter counts page views per variant combination, plus taps on the store button.
// To add a test: add it to TESTS, style or swap content on html[data-<test>="…"], and it is counted automatically.
window.EXPERIMENTS = (() => {
  // Flip to true the day a version with the 1-month free trial is live on the App Store.
  const TRIAL_LIVE = false;
  const TESTS = {
    btn: ["b", "e"], // Store button: B "Download" pill, E "Get Future Cash →" in periwinkle.
    // Line under the button: all items, none, or just the price, the trial, or "No subscription, no ads".
    line: ["all", "none", "price", "perks", ...(TRIAL_LIVE ? ["trial"] : [])],
  };
  if (TRIAL_LIVE) document.documentElement.dataset.trial = "";
  const query = new URLSearchParams(location.search);
  const picked = {};
  for (const [test, variants] of Object.entries(TESTS)) {
    const forced = query.get(test);
    picked[test] = variants.includes(forced) ? forced : variants[Math.floor(Math.random() * variants.length)];
    document.documentElement.dataset[test] = picked[test];
  }
  const tag = Object.entries(picked).map(([t, v]) => `${t}=${v}`).join("&");

  // GoatCounter reads this before counting: the page view is recorded as e.g. "/?btn=e".
  window.goatcounter = { path: (p) => p.split("?")[0] + (tag ? "?" + tag : "") };

  // Store taps, counted as events like "tap-store?btn=e".
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".store")) return;
    window.goatcounter.count?.({ path: "tap-store" + (tag ? "?" + tag : ""), title: "Store button", event: true });
  });

  return picked;
})();
