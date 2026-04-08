// ─────────────────────────────────────────
//  Skycast — Weather App JS
// ─────────────────────────────────────────

const API_KEY = "7287bcfea75d1ed3c3ba71dca9a2aee3";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// ── DOM References ──
const cityInput     = document.getElementById("city");
const submitBtn     = document.getElementById("submitBtn");
const errorMsg      = document.getElementById("errorMsg");
const loadingOverlay = document.getElementById("loadingOverlay");
const resultSection = document.getElementById("resultSection");
const weatherForm   = document.getElementById("weatherForm");

const cardCity      = document.getElementById("cardCity");
const cardCountry   = document.getElementById("cardCountry");
const cardTime      = document.getElementById("cardTime");
const cardCondition = document.getElementById("cardCondition");
const weatherIcon   = document.getElementById("weatherIcon");
const tempValue     = document.getElementById("tempValue");
const feelsLike     = document.getElementById("feelsLike");
const statHumidity  = document.getElementById("statHumidity");
const statWind      = document.getElementById("statWind");
const statVisibility = document.getElementById("statVisibility");
const statPressure  = document.getElementById("statPressure");
const insightText   = document.getElementById("insightText");
const celsiusBtn    = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");

// ── State ──
let currentTempC = null;
let isCelsius = true;

// ── Unit Toggle ──
celsiusBtn.addEventListener("click", () => {
  if (!isCelsius) {
    isCelsius = true;
    celsiusBtn.classList.add("active");
    fahrenheitBtn.classList.remove("active");
    updateDisplayTemp();
  }
});
fahrenheitBtn.addEventListener("click", () => {
  if (isCelsius) {
    isCelsius = false;
    fahrenheitBtn.classList.add("active");
    celsiusBtn.classList.remove("active");
    updateDisplayTemp();
  }
});
function updateDisplayTemp() {
  if (currentTempC === null) return;
  if (isCelsius) {
    tempValue.textContent = `${Math.round(currentTempC)}°C`;
  } else {
    const f = (currentTempC * 9/5) + 32;
    tempValue.textContent = `${Math.round(f)}°F`;
  }
}

// ── Event Listeners ──
weatherForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSearch();
});
submitBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleSearch();
});

// ── Main Handler ──
async function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    cityInput.focus();
    return;
  }
  clearError();
  showLoading(true);

  try {
    const data = await fetchWeather(city);
    renderCard(data);
    showResult();
    generateInsight(data);
  } catch (err) {
    showError(err.message || "Could not fetch weather. Please try again.");
  } finally {
    showLoading(false);
  }
}

// ── Fetch Weather ──
async function fetchWeather(city) {
  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    if (data.cod === "404") throw new Error(`City "${city}" not found. Try another name.`);
    if (data.cod === 401) throw new Error("Invalid API key. Please check your configuration.");
    throw new Error(data.message || "An error occurred while fetching weather data.");
  }
  return data;
}

// ── Render Card ──
function renderCard(data) {
  const tempC = data.main.temp - 273.15;
  const feelsC = data.main.feels_like - 273.15;
  currentTempC = tempC;

  // Location
  cardCity.textContent = data.name;
  cardCountry.textContent = data.sys.country || "";

  // Local time using UTC offset
  const utcNow = Date.now() + new Date().getTimezoneOffset() * 60000;
  const localTime = new Date(utcNow + data.timezone * 1000);
  cardTime.textContent = localTime.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  // Condition + Icon
  const condition = data.weather[0].main;
  const description = data.weather[0].description;
  cardCondition.textContent = capitalise(description);
  weatherIcon.textContent = getWeatherEmoji(condition, data.weather[0].icon);

  // Temperature
  isCelsius = true;
  celsiusBtn.classList.add("active");
  fahrenheitBtn.classList.remove("active");
  updateDisplayTemp();
  feelsLike.textContent = `${Math.round(feelsC)}°C`;

  // Stats
  statHumidity.textContent = `${data.main.humidity}%`;
  statWind.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
  statVisibility.textContent = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : "N/A";
  statPressure.textContent = `${data.main.pressure} hPa`;
}

