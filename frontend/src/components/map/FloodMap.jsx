/**
 * FloodMap.jsx — MapLibre GL flood risk road overlay
 * SIH 2026 Prototype · Simulated Data
 *
 * Architecture:
 * - Map is created once in a useEffect (guarded by initializedRef).
 * - Inside the map 'load' handler, we subscribe DIRECTLY to the Zustand
 *   store using useAppStore.subscribe(). This completely bypasses React's
 *   useEffect/batching system and fires synchronously on every store update.
 * - Road layer uses a MapLibre `match` expression on the `computedRisk`
 *   property directly — NOT on a derived `color` string — so color can
 *   never be stale or undefined.
 * - After every setData(), triggerRepaint() is called to force a redraw.
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
      [88.3629, 22.5726], [88.3490, 22.5630],
      [88.3550, 22.5525], [88.3650, 22.5480], [88.3839, 22.5421],
    ],
  },
};

const AVOIDED_ROUTE_GEOJSON = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [88.3629, 22.5726], [88.3680, 22.5750],
      [88.3740, 22.5660], [88.3839, 22.5421],
    ],
  },
};

const WARNING_MARKERS = [
  { lng: 88.3629, lat: 22.5726, label: 'A.P.C. Road',  risk: 'HIGH'     },
  { lng: 88.3740, lat: 22.5660, label: 'Sealdah',       risk: 'CRITICAL' },
  { lng: 88.3350, lat: 22.5620, label: 'Strand Road',   risk: 'CRITICAL' },
  { lng: 88.3720, lat: 22.5350, label: 'Kasba',         risk: 'HIGH'     },
];

// ── Risk color — MapLibre `match` expression (used in paint property) ─────────
// This is evaluated GPU-side per feature. Works even if no `color` property.
const RISK_MATCH_EXPR = [
  'match',
  ['coalesce', ['get', 'computedRisk'], ['get', 'baseRisk'], 'LOW'],
  'LOW',      '#16a34a',
  'MODERATE', '#ca8a04',
  'HIGH',     '#ea580c',
  'CRITICAL', '#dc2626',
  /* fallback */ '#6b7280',
];

// ── OSM map style ─────────────────────────────────────────────────────────────
function buildMapStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors | SIH 2026 Prototype – Simulated Data',
        maxzoom: 19,
      },
    },
    layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }],
  };
}

/**
 * Convert store roads array → MapLibre GeoJSON FeatureCollection.
 * Sets `computedRisk` and `baseRisk` as feature properties so the
 * RISK_MATCH_EXPR layer expression can read them directly.
 */
