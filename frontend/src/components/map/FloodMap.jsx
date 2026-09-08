import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import useAppStore from '../../store/appStore.js';
import { getRiskColor } from '../../engine/floodModel.js';

// ── Static GeoJSON for route overlays ────────────────────────────────────────
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

// ── OSM raster map style ──────────────────────────────────────────────────────
function buildMapStyle() {
  return {
    version: 8,
    sources: {
      'osm': {
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

function buildRoadsGeoJSON(features) {
  return {
    type: 'FeatureCollection',
    features: (features || []).map(f => ({
      ...f,
      properties: {
        ...f.properties,
        color: f.properties.color || getRiskColor(f.properties.baseRisk || 'LOW'),
      },
    })),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FloodMap({ showRoute = false, mobile = false }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markersRef    = useRef([]);
  const popupRef      = useRef(null);
  const initializedRef = useRef(false);   // guard against double-init (React StrictMode)

  const roads          = useAppStore(s => s.roads);
  const showRouteOnMap = useAppStore(s => s.showRouteOnMap) || showRoute;
  const selectRoad     = useAppStore(s => s.selectRoad);

  // Keep a ref so event-handler closures always see the latest value
  const showRouteRef = useRef(showRouteOnMap);
  useEffect(() => { showRouteRef.current = showRouteOnMap; }, [showRouteOnMap]);

  // ── Initialise map once ────────────────────────────────────────────────────
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
      // Add road source + layers
      setupRoadLayers(map, roads, mobile, selectRoad, popupRef);
      // Add warning / location markers
      setupMarkers(map, markersRef);
      // Add route if already active
      if (showRouteRef.current) setupRouteLayers(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update roads when store changes ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || roads.length === 0) return;

    const update = () => {
      if (map.getSource('roads')) {
        // Source exists → just update data
        map.getSource('roads').setData(buildRoadsGeoJSON(roads));
      } else {
        // Source not yet added (first load) → set up everything
        setupRoadLayers(map, roads, mobile, selectRoad, popupRef);
      }
    };

    if (map.isStyleLoaded()) {
      update();
    } else {
      map.once('load', update);
    }
  }, [roads]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle route overlay ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (showRouteOnMap) {
        setupRouteLayers(map);
      } else {
        removeRouteLayers(map);
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
    }
  }, [showRouteOnMap]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// ── Pure helpers (no hooks, no closure over stale state) ───────────────────────

function setupRoadLayers(map, roads, mobile, selectRoad, popupRef) {
  if (!map || map.getSource('roads')) return; // guard: only add once

  map.addSource('roads', { type: 'geojson', data: buildRoadsGeoJSON(roads) });

  map.addLayer({
    id: 'roads-glow',
    type: 'line',
    source: 'roads',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': mobile ? 10 : 14,
      'line-blur': 8,
      'line-opacity': 0.22,
    },
  });

  map.addLayer({
    id: 'roads-layer',
    type: 'line',
    source: 'roads',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': mobile ? 5 : 6,
      'line-opacity': 0.95,
    },
  });

  // Click interaction
  map.on('click', 'roads-layer', e => {
    const feature = e.features && e.features[0];
    if (!feature) return;
    selectRoad(feature);
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

  const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, maxWidth: '270px', offset: 6 })
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
          <tr><td style="color:#64748b;padding:3px 0;">Trend</td>
              <td style="font-weight:700;color:#ea580c;text-align:right;">↑ Increasing</td></tr>
        </table>
        <div style="margin-top:10px;padding-top:9px;border-top:1px solid #f1f5f9;
                    font-size:10px;color:#94a3b8;line-height:1.6;">
          C=${p.runoffCoeff} · Elev: ${p.elevation}m · Area: ${p.catchmentArea}km²<br/>
          <em>SIH 2026 · Rational Method (Q=CiA) Simulation</em>
        </div>
      </div>
    `)
    .addTo(map);

  popupRef.current = popup;
}

function setupMarkers(map, markersRef) {
  markersRef.current.forEach(m => m.remove());
  markersRef.current = [];

  // Warning markers
  WARNING_MARKERS.forEach(wm => {
    const color = getRiskColor(wm.risk);
    const el = document.createElement('div');
    el.style.cssText = `
      width:28px;height:28px;
      background:${color};border:2.5px solid white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:12px;font-weight:700;
      box-shadow:0 2px 10px ${color}66;cursor:pointer;
      transition:transform 0.15s,box-shadow 0.15s;user-select:none;
    `;
    el.innerHTML = '⚠';
    el.title = `${wm.label} — ${wm.risk} Flood Risk`;
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.25)';
      el.style.boxShadow = `0 4px 18px ${color}99`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.boxShadow = `0 2px 10px ${color}66`;
    });
    const m = new maplibregl.Marker({ element: el }).setLngLat([wm.lng, wm.lat]).addTo(map);
    markersRef.current.push(m);
  });

  // Pulsing blue dot — current location
  injectPulseCSS();
  const locEl = document.createElement('div');
  locEl.style.cssText = `
    width:18px;height:18px;background:#2563eb;
    border:3px solid white;border-radius:50%;
    box-shadow:0 0 0 8px rgba(37,99,235,0.2),0 2px 8px rgba(0,0,0,0.3);
    animation:saferpulse 2s ease infinite;
  `;
  const locM = new maplibregl.Marker({ element: locEl }).setLngLat([88.3629, 22.5726]).addTo(map);
  markersRef.current.push(locM);
}

function injectPulseCSS() {
  if (document.getElementById('safer-pulse-css')) return;
  const s = document.createElement('style');
  s.id = 'safer-pulse-css';
  s.textContent = `
    @keyframes saferpulse {
      0%,100%{box-shadow:0 0 0 8px rgba(37,99,235,0.2),0 2px 8px rgba(0,0,0,0.3)}
      50%{box-shadow:0 0 0 16px rgba(37,99,235,0.05),0 2px 8px rgba(0,0,0,0.3)}
    }
  `;
  document.head.appendChild(s);
}

function setupRouteLayers(map) {
  if (!map || !map.isStyleLoaded()) return;
  // Remove any existing layers/sources first
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
