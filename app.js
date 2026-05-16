const API_GEO = "https://geocoding-api.open-meteo.com/v1/search";
const API_WEATHER = "https://api.open-meteo.com/v1/forecast";

// --- State ---
let state = {
  location: null, // { lat, lon, name }
  weather: null,
  settings: {
    tempUnit: localStorage.getItem('tempUnit') || 'celsius',
    windUnit: localStorage.getItem('windUnit') || 'kmh',
    precipUnit: localStorage.getItem('precipUnit') || 'mm',
    anthropicKey: localStorage.getItem('anthropicKey') || ''
  }
};

// --- DOM Elements ---
const els = {
  searchInput: document.getElementById('search-input'),
  searchResults: document.getElementById('search-results'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  closeSettingsBtn: document.getElementById('close-settings-modal'),
  dashboard: document.getElementById('dashboard'),
  loadingState: document.getElementById('loading-state'),
  
  // Current
  locationName: document.getElementById('location-name'),
  currentTemp: document.getElementById('current-temp'),
  currentDesc: document.getElementById('current-desc'),
  weatherIcon: document.getElementById('weather-icon'),
  currentHumidity: document.getElementById('current-humidity'),
  currentWind: document.getElementById('current-wind'),
  currentUv: document.getElementById('current-uv'),
  anomalyBadge: document.getElementById('anomaly-badge'),

  // Nowcast
  nowcastSection: document.getElementById('nowcast-section'),
  nowcastTitle: document.getElementById('nowcast-title'),
  nowcastDesc: document.getElementById('nowcast-desc'),
  nowcastTimeline: document.getElementById('nowcast-timeline'),

  // AI
  aiBriefing: document.getElementById('ai-content'),

  // Activities
  activityChips: document.getElementById('activity-chips'),
  activityModal: document.getElementById('activity-modal'),
  closeActivityBtn: document.getElementById('close-activity-modal'),

  // Forecast
  hourlyList: document.getElementById('hourly-list'),
  dailyList: document.getElementById('daily-list'),
};

// --- Init ---
function init() {
  bindEvents();
  loadSettings();
  
  // Get location
  const savedLoc = localStorage.getItem('location');
  if (savedLoc) {
    state.location = JSON.parse(savedLoc);
    fetchWeather();
  } else {
    navigator.geolocation.getCurrentPosition(
      pos => {
        state.location = { lat: pos.coords.latitude, lon: pos.coords.longitude, name: "Current Location" };
        fetchWeather();
      },
      () => {
        // Fallback to London
        state.location = { lat: 51.5085, lon: -0.1257, name: "London" };
        fetchWeather();
      }
    );
  }
  
  initCanvas();
}

function bindEvents() {
  let timeout;
  els.searchInput.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => searchCity(e.target.value), 500);
  });

  els.settingsBtn.addEventListener('click', () => els.settingsModal.classList.remove('hidden'));
  els.closeSettingsBtn.addEventListener('click', () => els.settingsModal.classList.add('hidden'));

  document.getElementById('temp-unit-select').addEventListener('change', e => updateSetting('tempUnit', e.target.value));
  document.getElementById('wind-unit-select').addEventListener('change', e => updateSetting('windUnit', e.target.value));
  document.getElementById('precip-unit-select').addEventListener('change', e => updateSetting('precipUnit', e.target.value));
  
  document.getElementById('save-key-btn').addEventListener('click', () => {
    updateSetting('anthropicKey', document.getElementById('anthropic-key-input').value);
    els.settingsModal.classList.add('hidden');
    generateAiBriefing();
  });

  els.closeActivityBtn.addEventListener('click', () => els.activityModal.classList.add('hidden'));
}

function loadSettings() {
  document.getElementById('temp-unit-select').value = state.settings.tempUnit;
  document.getElementById('wind-unit-select').value = state.settings.windUnit;
  document.getElementById('precip-unit-select').value = state.settings.precipUnit;
  document.getElementById('anthropic-key-input').value = state.settings.anthropicKey;
}

function updateSetting(key, value) {
  state.settings[key] = value;
  localStorage.setItem(key, value);
  if (key !== 'anthropicKey') {
    if (state.location) fetchWeather();
  }
}

// --- API Calls ---
async function searchCity(query) {
  if (!query) {
    els.searchResults.classList.add('hidden');
    return;
  }
  const res = await fetch(`${API_GEO}?name=${query}&count=5`);
  const data = await res.json();
  els.searchResults.innerHTML = '';
  if (data.results) {
    data.results.forEach(city => {
      const li = document.createElement('li');
      li.textContent = `${city.name}, ${city.country || ''}`;
      li.addEventListener('click', () => {
        state.location = { lat: city.latitude, lon: city.longitude, name: city.name };
        localStorage.setItem('location', JSON.stringify(state.location));
        els.searchResults.classList.add('hidden');
        els.searchInput.value = '';
        fetchWeather();
      });
      els.searchResults.appendChild(li);
    });
    els.searchResults.classList.remove('hidden');
  }
}

