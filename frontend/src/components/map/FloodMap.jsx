/**
 * FloodMap.jsx — MapLibre GL flood risk road overlay
 * SIH 2026 Prototype · Simulated Data
 *
 * Key design decisions:
 * - Map is initialised once (guarded by initializedRef).
 * - `roadsRef` always holds the latest road features so the map.on('load')
 *   callback — which closes over the initial render — can still access
 *   current data. This solves the stale-closure race condition.
 * - Roads GeoJSON source is updated via setData() whenever the store's
 *   `roads` array changes (i.e. after every rainfall model recompute).
 * - Color is ALWAYS derived from computedRisk — never cached .color.
 */
import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import useAppStore from '../../store/appStore.js';
import { getRiskColor } from '../../engine/floodModel.js';

// ── Static route overlays ─────────────────────────────────────────────────────
const SAFE_ROUTE_GEOJSON = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [88.3629, 22.5726],
      [88.3490, 22.5630],
      [88.3550, 22.5525],
      [88.3650, 22.5480],
      [88.3839, 22.5421],
    ],
  },
};

const AVOIDED_ROUTE_GEOJSON = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [88.3629, 22.5726],
      [88.3680, 22.5750],
      [88.3740, 22.5660],
      [88.3839, 22.5421],
    ],
  },
};

const WARNING_MARKERS = [
  { lng: 88.3629, lat: 22.5726, label: 'A.P.C. Road',  risk: 'HIGH'     },
  { lng: 88.3740, lat: 22.5660, label: 'Sealdah',       risk: 'CRITICAL' },
  { lng: 88.3350, lat: 22.5620, label: 'Strand Road',   risk: 'CRITICAL' },
  { lng: 88.3720, lat: 22.5350, label: 'Kasba',         risk: 'HIGH'     },
];

// ── Map style (OSM raster) ────────────────────────────────────────────────────
function buildMapStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors | SIH 2026 – Simulated Data',
        maxzoom: 19,
      },
    },
    layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }],
  };
}

/**
 * Build a GeoJSON FeatureCollection from the store's road features.
 * ALWAYS derives `color` from `computedRisk` — never the cached property —
 * so that every setData() call uses the latest model output.
 */
