const form = document.getElementById("form");
const cityInput = document.getElementById("city");

const placeTitle = document.getElementById("placeTitle");
const placeMeta = document.getElementById("placeMeta");
const tzBadge = document.getElementById("tzBadge");

const tempBig = document.getElementById("tempBig");
const condEl = document.getElementById("cond");
const windEl = document.getElementById("wind");
const feelsEl = document.getElementById("feels");

const hourlyWrap = document.getElementById("hourly");
const dailyWrap = document.getElementById("daily");

const statusEl = document.getElementById("status");
const updatedEl = document.getElementById("updated");
const currentIconWrap = document.getElementById("currentIcon");

function setStatus(msg, isError = false) {
  statusEl.textContent = msg || "";
  statusEl.className = "status" + (isError ? " error" : "");
}

// Weather codes: https://open-meteo.com/en/docs
function weatherText(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Freezing drizzle",
    61: "Slight rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Slight snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm + hail",
    99: "Thunderstorm + hail",
  };
  return map[code] ?? `Code ${code}`;
}

function dayName(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function hourLabel(isoTime) {
  const d = new Date(isoTime);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/* ---------- SVG ICONS (inline) ---------- */
function svgSun() {
  return `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="currentColor" stroke-width="2"/>
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
function svgCloud() {
  return `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6 1.2A3.5 3.5 0 0 1 17.5 18H7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
function svgPartly() {
  return `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9.5 7.5a4.5 4.5 0 1 0 4.2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 9.7 1.1A3.5 3.5 0 0 1 17.5 18H7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
function svgRain() {
  return `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 14a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6 1.2A3.5 3.5 0 0 1 17.5 14H7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 17l-1 2M13 17l-1 2M17 17l-1 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
function svgStorm() {
  return `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 14a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6 1.2A3.5 3.5 0 0 1 17.5 14H7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M13 13l-3 5h3l-1 4 4-6h-3l2-3" fill="currentColor"/>
  </svg>`;
}
function svgSnow() {
  return `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 14a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6 1.2A3.5 3.5 0 0 1 17.5 14H7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 17h0M12 18h0M15 17h0" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}
function svgFog() {
  return `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 12a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6 1.2A3.5 3.5 0 0 1 17.5 12H7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M5 16h14M7 19h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function iconForCode(code) {
  if (code === 0) return svgSun();
  if (code === 1 || code === 2) return svgPartly();
  if (code === 3) return svgCloud();
  if (code === 45 || code === 48) return svgFog();
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return svgRain();
  if ([71, 73, 75, 77, 85, 86].includes(code)) return svgSnow();
  if ([95, 96, 99].includes(code)) return svgStorm();
  return svgCloud();
}

/* ---------- RENDER ---------- */
function renderHourly(times, temps, codes) {
  hourlyWrap.innerHTML = "";
  const now = Date.now();

  const upcoming = [];
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]).getTime();
    if (t >= now) upcoming.push(i);
    if (upcoming.length >= 12) break;
  }

  if (upcoming.length === 0) {
    hourlyWrap.innerHTML = `<div class="mini"><div class="left"><div class="t">—</div><div class="d">No hourly data</div></div></div>`;
    return;
  }

  for (const idx of upcoming) {
    const div = document.createElement("div");
    div.className = "mini";
    div.innerHTML = `
      <div class="left">
        <div class="t">${hourLabel(times[idx])}</div>
        <div class="d"><b>${Math.round(temps[idx])}°C</b></div>
      </div>
      <div class="wx">${iconForCode(codes?.[idx] ?? 3)}</div>
    `;
    hourlyWrap.appendChild(div);
  }
}

function renderDaily(dates, maxT, minT, codes) {
  dailyWrap.innerHTML = "";
  for (let i = 0; i < dates.length; i++) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="l">
        <div class="ico">${iconForCode(codes[i])}</div>
        <div class="txt">
          <div class="day">${dayName(dates[i])}</div>
          <div class="cond">${weatherText(codes[i])}</div>
        </div>
      </div>
      <div class="r">${Math.round(maxT[i])}° / ${Math.round(minT[i])}°C</div>
    `;
    dailyWrap.appendChild(row);
  }
}

/* ---------- API ---------- */
async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    name
  )}&count=1&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  return data.results[0];
}

async function fetchWeather(lat, lon, timezone) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("timezone", timezone || "auto");

  url.searchParams.set("current_weather", "true");
  // Include weather codes for hourly icons too:
  url.searchParams.set("hourly", "temperature_2m,weathercode");

  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weathercode");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}

function approxFeelsLike(tempC, windKmh) {
  const feels = tempC - windKmh * 0.05; // rough UI-only approximation
  return Math.round(feels);
}

async function loadCity(city) {
  setStatus("Loading weather...");
  tempBig.textContent = "--°";
  condEl.textContent = "—";
  windEl.textContent = "—";
  feelsEl.textContent = "—";
  hourlyWrap.innerHTML = "";
  dailyWrap.innerHTML = "";
  updatedEl.textContent = "—";
  currentIconWrap.innerHTML = svgCloud();

  const place = await geocodeCity(city);
  if (!place) {
    setStatus("City not found. Try another spelling.", true);
    placeTitle.textContent = "Search a city";
    tzBadge.textContent = "—";
    return;
  }

  placeTitle.textContent = `${place.name}, ${place.country}`;
  placeMeta.textContent = `Lat ${place.latitude.toFixed(2)} • Lon ${place.longitude.toFixed(2)}`;
  tzBadge.textContent = place.timezone || "auto";

  const wx = await fetchWeather(place.latitude, place.longitude, place.timezone);

  const cw = wx.current_weather;
  const temp = cw?.temperature;
  const wind = cw?.windspeed;
  const code = cw?.weathercode;

  if (typeof temp === "number") {
    tempBig.textContent = `${Math.round(temp)}°C`;
    feelsEl.textContent = `${approxFeelsLike(temp, wind ?? 0)}°C`;
  }

  condEl.textContent = weatherText(code);
  windEl.textContent = `${Math.round(wind ?? 0)} km/h`;
  currentIconWrap.innerHTML = iconForCode(code);

  renderHourly(wx.hourly.time, wx.hourly.temperature_2m, wx.hourly.weathercode);
  renderDaily(wx.daily.time, wx.daily.temperature_2m_max, wx.daily.temperature_2m_min, wx.daily.weathercode);

  updatedEl.textContent = `Updated: ${new Date().toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  setStatus("");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return setStatus("Type a city name first.", true);

  try {
    await loadCity(city);
  } catch (err) {
    console.error(err);
    setStatus("Something went wrong while fetching data. Try again.", true);
  }
});

// default for demo
loadCity("Delhi").catch(() => {});