function buildRoadsGeoJSON(features) {
  return {
    type: 'FeatureCollection',
    features: (features || []).map(f => ({
      type: 'Feature',
      id: f.id,
      geometry: f.geometry,
      properties: {
        // Preserve all original + computed properties
        ...f.properties,
        // Ensure the match expression properties are always present
        computedRisk: f.properties.computedRisk || f.properties.baseRisk || 'LOW',
        baseRisk:     f.properties.baseRisk || 'LOW',
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
  const initializedRef = useRef(false);

  // We still subscribe to these for the route/selectRoad effects
  const showRouteOnMap = useAppStore(s => s.showRouteOnMap) || showRoute;
  const selectRoad     = useAppStore(s => s.selectRoad);

  // Refs so callbacks always see latest values without stale closures
  const showRouteRef  = useRef(showRouteOnMap);
  const selectRoadRef = useRef(selectRoad);
  showRouteRef.current  = showRouteOnMap;
  selectRoadRef.current = selectRoad;

  // ── ONE-TIME MAP INIT ──────────────────────────────────────────────────────
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
      // ── Step 1: Add road layers with CURRENT store data ──────────────────
      const currentRoads = useAppStore.getState().roads;
      console.log('[SAFER FloodMap] map loaded, roads in store:', currentRoads.length);
      addRoadLayers(map, currentRoads, mobile, selectRoadRef, popupRef);

      // ── Step 2: Subscribe to store so future road changes update the map ─
      // This fires SYNCHRONOUSLY on every roads update — no React lifecycle delays.
      const unsubscribeRoads = useAppStore.subscribe(
        state => state.roads,
        (latestRoads) => {
          if (latestRoads.length === 0) return;
          const src = map.getSource('roads');
          if (!src) {
            // Source was removed somehow — re-add everything
            addRoadLayers(map, latestRoads, mobile, selectRoadRef, popupRef);
            return;
          }
          console.log('[SAFER FloodMap] setData() called, features:', latestRoads.length,
            'sample computedRisk:', latestRoads[0]?.properties?.computedRisk);
          src.setData(buildRoadsGeoJSON(latestRoads));
          map.triggerRepaint();
        }
      );

      // ── Step 3: Markers ───────────────────────────────────────────────────
      setupMarkers(map, markersRef);

      // ── Step 4: Route overlay if already active ───────────────────────────
      if (showRouteRef.current) setupRouteLayers(map);

      // ── Store unsubscribe so cleanup can call it ──────────────────────────
      map._saferUnsubscribeRoads = unsubscribeRoads;
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        // Clean up Zustand subscription before destroying map
        if (mapRef.current._saferUnsubscribeRoads) {
          mapRef.current._saferUnsubscribeRoads();
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Route overlay toggle ───────────────────────────────────────────────────
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

// ── Pure helpers ──────────────────────────────────────────────────────────────

/**
 * Add the roads GeoJSON source and THREE line layers to the map.
 * Called once after map load (and again on remount if source was lost).
 *
 * Layer stack (bottom → top):
 *   roads-glow   — wide, blurred halo for the risk color
 *   roads-layer  — solid main line (unmissable 10px)
 */
function addRoadLayers(map, roads, mobile, selectRoadRef, popupRef) {
  if (!map || map.getSource('roads')) return;

  const geojson = buildRoadsGeoJSON(roads);
  console.log('[SAFER FloodMap] addRoadLayers, features:', geojson.features.length,
    'sample risk:', geojson.features[0]?.properties?.computedRisk);

  map.addSource('roads', { type: 'geojson', data: geojson });

  // Glow layer (wide, blurred halo)
  map.addLayer({
    id: 'roads-glow',
    type: 'line',
    source: 'roads',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': RISK_MATCH_EXPR,
      'line-width': mobile ? 16 : 22,
      'line-blur': 12,
      'line-opacity': 0.35,
    },
  });

  // Main solid road line — thick enough to be unmissable at any zoom
  map.addLayer({
    id: 'roads-layer',
    type: 'line',
    source: 'roads',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': RISK_MATCH_EXPR,
      'line-width': mobile ? 7 : 10,
      'line-opacity': 1.0,
    },
  });

  // Road name labels
  map.addLayer({
    id: 'roads-labels',
    type: 'symbol',
    source: 'roads',
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 10,
      'symbol-placement': 'line',
      'text-font': ['literal', ['Open Sans Regular']],
      'text-offset': [0, -1],
    },
    paint: {
      'text-color': '#0f172a',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
    },
  });

  // Click → select + popup
  map.on('click', 'roads-layer', e => {
    const feature = e.features && e.features[0];
    if (!feature) return;
    if (selectRoadRef.current) selectRoadRef.current(feature);
    if (!mobile) showRoadPopup(map, feature, e.lngLat, popupRef);
  });
  map.on('mouseenter', 'roads-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'roads-layer', () => { map.getCanvas().style.cursor = ''; });
}

function showRoadPopup(map, feature, lngLat, popupRef) {
  if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
  const p = feature.properties;
  const risk = p.computedRisk || p.baseRisk || 'LOW';
  const color = getRiskColor(risk);

  const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, maxWidth: '280px', offset: 6 })
    .setLngLat(lngLat)
    .setHTML(`
      <div style="font-family:'Inter',system-ui,sans-serif;padding:14px 16px;">
        <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:8px;">${p.name}</div>
        <div style="display:inline-flex;align-items:center;gap:5px;background:${color}18;color:${color};
                    font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;margin-bottom:12px;
                    border:1px solid ${color}33;">
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

function setupMarkers(map, markersRef) {
  markersRef.current.forEach(m => m.remove());
  markersRef.current = [];

  WARNING_MARKERS.forEach(wm => {
    const color = getRiskColor(wm.risk);
    const el = document.createElement('div');
    el.style.cssText = `
      width:30px;height:30px;background:${color};border:2.5px solid white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;color:white;font-size:13px;
      font-weight:700;box-shadow:0 2px 10px ${color}88;cursor:pointer;
      transition:transform 0.15s;user-select:none;
    `;
    el.textContent = '⚠';
    el.title = `${wm.label} — ${wm.risk} Flood Risk`;
    el.onmouseenter = () => { el.style.transform = 'scale(1.25)'; };
    el.onmouseleave = () => { el.style.transform = ''; };
    markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([wm.lng, wm.lat]).addTo(map));
  });

  injectPulseCSS();
  const locEl = document.createElement('div');
  locEl.style.cssText = `
    width:18px;height:18px;background:#2563eb;border:3px solid white;border-radius:50%;
    box-shadow:0 0 0 8px rgba(37,99,235,0.2),0 2px 8px rgba(0,0,0,0.3);
    animation:saferpulse 2s ease infinite;
  `;
  markersRef.current.push(new maplibregl.Marker({ element: locEl }).setLngLat([88.3629, 22.5726]).addTo(map));
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
  map.addSource('safe-route',    { type: 'geojson', data: SAFE_ROUTE_GEOJSON });
  map.addLayer({ id: 'safe-route-line',    type: 'line', source: 'safe-route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.92 } });
  map.addSource('avoided-route', { type: 'geojson', data: AVOIDED_ROUTE_GEOJSON });
  map.addLayer({ id: 'avoided-route-line', type: 'line', source: 'avoided-route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#dc2626', 'line-width': 4, 'line-opacity': 0.85, 'line-dasharray': [4, 3] } });
}

function removeRouteLayers(map) {
  if (!map || !map.isStyleLoaded()) return;
  ['safe-route-line', 'avoided-route-line'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
  ['safe-route', 'avoided-route'].forEach(id => { if (map.getSource(id)) map.removeSource(id); });
}
