/**
 * SAFER Alert Engine
 * Dynamically generates alerts based on current flood model state
 * SIH 2026 Prototype – Simulated
 */
import { getRiskLevel } from './floodModel.js';

/**
 * Generate dynamic alerts from current model state
 * @param {Object} state - { roads, drainage, rainfall, drainageStress, riskLevel }
 */
export function generateAlerts(state) {
  const { roads = [], drainage = [], rainfall = 0, drainageStress = 0, riskLevel = 'LOW' } = state;
  const alerts = [];

  // Alert: High rainfall
  if (rainfall >= 35) {
    alerts.push({
      id: 'dyn_001',
      type: 'CRITICAL',
      title: 'Extreme Rainfall Alert',
      detail: `${rainfall} mm/hr detected. Severe flooding risk.`,
      location: 'Kolkata Metropolitan Area',
      time: 'Just now',
      active: true,
    });
  } else if (rainfall >= 20) {
    alerts.push({
      id: 'dyn_002',
      type: 'HIGH',
      title: 'Heavy Rainfall Warning',
      detail: `${rainfall} mm/hr. Drainage systems under stress.`,
      location: 'Kolkata Metropolitan Area',
      time: 'Just now',
      active: true,
    });
  }

  // Alert: Per-road high-risk
  roads.forEach(road => {
    if (road.computedRisk === 'CRITICAL') {
      alerts.push({
        id: `dyn_road_${road.id}`,
        type: 'CRITICAL',
        title: `Critical Flood Risk: ${road.name}`,
        detail: `Est. water depth ${road.waterDepth} m. Avoid this route.`,
        location: road.name,
        time: 'Now',
        active: true,
      });
    } else if (road.computedRisk === 'HIGH' && road.historicalFlood) {
      alerts.push({
        id: `dyn_road_h_${road.id}`,
        type: 'HIGH',
        title: `High Flood Risk on ${road.name}`,
        detail: `Est. water depth ${road.waterDepth} m`,
        location: road.name,
        time: '5 min ago',
        active: true,
      });
    }
  });

  // Alert: Drainage stress
  drainage.forEach(d => {
    if (d.computedStress >= 80) {
      alerts.push({
        id: `dyn_drain_${d.id}`,
        type: 'HIGH',
        title: `Drainage Overload: ${d.name}`,
        detail: `${d.computedStress}% stress. Water logging reported.`,
        location: d.name,
        time: '10 min ago',
        active: true,
      });
    }
  });

  // Deduplicate and sort by severity
  const severity = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
  return alerts
    .slice(0, 6) // max 6 dynamic alerts
    .sort((a, b) => severity[a.type] - severity[b.type]);
}
