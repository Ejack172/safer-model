/**
 * SAFER Service Layer
 * Clean abstractions for all data sources – swap simulated → real APIs here
 * SIH 2026 Prototype
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || null;
const USE_SIMULATED = !BASE_URL;

// ── Rainfall Service ─────────────────────────────────────────────────────────

/**
 * Fetch current rainfall data
 * Future: replace with Open-Meteo API
 * https://open-meteo.com/en/docs (free, no key required)
 */
export async function fetchRainfall() {
  if (USE_SIMULATED) {
    const res = await fetch('/data/rainfall.json');
    return res.json();
  }
  // Future: real API
  const res = await fetch(`${BASE_URL}/api/rainfall/current`);
  return res.json();
}

// ── Roads Service ─────────────────────────────────────────────────────────────

/**
 * Fetch road network GeoJSON
 * Future: replace with OSM Overpass API or MapTiler
 */
export async function fetchRoads() {
  if (USE_SIMULATED) {
    const res = await fetch('/data/roads.geojson');
    return res.json();
  }
  const res = await fetch(`${BASE_URL}/api/roads`);
  return res.json();
}

// ── Drainage Service ──────────────────────────────────────────────────────────

/**
 * Fetch drainage network status
 * Future: replace with city drainage sensor API or backend
 */
export async function fetchDrainage() {
  if (USE_SIMULATED) {
    const res = await fetch('/data/drainage.json');
    return res.json();
  }
  const res = await fetch(`${BASE_URL}/api/drainage`);
  return res.json();
}

// ── Alerts Service ────────────────────────────────────────────────────────────

/**
 * Fetch base alerts (dynamic alerts computed client-side from model)
 */
export async function fetchBaseAlerts() {
  if (USE_SIMULATED) {
    const res = await fetch('/data/alerts.json');
    return res.json();
  }
  const res = await fetch(`${BASE_URL}/api/alerts`);
  return res.json();
}

// ── Routing Service ───────────────────────────────────────────────────────────

/**
 * Request a safer route
 * Future: replace with OpenRouteService or OSRM
 * https://openrouteservice.org/
 */
export async function requestRoute(from, to, preference = 'safest', roadRisks = {}) {
  if (USE_SIMULATED) {
    // Client-side routing engine handles this
    return null; // handled in routingEngine.js
  }
  const res = await fetch(`${BASE_URL}/api/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, preference, roadRisks }),
  });
  return res.json();
}