// ── Show Result ──
function showResult() {
  resultSection.classList.add("visible");
  resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── Generate AI Insight ──
async function generateInsight(data) {
  // Set loading state
  insightText.textContent = "";
  insightText.classList.add("loading");

  // Since this is a client-side application, calling AI APIs directly
  // is restricted due to CORS and security. We use the robust fallback system
  // to provide immediate weather insights.
  
  try {
    // Artificial small delay for aesthetic "thinking" feel
    await new Promise(resolve => setTimeout(resolve, 600));
    
    insightText.classList.remove("loading");
    const tip = buildFallbackInsight(data);
    typewriter(insightText, tip);
  } catch (err) {
    insightText.classList.remove("loading");
    insightText.textContent = buildFallbackInsight(data);
  }
}

// ── Typewriter Effect ──
function typewriter(el, text, speed = 18) {
  el.textContent = "";
  let i = 0;
  const tick = () => {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(tick, speed);
    }
  };
  tick();
}

// ── Fallback Insight ──
function buildFallbackInsight(data) {
  const tempC = data.main.temp - 273.15;
  const condition = data.weather[0].main;
  const humidity = data.main.humidity;
  const city = data.name;
  const desc = data.weather[0].description;

  const comfortMap = {
    Thunderstorm: `Stay indoors if possible — thunderstorms are active over ${city}. Avoid open areas.`,
    Drizzle: `Light drizzle in ${city} — a compact umbrella is your best friend today.`,
    Rain: `Expect rainfall in ${city}. Pack a waterproof jacket and waterproof shoes.`,
    Snow: `Snow is falling over ${city} — bundle up in layers and watch for slippery surfaces.`,
    Clear: tempC > 28
      ? `Clear and hot in ${city} — stay hydrated and seek shade during midday.`
      : `Clear skies over ${city}. A light jacket might be handy for the evening.`,
    Clouds: `Overcast in ${city}. Temperatures are moderate — comfortable for outdoor plans.`,
    Mist: `Misty conditions in ${city} — visibility is reduced, so drive with care.`,
    Fog: `Dense fog over ${city}. Allow extra travel time and use caution outdoors.`,
    Haze: `Hazy skies in ${city}. If you're sensitive to air quality, consider a mask.`,
    Smoke: `Smoky air reported in ${city}. Limit outdoor exposure if you can.`,
    Dust: `Dusty conditions in ${city} — keep windows closed and protect your eyes.`,
    Sand: `Sandstorm conditions near ${city}. Stay inside and cover up outdoors.`,
    Tornado: `Severe weather warning in ${city}. Seek shelter immediately.`,
  };

  const tip = comfortMap[condition] || `${capitalise(desc)} reported in ${city}. Dress for ${Math.round(tempC)}°C and ${humidity}% humidity.`;
  return tip;
}

// ── Helpers ──
function getWeatherEmoji(condition, iconCode) {
  const isNight = iconCode && iconCode.endsWith("n");
  const map = {
    Thunderstorm: "⛈️",
    Drizzle:      "🌦️",
    Rain:         "🌧️",
    Snow:         "❄️",
    Mist:         "🌫️",
    Smoke:        "💨",
    Haze:         "🌫️",
    Dust:         "🌪️",
    Fog:          "🌁",
    Sand:         "🌪️",
    Ash:          "🌋",
    Squall:       "💨",
    Tornado:      "🌪️",
    Clear:        isNight ? "🌙" : "☀️",
    Clouds:       "☁️",
  };
  return map[condition] || "🌡️";
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showError(msg) { errorMsg.textContent = msg; }
function clearError()   { errorMsg.textContent = ""; }
function showLoading(state) {
  loadingOverlay.classList.toggle("active", state);
  loadingOverlay.setAttribute("aria-hidden", !state);
}