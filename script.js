(() => {
  const start = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const onDay = (y, m, day) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  const fmtMoney = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
  const money = (c) => fmtMoney.format(c / 100);
  const fmtLong = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const fmtMonth = new Intl.DateTimeFormat("en-GB", { month: "short" });

  // The example plan from the screenshots: monthly bills by due day, a salary on the 28th, one freelance invoice.
  const BALANCE = 214000, DAYS = 90, TAX = 45;
  const bills = [[135000, 1], [5800, 1], [4500, 2], [8200, 5], [3900, 8], [2400, 12], [1100, 15], [1400, 18], [5800, 20], [300, 22], [50000, 29]];

  const events = [];
  const end = addDays(start, DAYS);
  for (let m = new Date(start.getFullYear(), start.getMonth(), 1); m <= end; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    for (const [amount, day] of bills) events.push({ date: onDay(m.getFullYear(), m.getMonth(), day), amount: -amount });
    events.push({ date: onDay(m.getFullYear(), m.getMonth(), 28), amount: 410000, income: true });
  }
  events.push({ date: addDays(start, 23), amount: 180000 - Math.round(180000 * TAX / 100), income: true });
  events.push({ date: addDays(start, 31), amount: -34000 });
  const rows = events.filter(e => e.date >= start && e.date <= end)
    .sort((a, b) => a.date - b.date || (b.income ? 1 : 0) - (a.income ? 1 : 0) || b.amount - a.amount);
  let running = BALANCE;
  for (const r of rows) { running += r.amount; r.balance = running; }

  // End-of-day balances for the chart.
  const daily = [];
  for (let d = 0, j = 0, bal = BALANCE; d <= DAYS; d++) {
    const day = addDays(start, d);
    while (j < rows.length && rows[j].date <= day) bal = rows[j++].balance;
    daily.push({ day, bal });
  }

  // Earliest day a purchase keeps every later balance at or above zero (the app's rule).
  function earliest(amount) {
    const suffix = [];
    for (let i = rows.length - 1; i >= 0; i--) suffix[i] = Math.min(rows[i].balance, suffix[i + 1] ?? Infinity);
    if (BALANCE >= amount && suffix[0] >= amount) return start;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].balance >= amount && (suffix[i + 1] ?? Infinity) >= amount) return rows[i].date;
    }
    return null;
  }

  const svg = document.getElementById("chart");
  const W = 560, H = 220, L = 6, R = 52, T = 10, B = 24;
  function draw(amount, buy) {
    const after = buy ? daily.map(p => p.day >= buy ? p.bal - amount : p.bal) : null;
    const values = daily.map(p => p.bal).concat(after || []);
    const step = 500000;
    const top = Math.max(step, Math.ceil(Math.max(...values) / step) * step);
    const bottom = Math.min(0, Math.floor(Math.min(...values) / step) * step);
    const x = (i) => L + (W - L - R) * i / DAYS;
    const y = (v) => T + (H - T - B) * (top - v) / (top - bottom);
    const line = (vals) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    let s = "";
    for (let v = bottom; v <= top; v += step) {
      s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${W - R + 8}" y="${y(v) + 4}">€${v / 100000}K</text>`;
    }
    if (bottom < 0) s += `<line class="zero" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
    s += `<text class="axis" x="${L}" y="${H - 6}">Today</text>`;
    daily.forEach((p, i) => { if (p.day.getDate() === 1 && i > 8) s += `<text class="axis" x="${x(i)}" y="${H - 6}">${fmtMonth.format(p.day)}</text>`; });
    const bal = daily.map(p => p.bal);
    s += `<path class="area" d="${line(bal)}L${x(DAYS)},${y(bottom)}L${x(0)},${y(bottom)}Z"/>`;
    s += `<path class="line" d="${line(bal)}"/>`;
    if (after) {
      const i = daily.findIndex(p => p.day >= buy);
      s += `<path class="after" d="${line(after)}"/><circle class="buy" cx="${x(i)}" cy="${y(after[i])}" r="6"/>`;
    }
    svg.innerHTML = s;
  }

  const input = document.getElementById("price");
  const answer = document.getElementById("answer");
  function update() {
    const amount = Math.round(parseFloat(input.value.replace(/[^\d.,]/g, "").replace(",", ".")) * 100);
    answer.classList.remove("no");
    if (!amount || amount <= 0) {
      answer.innerHTML = "Enter a price.";
      draw(0, null);
      return;
    }
    const day = earliest(amount);
    if (day) {
      const low = Math.min(...daily.filter(p => p.day >= day).map(p => p.bal - amount));
      answer.innerHTML = `${day.getTime() === start.getTime() ? "You can buy it today." : `You can buy it on ${fmtLong.format(day)}.`}<small>Your balance stays above ${money(low)} afterwards.</small>`;
    } else {
      answer.classList.add("no");
      answer.innerHTML = "Not in the next 90 days.<small>It would push your balance below zero.</small>";
    }
    draw(amount, day);
  }
  input.addEventListener("input", update);
  document.getElementById("afford-form").addEventListener("submit", (e) => e.preventDefault());
  update();
})();
