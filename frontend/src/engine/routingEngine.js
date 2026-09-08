/**
 * SAFER Routing Engine
 * Flood-aware route planning with risk penalties
 * SIH 2026 Prototype – Simulated pathfinding using weighted road segments
 */
import { ROUTING_PENALTIES } from './floodModel.js';

// Simulated route options between common Kolkata locations
// In production: replace with OpenRouteService / OSRM API
const SIMULATED_ROUTES = {
  default: {
    normal: {
      distance: 4.2,
      duration: 22,
      riskLevel: 'HIGH',
      path: 'Via A.P.C. Road → Sealdah',
      avoidedRoads: [],
    },
    safer: {
      distance: 4.8,
      duration: 28,
      riskLevel: 'LOW',
      path: 'Via Park Street → EM Bypass',
      avoidedRoads: ['A.P.C. Road', 'Sealdah Road'],
      safetyNote: 'Avoids high and critical flood-risk roads',
    },
  },
  howrah_sealdah: {
    normal: {
      distance: 5.1,
      duration: 25,
      riskLevel: 'HIGH',
      path: 'Via Howrah Bridge → Strand Road → A.P.C. Road',
      avoidedRoads: [],
    },
    safer: {
      distance: 6.3,
      duration: 34,
      riskLevel: 'MODERATE',
      path: 'Via Howrah Bridge → Esplanade → Park Street',
      avoidedRoads: ['Strand Road', 'A.P.C. Road'],
      safetyNote: 'Bypasses flooded low-lying zones near Strand Road',
    },
  },
};

/**
 * Simulate a safer route computation
 * @param {string} from - Origin location name
 * @param {string} to - Destination location name
 * @param {Object} roadRisks - Current computed risk per road id
 * @param {string} preference - 'safest' | 'fastest'
 * @returns {Object} { normal, safer, recommendation }
 */
export function computeSaferRoute(from, to, roadRisks, preference = 'safest') {
  const key = `${from}_${to}`.toLowerCase().replace(/\s+/g, '_');
  const routes = SIMULATED_ROUTES[key] || SIMULATED_ROUTES.default;

  // Determine high-risk roads to avoid
  const highRiskRoads = Object.entries(roadRisks)
    .filter(([, r]) => r === 'HIGH' || r === 'CRITICAL')
    .map(([name]) => name);

  const safer = {
    ...routes.safer,
    avoidedRoads: highRiskRoads.slice(0, 3),
  };

  // If preference is fastest and risk is acceptable, recommend normal
  const useFastest = preference === 'fastest' && routes.normal.riskLevel !== 'CRITICAL';

  return {
    normal: routes.normal,
    safer,
    recommended: useFastest ? 'normal' : 'safer',
    riskReduction: `${routes.normal.riskLevel} → ${safer.riskLevel}`,
    extraDistance: Math.round((safer.distance - routes.normal.distance) * 10) / 10,
  };
}

/**
 * Known Kolkata locations for autocomplete
 */
export const KOLKATA_LOCATIONS = [
  { id: 'loc_my', name: 'My Location', lat: 22.5726, lng: 88.3629 },
  { id: 'loc_howrah', name: 'Howrah Station', lat: 22.5839, lng: 88.3421 },
  { id: 'loc_sealdah', name: 'Sealdah Station', lat: 22.5663, lng: 88.3697 },
  { id: 'loc_park', name: 'Park Street', lat: 22.5525, lng: 88.3550 },
  { id: 'loc_esplanade', name: 'Esplanade', lat: 22.5630, lng: 88.3490 },
  { id: 'loc_saltlake', name: 'Salt Lake Sector V', lat: 22.5727, lng: 88.4295 },
  { id: 'loc_airport', name: 'Netaji Subhas Airport', lat: 22.6547, lng: 88.4467 },
  { id: 'loc_victoria', name: 'Victoria Memorial', lat: 22.5448, lng: 88.3426 },
  { id: 'loc_college', name: 'College Street', lat: 22.5726, lng: 88.3629 },
  { id: 'loc_kasba', name: 'Kasba', lat: 22.5200, lng: 88.3750 },
];