async function fetchWeather() {
  els.loadingState.classList.remove('hidden');
  els.dashboard.classList.add('hidden');
  els.locationName.textContent = state.location.name;

  const params = new URLSearchParams({
    latitude: state.location.lat,
    longitude: state.location.lon,
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
    hourly: "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max",
    minutely_15: "precipitation,precipitation_probability",
    temperature_unit: state.settings.tempUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
    wind_speed_unit: state.settings.windUnit === 'mph' ? 'mph' : state.settings.windUnit === 'ms' ? 'ms' : 'kmh',
    precipitation_unit: state.settings.precipUnit === 'inch' ? 'inch' : 'mm',
    timezone: "auto"
  });

  try {
    const res = await fetch(`${API_WEATHER}?${params}`);
    const data = await res.json();
    state.weather = data;
    renderDashboard();
    fetchClimateAnomalies();
    generateAiBriefing();
  } catch (e) {
    console.error(e);
  }
}

// --- Render ---
function renderDashboard() {
  els.loadingState.classList.add('hidden');
  els.dashboard.classList.remove('hidden');

  const cur = state.weather.current;
  const units = state.weather.current_units;
  
  els.currentTemp.textContent = `${Math.round(cur.temperature_2m)}${units.temperature_2m}`;
  els.currentDesc.textContent = getWeatherDesc(cur.weather_code);
  els.weatherIcon.textContent = getWeatherIcon(cur.weather_code, cur.is_day);
  
  els.currentHumidity.textContent = `${cur.relative_humidity_2m}%`;
  els.currentWind.textContent = `${cur.wind_speed_10m} ${units.wind_speed_10m}`;
  els.currentUv.textContent = state.weather.daily.uv_index_max[0] || '--';

  updateCanvas(cur.weather_code, cur.is_day);
  
  renderNowcast();
  renderActivities();
  renderHourly();
  renderDaily();
}

// --- Nowcast ---
function renderNowcast() {
  const minutely = state.weather.minutely_15;
  if (!minutely || !minutely.precipitation) return;
  
  const precip = minutely.precipitation.slice(0, 24); // next 6 hours
  const willRain = precip.some(p => p > 0);
  
  if (!willRain) {
    els.nowcastSection.classList.add('hidden');
    return;
  }
  
  els.nowcastSection.classList.remove('hidden');
  const rainIndex = precip.findIndex(p => p > 0);
  els.nowcastTitle.textContent = `Rain in ${rainIndex * 15} min`;
  els.nowcastDesc.textContent = "Light precipitation expected soon.";
  
  els.nowcastTimeline.innerHTML = '';
  precip.forEach(p => {
    const bar = document.createElement('div');
    bar.className = 'nowcast-bar';
    const height = Math.min(Math.max((p / 5) * 100, 5), 100);
    bar.style.height = `${height}%`;
    bar.style.opacity = p > 0 ? '1' : '0.2';
    els.nowcastTimeline.appendChild(bar);
  });
}

// --- Climate Anomalies ---
function fetchClimateAnomalies() {
    const curTemp = state.weather.current.temperature_2m;
    const normalTemp = 15; // Simulated historical normal for vanilla version
    const diff = curTemp - normalTemp;
    
    if (Math.abs(diff) > 2) {
      els.anomalyBadge.textContent = `${diff > 0 ? '+' : ''}${Math.round(diff)}° vs Normal`;
      els.anomalyBadge.classList.remove('hidden');
    } else {
      els.anomalyBadge.classList.add('hidden');
    }
}

// --- AI Briefing ---
async function generateAiBriefing() {
  if (!state.settings.anthropicKey) {
    els.aiBriefing.textContent = "Please set your Anthropic API Key in settings to get a daily weather summary.";
    return;
  }
  
  els.aiBriefing.textContent = "Generating AI briefing...";
  const prompt = `Write a 2-sentence friendly morning briefing for the weather in ${state.location.name}. Current temp is ${state.weather.current.temperature_2m}.`;
  
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": state.settings.anthropicKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerously-allow-browser": "true"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 150,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    if (data.content && data.content[0]) {
      els.aiBriefing.textContent = data.content[0].text;
    } else {
      els.aiBriefing.textContent = "Failed to generate briefing.";
    }
  } catch(e) {
    els.aiBriefing.textContent = "API error. Check your key.";
  }
}

// --- Activities Engine ---
const ACTIVITIES = [
  { id: 'run', name: '🏃 Running', tempMin: 8, tempMax: 25, precipMax: 20 },
  { id: 'cycle', name: '🚲 Cycling', tempMin: 10, tempMax: 28, precipMax: 10 },
  { id: 'beach', name: '🏖️ Beach', tempMin: 22, tempMax: 35, precipMax: 5 },
  { id: 'bbq', name: '🔥 BBQ', tempMin: 18, tempMax: 30, precipMax: 10 },
  { id: 'stargaze', name: '⭐ Stargaze', tempMin: -10, tempMax: 30, precipMax: 5 }
];

