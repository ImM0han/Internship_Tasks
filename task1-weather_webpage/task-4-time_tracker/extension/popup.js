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

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function classify(domain, rules){
  if (rules.productive.includes(domain)) return "productive";
  if (rules.unproductive.includes(domain)) return "unproductive";
  return "neutral";
}

(async function(){
  const rules = await loadRules();
  const { usage } = await chrome.storage.local.get("usage");
  const today = todayKey();
  const data = usage?.[today] || {};

  const entries = Object.entries(data).sort((a,b)=>b[1]-a[1]);

  let total = 0, prod = 0, unprod = 0;
  for (const [domain, ms] of entries){
    total += ms;
    const c = classify(domain, rules);
    if (c === "productive") prod += ms;
    if (c === "unproductive") unprod += ms;
  }

  document.getElementById("total").textContent = fmt(total);
  document.getElementById("prod").textContent = fmt(prod);
  document.getElementById("unprod").textContent = fmt(unprod);

  const top = document.getElementById("top");
  top.innerHTML = entries.slice(0,5).map(([d,ms]) =>
    `<div class="site"><span>${d}</span><b>${fmt(ms)}</b></div>`
  ).join("") || `<div class="muted">No data yet. Browse some sites 🙂</div>`;
})();
document.getElementById("openDash")?.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});