function buildRoadsGeoJSON(features) {
  return {
    type: 'FeatureCollection',
    features: (features || []).map(f => ({
      type: 'Feature',
      id: f.id,
      geometry: f.geometry,
      properties: {
        ...f.properties,
        // Fresh color every time — computedRisk is set by recomputeModel()
        color: getRiskColor(f.properties.computedRisk || f.properties.baseRisk || 'LOW'),
      },
    })),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FloodMap({ showRoute = false, mobile = false }) {
  const containerRef   = useRef(null);
  const mapRef         = useRef(null);
  const markersRef     = useRef([]);
  const popupRef       = useRef(null);
  const initializedRef = useRef(false); // prevents double-init in React StrictMode

  // ── Always-current refs (read inside event handlers / callbacks) ──────────
  const roadsRef       = useRef([]);    // latest roads — avoids stale closure in load handler
  const showRouteRef   = useRef(showRoute);
  const selectRoadRef  = useRef(null);

  // Subscribe to store
  const roads          = useAppStore(s => s.roads);
  const showRouteOnMap = useAppStore(s => s.showRouteOnMap) || showRoute;
  const selectRoad     = useAppStore(s => s.selectRoad);

  // Keep refs in sync every render
  roadsRef.current      = roads;
  showRouteRef.current  = showRouteOnMap;
  selectRoadRef.current = selectRoad;

  // ── Initialise map ONCE ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle(),
      center: [88.3639, 22.5726],
      zoom: mobile ? 11.5 : 12,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 9,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      // Use roadsRef.current (always fresh) — NOT the stale closure value
      addRoadLayersToMap(map, roadsRef.current, mobile, selectRoadRef, popupRef);
      setupMarkers(map, markersRef);
      if (showRouteRef.current) setupRouteLayers(map);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update road colors whenever the store recomputes ───────────────────────
  // This fires on every rainfall slider change (after recomputeModel sets roads).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || roads.length === 0) return;

    const applyRoadData = () => {
      const geojson = buildRoadsGeoJSON(roads);
      const src = map.getSource('roads');
      if (src) {
        // Fast path: source exists → just push new data, MapLibre re-renders
        src.setData(geojson);
      } else {
        // Slow path: map loaded but source missing (e.g. first data arrival
        // happened before load event fired) → add everything now
        addRoadLayersToMap(map, roads, mobile, selectRoadRef, popupRef);
      }
    };

    if (map.isStyleLoaded()) {
      applyRoadData();
    } else {
      // Wait for load, then apply (handles first-load race)
      map.once('load', applyRoadData);
    }
  }, [roads]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle safer-route overlay ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (showRouteOnMap) setupRouteLayers(map);
      else removeRouteLayers(map);
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [showRouteOnMap]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// ── Pure map helpers (no React hooks, no stale closures) ──────────────────────

/**
 * Add roads GeoJSON source + two line layers (glow + main) to the map.
 * Guard prevents adding twice.
 */
function addRoadLayersToMap(map, roads, mobile, selectRoadRef, popupRef) {
  if (!map || map.getSource('roads')) return; // already added

  map.addSource('roads', {
    type: 'geojson',
    data: buildRoadsGeoJSON(roads),
  });

  // Soft glow behind the road line (wider, blurred, semi-transparent)
  map.addLayer({
    id: 'roads-glow',
    type: 'line',
    source: 'roads',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': mobile ? 14 : 18,
      'line-blur': 10,
      'line-opacity': 0.30,
    },
  });

  // Main solid road line — thick enough to be unmissable
  map.addLayer({
    id: 'roads-layer',
    type: 'line',
    source: 'roads',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': mobile ? 6 : 8,
      'line-opacity': 1.0,
    },
  });

  // Thin dark outline beneath — improves contrast against any map background
  map.addLayer({
    id: 'roads-outline',
    type: 'line',
    source: 'roads',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#000000',
      'line-width': mobile ? 8 : 11,
      'line-opacity': 0.15,
    },
  }, 'roads-glow'); // insert below glow layer

  // Click → open popup + select road in store
  map.on('click', 'roads-layer', e => {
    const feature = e.features && e.features[0];
    if (!feature) return;
    if (selectRoadRef.current) selectRoadRef.current(feature);
    if (!mobile) showRoadPopup(map, feature, e.lngLat, popupRef);
  });
  map.on('mouseenter', 'roads-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'roads-layer', () => { map.getCanvas().style.cursor = ''; });
}

/**
 * Show a rich popup for a clicked road feature.
 * Reads `computedRisk` (live) with fallback to `baseRisk`.
 */
function showRoadPopup(map, feature, lngLat, popupRef) {
  if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
  const p = feature.properties;
  const risk = p.computedRisk || p.baseRisk || 'LOW';
  const color = getRiskColor(risk);

  const popup = new maplibregl.Popup({
    closeButton: true, closeOnClick: false, maxWidth: '280px', offset: 6,
  })
    .setLngLat(lngLat)
    .setHTML(`
      <div style="font-family:'Inter',system-ui,sans-serif;padding:14px 16px;">
        <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:8px;">${p.name}</div>
        <div style="display:inline-flex;align-items:center;gap:5px;
                    background:${color}18;color:${color};
                    font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;
                    margin-bottom:12px;border:1px solid ${color}33;">
          <span style="width:7px;height:7px;background:${color};border-radius:50%;display:inline-block;"></span>
          ${risk} RISK
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
          <tr><td style="color:#64748b;padding:3px 0;">Est. Water Depth</td>
              <td style="font-weight:600;color:#0f172a;text-align:right;">${p.waterDepth ?? '—'} m</td></tr>
          <tr><td style="color:#64748b;padding:3px 0;">Drainage Stress</td>
              <td style="font-weight:600;color:#0f172a;text-align:right;">${p.drainageStress ?? '—'}%</td></tr>
          <tr><td style="color:#64748b;padding:3px 0;">Peak Runoff (Q)</td>
              <td style="font-weight:600;color:#0f172a;text-align:right;">${p.Q ?? '—'} m³/s</td></tr>
          <tr><td style="color:#64748b;padding:3px 0;">Flood Probability</td>
              <td style="font-weight:600;color:#0f172a;text-align:right;">${p.floodProbability ?? '—'}%</td></tr>
        </table>
        <div style="margin-top:10px;padding-top:9px;border-top:1px solid #f1f5f9;
                    font-size:10px;color:#94a3b8;line-height:1.6;">
          C=${p.runoffCoeff} · Elev: ${p.elevation}m · Area: ${p.catchmentArea}km²<br/>
          <em>SIH 2026 · Rational Method Q=C×i×A</em>
        </div>
      </div>
    `)
    .addTo(map);

  popupRef.current = popup;
}

