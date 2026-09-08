/**
 * SAFER Global App Store (Zustand)
 * Manages all application state: rainfall, road risks, drainage, alerts, routing
 */
import { create } from 'zustand';
import { modelRoad, getRiskColor } from '../engine/floodModel.js';
import { generateAlerts } from '../engine/alertEngine.js';

const useAppStore = create((set, get) => ({
  // ── Rainfall State ──────────────────────────────────────────────────────────
  rainfall: 24,          // mm/hr current
  rainfallForecast: [
    { label: 'Now', hour: 0, intensity: 24 },
    { label: '+1h', hour: 1, intensity: 32 },
    { label: '+2h', hour: 2, intensity: 28 },
    { label: '+3h', hour: 3, intensity: 18 },
  ],
  selectedTimeStep: 0,   // 0=Now, 1=+1h, 2=+2h, 3=+3h

  // ── Roads State ─────────────────────────────────────────────────────────────
  roads: [],             // GeoJSON features with computed risk
  selectedRoad: null,

  // ── Drainage State ───────────────────────────────────────────────────────────
  drainagePoints: [],

  // ── Overall Risk ─────────────────────────────────────────────────────────────
  overallRisk: 'HIGH',
  overallDrainageStress: 78,
  overallWaterDepth: 0.25,

  // ── Alerts ───────────────────────────────────────────────────────────────────
  alerts: [],

  // ── Routing ──────────────────────────────────────────────────────────────────
  routeFrom: 'My Location',
  routeTo: '',
  routeResult: null,
  routePreference: 'safest',

  // ── UI ───────────────────────────────────────────────────────────────────────
  activeNav: 'home',
  mobilePage: 'home',
  showRouteOnMap: false,
  isSimulating: false,

  // ── Location ─────────────────────────────────────────────────────────────────
  currentLocation: 'College Street, Kolkata',

  // ────────────────────────────────────────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────────────────────────────────────────

  setRainfall: (value) => {
    set({ rainfall: value, isSimulating: true });
    // Recompute everything when rainfall changes
    setTimeout(() => get().recomputeModel(), 0);
  },

  setSelectedTimeStep: (step) => {
    const { rainfallForecast } = get();
    const intensity = rainfallForecast[step]?.intensity ?? 24;
    set({ selectedTimeStep: step, rainfall: intensity, isSimulating: true });
    setTimeout(() => get().recomputeModel(), 0);
  },

  setRoads: (geojsonFeatures) => {
    const { rainfall } = get();
    const computed = geojsonFeatures.map(f => {
      const metrics = modelRoad(f.properties, rainfall);
      return {
        ...f,
        properties: {
          ...f.properties,
          ...metrics,
          computedRisk: metrics.riskLevel,
          color: getRiskColor(metrics.riskLevel),
        },
      };
    });
    set({ roads: computed });
    get().recomputeAlerts();
  },

  setDrainagePoints: (points) => {
    const { rainfall } = get();
    const computed = points.map(p => {
      // Simple stress adjustment based on rainfall
      const stressMultiplier = Math.min(rainfall / 20, 2.0);
      const computedStress = Math.min(Math.round(p.baseStress * stressMultiplier), 100);
      return { ...p, computedStress };
    });
    set({ drainagePoints: computed });
  },

  recomputeModel: () => {
    const { rainfall, roads, drainagePoints } = get();

    // Recompute roads
    const updatedRoads = roads.map(f => {
      const metrics = modelRoad(f.properties, rainfall);
      return {
        ...f,
        properties: {
          ...f.properties,
          ...metrics,
          computedRisk: metrics.riskLevel,
          color: getRiskColor(metrics.riskLevel),
        },
      };
    });

    // Recompute drainage
    const updatedDrainage = drainagePoints.map(p => {
      const stressMultiplier = Math.min(rainfall / 20, 2.0);
      const computedStress = Math.min(Math.round(p.baseStress * stressMultiplier), 100);
      return { ...p, computedStress };
    });

    // Compute overall metrics from all roads (weighted average)
    const avgStress = updatedRoads.length > 0
      ? Math.round(updatedRoads.reduce((s, r) => s + (r.properties.drainageStress || 0), 0) / updatedRoads.length)
      : 50;
    const maxDepth = Math.max(...updatedRoads.map(r => r.properties.waterDepth || 0), 0);
    const riskCounts = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
    updatedRoads.forEach(r => riskCounts[r.properties.computedRisk]++);
    const overallRisk = riskCounts.CRITICAL > 0 ? 'CRITICAL'
      : riskCounts.HIGH > 1 ? 'HIGH'
      : riskCounts.HIGH > 0 ? 'HIGH'
      : riskCounts.MODERATE > 1 ? 'MODERATE'
      : 'LOW';

    set({
      roads: updatedRoads,
      drainagePoints: updatedDrainage,
      overallRisk,
      overallDrainageStress: avgStress,
      overallWaterDepth: Math.round(maxDepth * 100) / 100,
      isSimulating: false,
    });

    get().recomputeAlerts();
  },

  recomputeAlerts: () => {
    const { roads, drainagePoints, rainfall, overallRisk } = get();
    const roadsForAlert = roads.map(r => ({
      id: r.id,
      name: r.properties.name,
      computedRisk: r.properties.computedRisk,
      waterDepth: r.properties.waterDepth,
      historicalFlood: r.properties.historicalFlood,
    }));
    const drainForAlert = drainagePoints.map(d => ({
      id: d.id,
      name: d.name,
      computedStress: d.computedStress,
    }));
    const alerts = generateAlerts({
      roads: roadsForAlert,
      drainage: drainForAlert,
      rainfall,
      riskLevel: overallRisk,
      drainageStress: get().overallDrainageStress,
    });
    set({ alerts });
  },

  selectRoad: (road) => set({ selectedRoad: road }),
  clearSelectedRoad: () => set({ selectedRoad: null }),

  setRouteFrom: (v) => set({ routeFrom: v }),
  setRouteTo: (v) => set({ routeTo: v }),
  setRouteResult: (r) => set({ routeResult: r, showRouteOnMap: true }),
  clearRoute: () => set({ routeResult: null, showRouteOnMap: false }),
  setRoutePreference: (p) => set({ routePreference: p }),

  setActiveNav: (nav) => set({ activeNav: nav }),
  setMobilePage: (page) => set({ mobilePage: page }),
}));

export default useAppStore;