function renderActivities() {
  const hourly = state.weather.hourly;
  els.activityChips.innerHTML = '';
  
  ACTIVITIES.forEach(act => {
    let goodHours = 0;
    for(let i=0; i<12; i++) {
      const t = hourly.temperature_2m[i];
      const p = hourly.precipitation_probability[i];
      if (t >= act.tempMin && t <= act.tempMax && p <= act.precipMax) {
        goodHours++;
      }
    }
    
    let score = 0;
    if (goodHours > 8) score = 3;
    else if (goodHours > 4) score = 2;
    else if (goodHours > 0) score = 1;
    
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `<div class="chip-score score-${score}"></div> ${act.name}`;
    chip.addEventListener('click', () => showActivityModal(act, score));
    els.activityChips.appendChild(chip);
  });
}

function showActivityModal(act, score) {
  document.getElementById('modal-activity-title').textContent = act.name;
  const badge = document.getElementById('modal-activity-score');
  badge.className = `score-badge score-${score}`;
  badge.textContent = score === 3 ? 'Great' : score === 2 ? 'Good' : score === 1 ? 'Poor' : 'Bad';
  
  document.getElementById('modal-activity-reasons').innerHTML = `
    <li>Ideal temperature: ${act.tempMin}° to ${act.tempMax}°</li>
    <li>Max precipitation allowed: ${act.precipMax}%</li>
  `;
  els.activityModal.classList.remove('hidden');
}

// --- Forecasts ---
function renderHourly() {
  const h = state.weather.hourly;
  els.hourlyList.innerHTML = '';
  for(let i=0; i<24; i+=2) {
    const time = new Date(h.time[i]);
    const div = document.createElement('div');
    div.className = 'hourly-item';
    div.innerHTML = `
      <span class="text-sm text-muted">${time.getHours()}:00</span>
      <span class="text-xl">${getWeatherIcon(h.weather_code[i], h.is_day[i])}</span>
      <span class="font-bold">${Math.round(h.temperature_2m[i])}°</span>
    `;
    els.hourlyList.appendChild(div);
  }
}

function renderDaily() {
  const d = state.weather.daily;
  els.dailyList.innerHTML = '';
  for(let i=0; i<7; i++) {
    const date = new Date(d.time[i]);
    const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
    const min = Math.round(d.temperature_2m_min[i]);
    const max = Math.round(d.temperature_2m_max[i]);
    
    const div = document.createElement('div');
    div.className = 'daily-item';
    div.innerHTML = `
      <span>${dayName}</span>
      <span class="text-xl">${getWeatherIcon(d.weather_code[i], 1)}</span>
      <div style="display:flex; align-items:center; gap:0.5rem">
        <span class="text-muted text-sm">${min}°</span>
        <div class="temp-bar-container"><div class="temp-bar" style="left:20%; right:20%"></div></div>
        <span class="font-bold text-sm">${max}°</span>
      </div>
    `;
    els.dailyList.appendChild(div);
  }
}

// --- Helpers ---
function getWeatherDesc(code) {
  const codes = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 71: 'Slight snow', 73: 'Moderate snow',
    95: 'Thunderstorm'
  };
  return codes[code] || 'Unknown';
}

function getWeatherIcon(code, isDay) {
  if (code === 0 || code === 1) return isDay ? '☀️' : '🌙';
  if (code === 2) return isDay ? '⛅' : '☁️';
  if (code === 3) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 86) return '❄️';
  if (code >= 95) return '⛈️';
  return '☀️';
}

// --- Ambient Canvas ---
let animationFrameId;
function initCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let w = window.innerWidth;
  let h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  
  window.addEventListener('resize', () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  });
  
  updateCanvas(0, 1);
}

let particles = [];
function updateCanvas(code, isDay) {
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  cancelAnimationFrame(animationFrameId);
  particles = [];
  
  const isRain = code >= 51 && code <= 67;
  const isSnow = code >= 71 && code <= 86;
  
  if (isRain || isSnow) {
    for(let i=0; i<100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vy: isRain ? 10 + Math.random()*10 : 2 + Math.random()*2,
        s: isRain ? 1 : Math.random() * 3 + 1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isDay) {
      if (code > 2) { grad.addColorStop(0, '#64748b'); grad.addColorStop(1, '#cbd5e1'); }
      else { grad.addColorStop(0, '#38bdf8'); grad.addColorStop(1, '#bae6fd'); }
    } else {
      grad.addColorStop(0, '#0f172a'); grad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    particles.forEach(p => {
      ctx.beginPath();
      if (isSnow) {
        ctx.arc(p.x, p.y, p.s, 0, Math.PI*2);
      } else {
        ctx.rect(p.x, p.y, p.s, p.vy/2);
      }
      ctx.fill();
      
      p.y += p.vy;
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
    });
    
    animationFrameId = requestAnimationFrame(draw);
  }
  
  draw();
}

document.addEventListener('DOMContentLoaded', init);