/** Add warning markers + pulsing location dot */
function setupMarkers(map, markersRef) {
  markersRef.current.forEach(m => m.remove());
  markersRef.current = [];

  WARNING_MARKERS.forEach(wm => {
    const color = getRiskColor(wm.risk);
    const el = document.createElement('div');
    el.style.cssText = `
      width:30px;height:30px;
      background:${color};border:2.5px solid white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:13px;font-weight:700;
      box-shadow:0 2px 10px ${color}88;cursor:pointer;
      transition:transform 0.15s;user-select:none;
    `;
    el.textContent = '⚠';
    el.title = `${wm.label} — ${wm.risk} Flood Risk`;
    el.onmouseenter = () => { el.style.transform = 'scale(1.25)'; };
    el.onmouseleave = () => { el.style.transform = ''; };
    markersRef.current.push(
      new maplibregl.Marker({ element: el }).setLngLat([wm.lng, wm.lat]).addTo(map)
    );
  });

  // Current location pulse
  injectPulseCSS();
  const locEl = document.createElement('div');
  locEl.style.cssText = `
    width:18px;height:18px;background:#2563eb;
    border:3px solid white;border-radius:50%;
    box-shadow:0 0 0 8px rgba(37,99,235,0.2),0 2px 8px rgba(0,0,0,0.3);
    animation:saferpulse 2s ease infinite;
  `;
  markersRef.current.push(
    new maplibregl.Marker({ element: locEl }).setLngLat([88.3629, 22.5726]).addTo(map)
  );
}

function injectPulseCSS() {
  if (document.getElementById('safer-pulse-css')) return;
  const s = document.createElement('style');
  s.id = 'safer-pulse-css';
  s.textContent = `
    @keyframes saferpulse {
      0%,100%{box-shadow:0 0 0 8px rgba(37,99,235,0.2),0 2px 8px rgba(0,0,0,0.3)}
      50%     {box-shadow:0 0 0 16px rgba(37,99,235,0.05),0 2px 8px rgba(0,0,0,0.3)}
    }
  `;
  document.head.appendChild(s);
}

function setupRouteLayers(map) {
  if (!map || !map.isStyleLoaded()) return;
  removeRouteLayers(map);

  map.addSource('safe-route', { type: 'geojson', data: SAFE_ROUTE_GEOJSON });
  map.addLayer({
    id: 'safe-route-line', type: 'line', source: 'safe-route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.92 },
  });

  map.addSource('avoided-route', { type: 'geojson', data: AVOIDED_ROUTE_GEOJSON });
  map.addLayer({
    id: 'avoided-route-line', type: 'line', source: 'avoided-route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#dc2626', 'line-width': 4, 'line-opacity': 0.85, 'line-dasharray': [4, 3] },
  });
}

function removeRouteLayers(map) {
  if (!map || !map.isStyleLoaded()) return;
  ['safe-route-line', 'avoided-route-line'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
  ['safe-route', 'avoided-route'].forEach(id => { if (map.getSource(id)) map.removeSource(id); });
}
