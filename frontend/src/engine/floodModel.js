/**
 * SAFER Flood Model – Rational Method (Q = C × i × A)
 * SIH 2026 Prototype – Simulated Engineering Model
 * 
 * WARNING: This is a simplified prototype model using simulated parameters.
 * Values are for demonstration only and are NOT operationally validated.
 * 
 * References:
 *   - Rational Method: Q = C × i × A (American Society of Civil Engineers)
 *   - IMD rainfall classification thresholds
 *   - Urban flood risk assessment framework (NDMA 2010)
 */

// Risk level thresholds (based on drainage stress %)
export const RISK_THRESHOLDS = {
  LOW: { max: 40, label: 'LOW', color: '#16a34a', bg: '#dcfce7', text: '#15803d' },
  MODERATE: { max: 60, label: 'MODERATE', color: '#ca8a04', bg: '#fef9c3', text: '#a16207' },
  HIGH: { max: 80, label: 'HIGH', color: '#ea580c', bg: '#ffedd5', text: '#c2410c' },
  CRITICAL: { max: 100, label: 'CRITICAL', color: '#dc2626', bg: '#fee2e2', text: '#b91c1c' },
};

/**
 * Compute peak runoff using the Rational Method
 * Q = C × i × A
 * @param {number} C - Runoff coefficient (dimensionless, 0–1)
 * @param {number} i - Rainfall intensity (mm/hr)
 * @param {number} A - Catchment area (km²)
 * @returns {number} Q - Peak runoff (m³/s)
 */
export function computeRunoff(C, i, A) {
  // Convert: i from mm/hr → m/s, A from km² → m²
  const i_ms = i / (1000 * 3600);
  const A_m2 = A * 1_000_000;
  return C * i_ms * A_m2; // m³/s
}

/**
 * Compute drainage stress percentage
 * @param {number} Q - Runoff (m³/s)
 * @param {number} capacity - Drainage capacity (m³/s)
 * @returns {number} stress percentage (0–100+)
 */
export function computeDrainageStress(Q, capacity) {
  if (capacity <= 0) return 100;
  return Math.min(Math.round((Q / capacity) * 100), 100);
}

/**
 * Estimate water depth from excess runoff
 * @param {number} Q - Runoff (m³/s)
 * @param {number} capacity - Drainage capacity (m³/s)
 * @param {number} area - Area (km²)
 * @param {number} durationHrs - Duration (hours)
 * @returns {number} Estimated ponded water depth (m)
 */
export function estimateWaterDepth(Q, capacity, area, durationHrs = 1) {
  const excess = Math.max(0, Q - capacity); // m³/s excess
  const area_m2 = area * 1_000_000;
  const depth = (excess * durationHrs * 3600) / area_m2;
  return Math.round(Math.min(depth, 1.5) * 100) / 100; // cap at 1.5m
}

/**
 * Determine risk level from drainage stress
 * @param {number} stress - Drainage stress percentage
 * @returns {string} Risk level key
 */
export function getRiskLevel(stress) {
  if (stress < 40) return 'LOW';
  if (stress < 60) return 'MODERATE';
  if (stress < 80) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Compute flood probability (0–1) using multi-factor model
 * Features: rainfall intensity, elevation, slope, runoff, drainage stress, historical
 * This is a prototype rule-based model – intended to be replaced by trained ML model.
 * @param {Object} params
 */
export function computeFloodProbability({ rainfall, elevation, slope, runoffCoeff, drainageStress, historicalFlood }) {
  // Normalised factor contributions
  const rainfallFactor = Math.min(rainfall / 60, 1) * 0.30;         // 30% weight
  const elevationFactor = Math.max(0, (8 - elevation) / 8) * 0.20; // 20% weight – lower = higher risk
  const slopeFactor = Math.max(0, (0.01 - slope) / 0.01) * 0.10;   // 10% weight – flat = higher risk
  const runoffFactor = (runoffCoeff - 0.5) / 0.5 * 0.15;            // 15% weight
  const drainFactor = (drainageStress / 100) * 0.20;                 // 20% weight
  const histFactor = historicalFlood ? 0.05 : 0;                     // 5% weight

  const probability = rainfallFactor + elevationFactor + slopeFactor + runoffFactor + drainFactor + histFactor;
  return Math.min(Math.max(probability, 0), 1);
}

/**
 * Run full flood model for a single road segment given rainfall intensity
 * @param {Object} roadProps - Road properties from GeoJSON
 * @param {number} rainfallIntensity - mm/hr
 * @returns {Object} Computed flood metrics
 */
export function modelRoad(roadProps, rainfallIntensity) {
  const { runoffCoeff, drainageCapacity, catchmentArea, elevation, slope, historicalFlood } = roadProps;

  const Q = computeRunoff(runoffCoeff, rainfallIntensity, catchmentArea);
  const stress = computeDrainageStress(Q, drainageCapacity);
  const waterDepth = estimateWaterDepth(Q, drainageCapacity, catchmentArea);
  const riskLevel = getRiskLevel(stress);
  const probability = computeFloodProbability({
    rainfall: rainfallIntensity,
    elevation,
    slope,
    runoffCoeff,
    drainageStress: stress,
    historicalFlood: historicalFlood ?? false,
  });

  return {
    Q: Math.round(Q * 1000) / 1000,
    drainageStress: stress,
    waterDepth,
    riskLevel,
    floodProbability: Math.round(probability * 100),
  };
}

/**
 * Compute flood risk forecast for time steps
 * @param {Array} forecastRainfall - Array of {hour, intensity} objects
 * @param {Object} roadProps
 * @returns {Array} Risk per time step
 */
export function forecastRoadRisk(forecastRainfall, roadProps) {
  return forecastRainfall.map(step => ({
    ...step,
    ...modelRoad(roadProps, step.intensity),
  }));
}

/**
 * Get MapLibre line color based on risk level
 */
export function getRiskColor(riskLevel) {
  const colors = {
    LOW: '#16a34a',
    MODERATE: '#ca8a04',
    HIGH: '#ea580c',
    CRITICAL: '#dc2626',
  };
  return colors[riskLevel] || '#6b7280';
}

/**
 * Routing penalty factor for road risk (used in safer routing)
 */
export const ROUTING_PENALTIES = {
  LOW: 1.0,
  MODERATE: 1.5,
  HIGH: 5.0,
  CRITICAL: 20.0,
};
