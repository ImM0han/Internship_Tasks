const BACKEND_URL = "http://localhost:5000"; // backend (optional)
const IDLE_SECONDS = 60;

// internal state
let activeDomain = null;
let activeStart = Date.now();
let isWindowFocused = true;
let isIdle = false;

// ----- helpers -----
function getDomain(url) {
  try {
    const u = new URL(url);

    // ignore browser internal pages
    if (!u.hostname) return null;
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;

    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function addTime(domain, ms) {
  if (!domain || ms <= 0) return;

  const key = todayKey();
  const { usage } = await chrome.storage.local.get("usage");
  const data = usage || {};

  data[key] = data[key] || {};
  data[key][domain] = (data[key][domain] || 0) + ms;

  await chrome.storage.local.set({ usage: data });
}

async function flushTime(reason = "") {
  const now = Date.now();
  const delta = now - activeStart;

  // Only count time if window focused and user active
  if (activeDomain && isWindowFocused && !isIdle) {
    await addTime(activeDomain, delta);
  }

  activeStart = now;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs?.[0] || null;
}

async function setActiveDomainFromTab(tab) {
  const domain = getDomain(tab?.url || "");
  // flush previous slice before switching
  await flushTime("switch");

  activeDomain = domain; // can be null
  activeStart = Date.now();
}

// ----- events -----
chrome.tabs.onActivated.addListener(async () => {
  const tab = await getActiveTab();
  await setActiveDomainFromTab(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    await setActiveDomainFromTab(tab);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
  await flushTime("focus");
});

chrome.idle.setDetectionInterval(IDLE_SECONDS);
chrome.idle.onStateChanged.addListener(async (state) => {
  isIdle = state !== "active";
  await flushTime("idle");
});

// ----- alarms (MV3 reliable ticking) -----
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("tick", { periodInMinutes: 1 });
  chrome.alarms.create("sync", { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tick") {
    await flushTime("tick");
  }
  if (alarm.name === "sync") {
    await flushTime("sync");
    await syncToBackendSafe();
  }
});

// ----- backend sync (optional) -----
async function getDeviceId() {
  const { deviceId } = await chrome.storage.local.get("deviceId");
  if (deviceId) return deviceId;

  const newId = `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  await chrome.storage.local.set({ deviceId: newId });
  return newId;
}

async function syncToBackendSafe() {
  try {
    const deviceId = await getDeviceId();
    const { usage } = await chrome.storage.local.get("usage");
    if (!usage) return;

    // send last 7 days
    const dates = Object.keys(usage).sort().slice(-7);
    const payload = dates.map((date) => ({ date, sites: usage[date] }));

    await fetch(`${BACKEND_URL}/api/usage/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, payload })
    });
  } catch (e) {
    // backend down? ignore. local tracking still works.
  }
}

// initial setup
(async function init() {
  const tab = await getActiveTab();
  activeDomain = getDomain(tab?.url || "");
  activeStart = Date.now();

  // ensure alarms exist even if installed before
  chrome.alarms.create("tick", { periodInMinutes: 1 });
  chrome.alarms.create("sync", { periodInMinutes: 5 });
})();