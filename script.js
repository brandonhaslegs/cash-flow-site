(() => {
  const start = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const onDay = (y, m, day) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  const fmtMoney = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const money = (c) => fmtMoney.format(c / 100);
  const compact = (c) => "€" + (c >= 100000 ? `${Math.round(c / 100000)}K` : Math.round(c / 100));
  const fmtLong = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const fmtShort = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  const fmtMonth = new Intl.DateTimeFormat("en-GB", { month: "short" });

  // The example plan from the screenshots: monthly bills by due day, a salary on the 28th,
  // one freelance invoice and a trip. Projected a year ahead, plus two hidden months so the
  // last days still see the bills after them (as the app does).
  const BALANCE = 214000, DAYS = 365, EXTRA = 62, TAX = 45;
  const bills = [[135000, 1], [5800, 1], [4500, 2], [8200, 5], [3900, 8], [2400, 12], [1100, 15], [1400, 18], [5800, 20], [300, 22], [50000, 29]];
  const end = addDays(start, DAYS + EXTRA);

  const events = [];
  for (let m = new Date(start.getFullYear(), start.getMonth(), 1); m <= end; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    for (const [amount, day] of bills) events.push({ date: onDay(m.getFullYear(), m.getMonth(), day), amount: -amount });
    events.push({ date: onDay(m.getFullYear(), m.getMonth(), 28), amount: 410000 });
  }
  events.push({ date: addDays(start, 23), amount: 180000 - Math.round(180000 * TAX / 100) });
  events.push({ date: addDays(start, 31), amount: -34000 });
  events.push({ date: addDays(start, 75), amount: -380000 });

  // End-of-day balances.
  const byDay = new Map();
  for (const e of events) {
    if (e.date < start || e.date > end) continue;
    const k = e.date.getTime();
    byDay.set(k, (byDay.get(k) || 0) + e.amount);
  }
  const daily = [];
  for (let d = 0, bal = BALANCE; d <= DAYS + EXTRA; d++) {
    const day = addDays(start, d);
    bal += byDay.get(day.getTime()) || 0;
    daily.push({ day, bal });
  }

  // The most you could spend each day without the balance ever going below zero afterwards (the app's rule).
  const capacity = new Array(daily.length);
  for (let i = daily.length - 1, low = Infinity; i >= 0; i--) {
    low = Math.min(low, daily[i].bal);
    capacity[i] = Math.max(0, low);
  }
  capacity[0] = Math.max(0, Math.min(capacity[0], BALANCE));
  const shown = capacity.slice(0, DAYS + 1);
  const earliest = (amount) => {
    const i = shown.findIndex(c => c >= amount);
    return i < 0 ? null : i;
  };

  // Dial scale: logarithmic from €10 to a little past the most you could ever afford, snapping to round amounts.
  const MIN = 1000, MAX = Math.max(Math.round(Math.max(...shown) * 1.25), 50000);
  const nice = (c) => { const s = c < 10000 ? 500 : c < 100000 ? 1000 : c < 1000000 ? 5000 : 10000; return Math.max(s, Math.round(c / s) * s); };
  const priceFor = (f) => nice(MIN * Math.pow(MAX / MIN, Math.min(1, Math.max(0, f))));
  const fractionFor = (c) => c <= MIN ? 0 : Math.min(1, Math.log(c / MIN) / Math.log(MAX / MIN));

  // ---- Dial ----
  const dial = document.getElementById("dial");
  const dialSvg = document.getElementById("dial-svg");
  const input = document.getElementById("price");
  const answer = document.getElementById("answer");
  const C = 140, R = 112, START = 135, SWEEP = 270, NS = "http://www.w3.org/2000/svg";
  const polar = (deg, r = R) => [C + Math.cos(deg * Math.PI / 180) * r, C + Math.sin(deg * Math.PI / 180) * r];
  const arc = (from, to) => {
    const [x1, y1] = polar(from), [x2, y2] = polar(to);
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
  };
  let ticks = "";
  for (let i = 0; i < 28; i++) {
    const deg = START + SWEEP * i / 27, len = i % 9 === 0 ? 10 : 5;
    const [x1, y1] = polar(deg, R + 16), [x2, y2] = polar(deg, R + 16 + len);
    ticks += `<line class="tick" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  dialSvg.innerHTML = `${ticks}<path class="track" d="${arc(START, START + SWEEP)}"/><path class="progress" id="dial-progress"/><circle class="knob" id="dial-knob" r="14"/>`;
  const progress = document.getElementById("dial-progress");
  const knob = document.getElementById("dial-knob");

  let price = 250000;
  let fraction = fractionFor(price);

  function setFraction(f, fromTyping) {
    fraction = Math.min(1, Math.max(0, f));
    if (!fromTyping) {
      price = priceFor(fraction);
      input.value = money(price);
    }
    update();
  }

  function update() {
    const deg = START + SWEEP * fraction;
    progress.setAttribute("d", fraction > 0.001 ? arc(START, deg) : "");
    const [kx, ky] = polar(deg);
    knob.setAttribute("cx", kx); knob.setAttribute("cy", ky);
    const i = earliest(price);
    dial.classList.toggle("no", i === null);
    dial.setAttribute("aria-valuenow", Math.round(price / 100));
    dial.setAttribute("aria-valuetext", money(price));
    if (i === null) {
      answer.className = "answer no";
      answer.innerHTML = `Not in the next 12 months<small>Buying it would push the balance below zero.</small>`;
    } else if (i === 0) {
      answer.className = "answer";
      answer.innerHTML = `Yes, today!<small>The balance stays above zero afterwards.</small>`;
    } else {
      answer.className = "answer";
      answer.innerHTML = `Yes, on ${fmtLong.format(daily[i].day)}<small>In ${i} days. The balance stays above zero afterwards.</small>`;
    }
    draw(i);
  }

  // Drag anywhere on the ring; the middle belongs to the price field.
  let dragging = false;
  const toSvg = (e) => {
    const r = dialSvg.getBoundingClientRect();
    return [(e.clientX - r.left) * 280 / r.width, (e.clientY - r.top) * 280 / r.height];
  };
  dialSvg.addEventListener("pointerdown", (e) => {
    const [x, y] = toSvg(e);
    if (Math.abs(Math.hypot(x - C, y - C) - R) > 44) return;
    dragging = true;
    dialSvg.setPointerCapture(e.pointerId);
    dial.classList.add("dragging");
    move(e);
  });
  dialSvg.addEventListener("pointermove", (e) => { if (dragging) move(e); });
  const stop = () => { dragging = false; dial.classList.remove("dragging"); };
  dialSvg.addEventListener("pointerup", stop);
  dialSvg.addEventListener("pointercancel", stop);
  function move(e) {
    const [x, y] = toSvg(e);
    let deg = Math.atan2(y - C, x - C) * 180 / Math.PI;
    if (deg < 0) deg += 360;
    let rel = deg - START;
    if (rel < 0) rel += 360;
    let next = rel / SWEEP;
    if (next > 1) next = rel < SWEEP + (360 - SWEEP) / 2 ? 1 : 0;
    if (Math.abs(next - fraction) > 0.5) return;
    setFraction(next);
  }
  dial.addEventListener("keydown", (e) => {
    if (e.target === input) return;
    const steps = { ArrowRight: 0.01, ArrowUp: 0.01, ArrowLeft: -0.01, ArrowDown: -0.01, PageUp: 0.1, PageDown: -0.1 };
    if (e.key in steps) { setFraction(fraction + steps[e.key]); e.preventDefault(); }
    if (e.key === "Home") { setFraction(0); e.preventDefault(); }
    if (e.key === "End") { setFraction(1); e.preventDefault(); }
  });
  input.addEventListener("input", () => {
    const c = Math.round(parseFloat(input.value.replace(/[^\d.]/g, "")) * 100);
    if (c > 0) { price = c; setFraction(fractionFor(c), true); }
  });
  input.addEventListener("blur", () => { input.value = money(price); });
  document.getElementById("afford-form").addEventListener("submit", (e) => { e.preventDefault(); input.blur(); });

  // ---- "What you could spend each day" chart ----
  const svg = document.getElementById("chart");
  const W = 560, H = 220, L = 6, RM = 52, T = 22, B = 24;
  function draw(i) {
    const top0 = Math.max(Math.max(...shown), price) * 1.08;
    const step = Math.max(50000, Math.ceil(top0 / 4 / 50000) * 50000);
    const top = step * 4;
    const x = (d) => L + (W - L - RM) * d / DAYS;
    const y = (v) => T + (H - T - B) * (top - Math.min(v, top)) / top;
    let s = "";
    for (let v = 0; v <= top; v += step) {
      s += `<line class="grid" x1="${L}" x2="${W - RM}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${W - RM + 8}" y="${y(v) + 4}">${compact(v)}</text>`;
    }
    s += `<text class="axis" x="${L}" y="${H - 6}">Today</text>`;
    daily.slice(0, DAYS + 1).forEach((p, d) => {
      if (p.day.getDate() === 1 && d > 20 && p.day.getMonth() % 2 === 0) s += `<text class="axis" x="${x(d)}" y="${H - 6}">${fmtMonth.format(p.day)}</text>`;
    });
    let path = `M${x(0)},${y(shown[0])}`;
    for (let d = 1; d <= DAYS; d++) {
      if (shown[d] !== shown[d - 1]) path += `L${x(d)},${y(shown[d - 1])}L${x(d)},${y(shown[d])}`;
    }
    path += `L${x(DAYS)},${y(shown[DAYS])}`;
    s += `<path class="area" d="${path}L${x(DAYS)},${y(0)}L${x(0)},${y(0)}Z"/><path class="line" d="${path}"/>`;
    s += `<line class="price-line${i === null ? " no" : ""}" x1="${L}" x2="${W - RM}" y1="${y(price)}" y2="${y(price)}"/>`;
    if (i !== null) {
      const label = i === 0 ? "Today" : fmtShort.format(daily[i].day);
      const lw = label.length * 6.6 + 14, lx = Math.min(Math.max(x(i) - lw / 2, L), W - RM - lw);
      s += `<circle class="marker" cx="${x(i)}" cy="${y(price)}" r="6"/>`;
      s += `<rect class="tag" x="${lx}" y="${y(price) - 26}" width="${lw}" height="18" rx="9"/><text class="tag-text" x="${lx + lw / 2}" y="${y(price) - 13}">${label}</text>`;
    }
    svg.innerHTML = s;
  }

  input.value = money(price);
  setFraction(fraction);
})();

// ---- Feature vignettes: build the chart, then play each animation when it scrolls into view ----
(() => {
  const start = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const onDay = (y, m, day) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  const fmtMonth = new Intl.DateTimeFormat("en-GB", { month: "short" });
  const euros = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

  // 1. The months-ahead chart: the same example plan as the screenshots, three months from today.
  const DAYS = 92;
  const bills = [[135000, 1], [5800, 1], [4500, 2], [8200, 5], [3900, 8], [2400, 12], [1100, 15], [1400, 18], [5800, 20], [300, 22], [50000, 29]];
  const delta = new Map();
  const add = (date, amount) => { const k = date.getTime(); delta.set(k, (delta.get(k) || 0) + amount); };
  for (let m = new Date(start.getFullYear(), start.getMonth(), 1); m <= addDays(start, DAYS); m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    for (const [amount, day] of bills) add(onDay(m.getFullYear(), m.getMonth(), day), -amount);
    add(onDay(m.getFullYear(), m.getMonth(), 28), 410000);
  }
  add(addDays(start, 23), 99000);
  add(addDays(start, 31), -34000);
  // Points where the balance changes (end of day), like the app's chart.
  const pts = [];
  for (let d = 0, bal = 214000; d <= DAYS; d++) {
    const ch = delta.get(addDays(start, d).getTime());
    if (ch) bal += ch;
    if (d === 0 || ch || d === DAYS) pts.push({ d, bal });
  }

  const svg = document.getElementById("v-chart");
  if (svg) {
    const W = 520, H = 230, L = 4, R = 48, T = 12, B = 40;
    const step = 500000;
    const top = Math.max(step, Math.ceil(Math.max(...pts.map(p => p.bal)) / step) * step);
    const x = (d) => L + (W - L - R) * d / DAYS;
    const y = (v) => T + (H - T - B) * (top - v) / top;
    // Monotone cubic (Fritsch-Carlson), so the curve never overshoots a real balance.
    const P = pts.map(p => [x(p.d), y(p.bal)]);
    const n = P.length, dx = [], m = [], t = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = P[i + 1][0] - P[i][0]; m[i] = (P[i + 1][1] - P[i][1]) / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      d += `C${(P[i][0] + h).toFixed(1)},${(P[i][1] + t[i] * h).toFixed(1)} ${(P[i + 1][0] - h).toFixed(1)},${(P[i + 1][1] - t[i + 1] * h).toFixed(1)} ${P[i + 1][0].toFixed(1)},${P[i + 1][1].toFixed(1)}`;
    }
    let s = `<defs><linearGradient id="v-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>`;
    for (let v = 0; v <= top; v += step) {
      s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${W - R + 8}" y="${y(v) + 4}">${v ? `€${v / 100000}K` : "0 €"}</text>`;
    }
    s += `<text class="axis strong" x="${L + 2}" y="${H - 22}">Today</text>`;
    for (let i = 1; i <= DAYS; i++) {
      const day = addDays(start, i);
      if (day.getDate() !== 1 || i < 10) continue;
      const jan = day.getMonth() === 0;
      s += `<line class="vgrid" x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}"/>`;
      s += `<text class="axis${jan ? " strong" : ""}" x="${x(i) + 4}" y="${H - 22}">${fmtMonth.format(day)}</text>`;
      if (jan) s += `<text class="axis strong" x="${x(i) + 4}" y="${H - 8}">${day.getFullYear()}</text>`;
    }
    s += `<path class="area" d="${d}L${P[n - 1][0]},${y(0)}L${P[0][0]},${y(0)}Z"/>`;
    s += `<path class="line" pathLength="1" d="${d}"/>`;
    s += `<circle class="end" cx="${P[n - 1][0]}" cy="${P[n - 1][1]}" r="6"/>`;
    svg.innerHTML = s;
  }

  // Count numbers up from zero, in the app's money format.
  function countUp(el) {
    const target = +el.dataset.count, plus = el.hasAttribute("data-plus");
    const t0 = performance.now(), dur = 900 + Math.random() * 300;
    const tick = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur)), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
      el.textContent = (plus ? "+" : "") + euros.format(v / 100);
      if (k < 1 && el.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // 4. Sidebar: the selection pill glides from item to item while the vignette is on screen.
  const side = document.querySelector(".side");
  const pill = side?.querySelector(".pill");
  const items = side ? [...side.querySelectorAll("[data-item]")] : [];
  let sideTimer = null, sideIndex = 0;
  function select(i) {
    sideIndex = i;
    items.forEach((el, j) => el.classList.toggle("active", j === i));
    pill.style.transform = `translateY(${items[i].offsetTop}px)`;
    pill.style.height = `${items[i].offsetHeight}px`;
  }
  if (side) select(0);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const vignettes = document.querySelectorAll("[data-anim]");
  if (reduce || !("IntersectionObserver" in window)) return;

  vignettes.forEach(v => v.classList.add("armed"));
  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.intersectionRatio >= 0.35) {
        if (v.classList.contains("play")) continue;
        v.classList.add("play");
        v.querySelectorAll("[data-count]").forEach((el, i) => setTimeout(() => countUp(el), 250 + i * 160));
        if (v.classList.contains("v-side")) {
          clearInterval(sideTimer);
          select(0);
          sideTimer = setInterval(() => select((sideIndex + 1) % items.length), 1300);
        }
      } else if (e.intersectionRatio === 0) {
        // Reset once fully off screen, so it plays again next time.
        v.classList.remove("play");
        if (v.classList.contains("v-side")) clearInterval(sideTimer);
      }
    }
  }, { threshold: [0, 0.35] });
  vignettes.forEach(v => observer.observe(v));
  addEventListener("resize", () => side && select(sideIndex));
})();

// ---- Dust motes around the edges of the window (fewer on phones, where the column fills the screen) ----
(() => {
  const sky = document.querySelector(".sky");
  if (!sky) return;
  const count = innerWidth < 700 ? 24 : 70;
  const frag = document.createDocumentFragment();
  for (let made = 0; made < count; ) {
    const x = Math.random() * 100, y = Math.random() * 100;
    // Keep to the outer band: the side margins, or a thin strip at the top and bottom
    if (x > 18 && x < 82 && y > 8 && y < 92) continue;
    const m = document.createElement("span");
    m.className = "mote";
    m.style.cssText = `left:${x}%;top:${y}%;--s:${(1.5 + Math.random() * 2.5).toFixed(1)}px;--d:${(2.5 + Math.random() * 4).toFixed(1)}s;--delay:-${(Math.random() * 6).toFixed(1)}s`;
    frag.appendChild(m);
    made++;
  }
  sky.appendChild(frag);
})();
