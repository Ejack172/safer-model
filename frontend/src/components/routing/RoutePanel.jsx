import React, { useState } from 'react';
import { Navigation, ArrowUpDown, LocateFixed, TriangleAlert, Droplets, Gauge, Activity } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import { computeSaferRoute, KOLKATA_LOCATIONS } from '../../engine/routingEngine.js';
import RiskBadge from '../common/RiskBadge.jsx';

export default function RoutePanel() {
  const [loading, setLoading] = useState(false);
  const routeFrom = useAppStore(s => s.routeFrom);
  const routeTo = useAppStore(s => s.routeTo);
  const routeResult = useAppStore(s => s.routeResult);
  const routePreference = useAppStore(s => s.routePreference);
  const setRouteFrom = useAppStore(s => s.setRouteFrom);
  const setRouteTo = useAppStore(s => s.setRouteTo);
  const setRouteResult = useAppStore(s => s.setRouteResult);
  const setRoutePreference = useAppStore(s => s.setRoutePreference);
  const clearRoute = useAppStore(s => s.clearRoute);
  const roads = useAppStore(s => s.roads);
  const overallRisk = useAppStore(s => s.overallRisk);
  const rainfall = useAppStore(s => s.rainfall);
  const overallDrainageStress = useAppStore(s => s.overallDrainageStress);
  const overallWaterDepth = useAppStore(s => s.overallWaterDepth);
  const currentLocation = useAppStore(s => s.currentLocation);

  const riskColors = { LOW: '#16a34a', MODERATE: '#ca8a04', HIGH: '#ea580c', CRITICAL: '#dc2626' };

  const handleFindRoute = () => {
    if (!routeTo) return;
    setLoading(true);
    const roadRisks = {};
    roads.forEach(r => { roadRisks[r.properties.name] = r.properties.computedRisk; });
    setTimeout(() => {
      const result = computeSaferRoute(routeFrom, routeTo, roadRisks, routePreference);
      setRouteResult(result);
      setLoading(false);
    }, 800);
  };

  const swapLocations = () => {
    const tmp = routeFrom;
    setRouteFrom(routeTo);
    setRouteTo(tmp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Route Planner */}
      <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Navigation size={16} color="#2563eb" />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Plan a Safer Route</span>
        </div>

        {/* From */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ width: 10, height: 10, background: '#2563eb', borderRadius: '50%', flexShrink: 0 }} />
            <input
              value={routeFrom}
              onChange={e => setRouteFrom(e.target.value)}
              placeholder="My Location"
              style={{
                flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px',
                fontSize: 13, color: '#0f172a', outline: 'none', fontFamily: 'Inter, sans-serif',
              }}
              list="locations-from"
            />
            <button onClick={swapLocations} title="Swap" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        {/* To */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ width: 10, height: 10, background: '#dc2626', borderRadius: '50%', flexShrink: 0 }} />
            <input
              value={routeTo}
              onChange={e => setRouteTo(e.target.value)}
              placeholder="Enter destination (e.g. Howrah Station)"
              style={{
                flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px',
                fontSize: 13, color: '#0f172a', outline: 'none', fontFamily: 'Inter, sans-serif',
              }}
              list="locations-to"
            />
          </div>
          <datalist id="locations-from">
            {KOLKATA_LOCATIONS.map(l => <option key={l.id} value={l.name} />)}
          </datalist>
          <datalist id="locations-to">
            {KOLKATA_LOCATIONS.map(l => <option key={l.id} value={l.name} />)}
          </datalist>
        </div>

        {/* Find Route Button */}
        <button
          onClick={handleFindRoute}
          disabled={loading || !routeTo}
          className="btn-press"
          style={{
            width: '100%', padding: '11px 16px',
            background: routeTo ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#94a3b8',
            color: 'white', border: 'none', borderRadius: 10, cursor: routeTo ? 'pointer' : 'not-allowed',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: routeTo ? '0 4px 14px rgba(22,163,74,0.4)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {loading ? <div className="spinner" /> : <><Navigation size={15} /> Find Safer Route</>}
        </button>

        {/* Route Preference */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Route Preference</div>
          {['safest', 'fastest'].map(pref => (
            <label key={pref} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="radio"
                name="routePref"
                value={pref}
                checked={routePreference === pref}
                onChange={() => setRoutePreference(pref)}
                style={{ accentColor: '#2563eb' }}
              />
              <span style={{ color: '#374151', fontWeight: routePreference === pref ? 600 : 400 }}>
                {pref === 'safest' ? 'Safest (Avoid high-risk roads)' : 'Fastest (with risk info)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Route Result */}
      {routeResult && (
        <div style={{ background: 'white', borderRadius: 14, padding: 14, border: '1px solid #e2e8f0' }} className="slide-up">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Route Options</div>

          {/* Normal route */}
          <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Direct Route</span>
              <RiskBadge level={routeResult.normal.riskLevel} size="xs" />
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{routeResult.normal.distance} km · {routeResult.normal.duration} min</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{routeResult.normal.path}</div>
          </div>

          {/* Safer route */}
          <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 10, padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>✓ Recommended Safer Route</span>
              <RiskBadge level={routeResult.safer.riskLevel} size="xs" />
            </div>
            <div style={{ fontSize: 11, color: '#374151' }}>{routeResult.safer.distance} km · {routeResult.safer.duration} min</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{routeResult.safer.path}</div>
            {routeResult.safer.avoidedRoads.length > 0 && (
              <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>
                Avoids: {routeResult.safer.avoidedRoads.join(', ')}
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
            Risk: {routeResult.riskReduction} · +{routeResult.extraDistance} km for safety
          </div>
          <button onClick={clearRoute} style={{ width: '100%', marginTop: 8, border: '1px solid #e2e8f0', background: 'none', borderRadius: 8, padding: '6px', fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}>
            Clear Route
          </button>
        </div>
      )}

      {/* Warning card */}
      <div style={{
        background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
        border: '1px solid #fecaca',
        borderRadius: 14, padding: 14,
        display: 'flex', gap: 10,
      }}>
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          <TriangleAlert size={20} color="#dc2626" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c', marginBottom: 3 }}>High Flood Risk in Your Area</div>
          <div style={{ fontSize: 12, color: '#991b1b' }}>Heavy rainfall and poor drainage detected. Avoid unnecessary travel.</div>
        </div>
      </div>

      {/* Current location metrics */}
      <div style={{ background: 'white', borderRadius: 14, padding: 14, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <LocateFixed size={14} color="#2563eb" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Current Location: {currentLocation}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MetricTile icon={<Droplets size={16} color="#2563eb" />} label="Rainfall" value={`${rainfall} mm`} sub="last 1 hr" />
          <MetricTile icon={<span style={{ fontSize: 16 }}>⚠️</span>} label="Flood Risk" value={overallRisk} sub="" valueColor={riskColors[overallRisk]} />
          <MetricTile icon={<Droplets size={16} color="#0ea5e9" />} label="Est. Water Depth" value={`${overallWaterDepth} m`} sub="" />
          <MetricTile icon={<Gauge size={16} color="#6366f1" />} label="Drainage Stress" value={`${overallDrainageStress}%`} sub="" />
        </div>
      </div>
    </div>
  );
}

function MetricTile({ icon, label, value, sub, valueColor }) {
  return (
    <div style={{
      background: '#f8fafc', borderRadius: 10, padding: '10px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center',
    }}>
      {icon}
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: valueColor || '#0f172a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8' }}>{sub}</div>}
    </div>
  );
}
