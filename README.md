# 🌊 SAFER – Smart AI Flood Early Response

**SIH 2026 Prototype | Problem Statement 26085 – Urban Flood Nowcasting System**

> ⚠️ **SIMULATED DATA ONLY** — This is a prototype for demonstration purposes. All flood risk values, road data, and predictions are simulated and must NOT be used for operational emergency response.

---

## Overview

SAFER is an urban flood nowcasting and safer-routing web application for the **Smart India Hackathon 2026**. It demonstrates the complete flood early-response pipeline:

```
Rainfall / Forecast
      ↓
Terrain / DEM
      ↓
Surface Runoff  (Q = C × i × A)
      ↓
Drainage Capacity
      ↓
Flood Risk Calculation
      ↓
0–3 Hour Flood Risk Map
      ↓
Early Warning
      ↓
Flood-Aware Safer Route
      ↓
SAFER Dashboard
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Map | MapLibre GL JS (OSM tiles) |
| Charts | Recharts |
| State Management | Zustand |
| Icons | Lucide React |
| Flood Model | Rational Method (Q = C × i × A) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at: **http://localhost:5173**

- Desktop view: browser width ≥ 768px
- Mobile view: browser width < 768px (or use DevTools device emulation)

---

## Project Structure

```
safer_demo_01/
├── frontend/
│   ├── public/
│   │   └── data/
│   │       ├── rainfall.json       # Simulated rainfall forecast
│   │       ├── roads.geojson       # Kolkata road network with flood attributes
│   │       ├── drainage.json       # Drainage network status
│   │       └── alerts.json         # Base alerts
│   └── src/
│       ├── components/
│       │   ├── layout/             # Sidebar, TopBar, MobileApp, MobileNav
│       │   ├── map/                # FloodMap, RiskLegend
│       │   ├── charts/             # RainfallChart, FloodRiskChart
│       │   ├── routing/            # RoutePanel
│       │   ├── drainage/           # DrainageStatus
│       │   └── common/             # RiskBadge, RainfallSimulator
│       ├── engine/
│       │   ├── floodModel.js       # Q = C × i × A rational method
│       │   ├── routingEngine.js    # Flood-aware routing
│       │   └── alertEngine.js      # Dynamic alert generation
│       ├── pages/
│       │   ├── desktop/            # Dashboard.jsx
│       │   └── mobile/             # HomeScreen, FloodMapScreen, RoutesScreen, AlertsScreen, TrendsScreen, DrainageScreen
│       ├── services/
│       │   └── api.js              # Service abstraction layer (swap for real APIs here)
│       └── store/
│           └── appStore.js         # Zustand reactive store
```

---

## Flood Model Engineering

The prototype uses the **Rational Method** for peak runoff estimation:

```
Q = C × i × A

Q = Peak runoff (m³/s)
C = Runoff coefficient (0.65–0.92 for Kolkata urban)
i = Rainfall intensity (mm/hr → m/s)
A = Catchment area (km²)
```

**Drainage Stress:**
```
Stress (%) = (Q / Drainage Capacity) × 100
```

**Risk Levels:**
| Stress | Risk Level | Color |
|---|---|---|
| < 40% | LOW | 🟢 Green |
| 40–60% | MODERATE | 🟡 Yellow |
| 60–80% | HIGH | 🟠 Orange |
| > 80% | CRITICAL | 🔴 Red |

**Multi-factor flood probability** uses: rainfall intensity, elevation, slope, runoff coefficient, drainage stress, and historical flood records.

---

## Future API Integrations

The `src/services/api.js` service layer is structured for easy real API connection:

| Service | API | Status |
|---|---|---|
| Weather / Rainfall | Open-Meteo (free, no key) | Ready for integration |
| Map tiles | MapTiler / OSM | OSM active (prototype) |
| Routing | OpenRouteService / OSRM | Simulated (ready to swap) |
| Terrain / DEM | SRTM via NASA Earthdata | Architecture ready |
| ML Prediction | Backend FastAPI + scikit-learn | Architecture ready |

---

## Demo Study Area

**Kolkata, West Bengal, India** — chosen for its well-documented urban flooding history, flat terrain, aging drainage infrastructure, and data availability.

Key roads in simulation: A.P.C. Road, Howrah Bridge Road, Park Street, Sealdah Road, Esplanade, EM Bypass, Strand Road, Bidhan Sarani, Rashbehari Avenue, Kasba Road.

---

## SIH 2026 Team

**SAFER – Smart AI Flood Early Response**
Safer People. Stronger Cities.

*Problem Statement 26085 – Urban Flood Nowcasting System*
*Smart India Hackathon 2026 – Disaster Management Track*
