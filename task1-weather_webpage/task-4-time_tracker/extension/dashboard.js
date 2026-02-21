async function loadRules() {
  const url = chrome.runtime.getURL("rules.json");
  const res = await fetch(url);
  return res.json();
}

function fmt(ms){
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function classify(domain, rules){
  if (rules.productive.includes(domain)) return "productive";
  if (rules.unproductive.includes(domain)) return "unproductive";
  return "neutral";
}

function lastNDates(n=7){
  const out = [];
  const d = new Date();
  for(let i=0;i<n;i++){
    const x = new Date(d);
    x.setDate(d.getDate()-i);
    const yyyy = x.getFullYear();
    const mm = String(x.getMonth()+1).padStart(2,"0");
    const dd = String(x.getDate()).padStart(2,"0");
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out.reverse();
}

function scoreReport(prodMs, unprodMs){
  const total = prodMs + unprodMs;
  if (total === 0) return "No tracked time yet. Browse normally and come back.";
  const pct = Math.round((prodMs / total) * 100);
  if (pct >= 70) return `Excellent week ✅ (${pct}% productive). Keep it up!`;
  if (pct >= 50) return `Good progress 👍 (${pct}% productive). Try reducing distractions a bit.`;
  return `Needs improvement ⚠️ (${pct}% productive). Consider blocking top distracting sites.`;
}

(async function(){
  const rules = await loadRules();
  const { usage } = await chrome.storage.local.get("usage");
  const dates = lastNDates(7);

  let wTotal=0, wProd=0, wUnprod=0;
  const siteAgg = {};
  const dailyRows = [];

  for (const date of dates){
    const day = usage?.[date] || {};
    let dTotal=0, dProd=0, dUnprod=0;

    for (const [domain, ms] of Object.entries(day)){
      dTotal += ms;
      siteAgg[domain] = (siteAgg[domain] || 0) + ms;

      const c = classify(domain, rules);
      if (c === "productive") dProd += ms;
      if (c === "unproductive") dUnprod += ms;
    }

    wTotal += dTotal; wProd += dProd; wUnprod += dUnprod;

    dailyRows.push({ date, dTotal, dProd, dUnprod });
  }

  document.getElementById("wTotal").textContent = fmt(wTotal);
  document.getElementById("wProd").textContent = fmt(wProd);
  document.getElementById("wUnprod").textContent = fmt(wUnprod);
  document.getElementById("report").textContent = scoreReport(wProd, wUnprod);

  const topSites = Object.entries(siteAgg).sort((a,b)=>b[1]-a[1]).slice(0,10);
  document.getElementById("topSites").innerHTML = topSites.map(([d,ms]) =>
    `<div class="site"><span>${d}</span><b>${fmt(ms)}</b></div>`
  ).join("") || `<div class="muted">No data yet.</div>`;

  document.getElementById("daily").innerHTML = dailyRows.map(r => `
    <div class="dayrow">
      <span>${r.date}</span>
      <b>${fmt(r.dTotal)}</b>
      <span class="muted">Prod: ${fmt(r.dProd)} • Unprod: ${fmt(r.dUnprod)}</span>
    </div>
  `).join("");

  document.getElementById("clear").addEventListener("click", async () => {
    if (!confirm("Reset ALL tracked data?")) return;
    await chrome.storage.local.remove("usage");
    location.reload();
  });
})();
