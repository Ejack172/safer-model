import React, { useState } from 'react';
import { Navigation, ArrowUpDown, Clock, Shield } from 'lucide-react';
import FloodMap from '../../components/map/FloodMap.jsx';
import RiskBadge from '../../components/common/RiskBadge.jsx';
import useAppStore from '../../store/appStore.js';
import { computeSaferRoute, KOLKATA_LOCATIONS } from '../../engine/routingEngine.js';

export default function RoutesScreen() {
  const [loading, setLoading] = useState(false);

  const routeFrom       = useAppStore(s => s.routeFrom);
  const routeTo         = useAppStore(s => s.routeTo);
  const routeResult     = useAppStore(s => s.routeResult);
  const setRouteFrom    = useAppStore(s => s.setRouteFrom);
  const setRouteTo      = useAppStore(s => s.setRouteTo);
  const setRouteResult  = useAppStore(s => s.setRouteResult);
  const clearRoute      = useAppStore(s => s.clearRoute);
  const roads           = useAppStore(s => s.roads);

  const handleFind = () => {
    if (!routeTo.trim()) return;
    setLoading(true);
    const roadRisks = {};
    roads.forEach(r => { roadRisks[r.properties.name] = r.properties.computedRisk; });
    setTimeout(() => {
      const result = computeSaferRoute(routeFrom, routeTo, roadRisks, 'safest');
      setRouteResult(result);
      setLoading(false);
    }, 700);
  };

  const swap = () => { const t = routeFrom; setRouteFrom(routeTo); setRouteTo(t); };

  return (
    <div className="mobile-content">

      {/* ── Input panel ────────────────────────────────────────────────────── */}
      <div style={{ background: 'white', padding: '14px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
        {/* From */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 11, height: 11, background: '#2563eb', borderRadius: '50%', flexShrink: 0 }} />
          <input
            value={routeFrom}
            onChange={e => setRouteFrom(e.target.value)}
            placeholder="My Location"
            list="m-locs-from"
            style={inputStyle}
          />
          <button onClick={swap} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <ArrowUpDown size={18} color="#94a3b8" />
          </button>
        </div>

        {/* To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 11, height: 11, background: '#dc2626', borderRadius: '50%', flexShrink: 0 }} />
          <input
            value={routeTo}
            onChange={e => setRouteTo(e.target.value)}
            placeholder="Enter destination (e.g. Howrah Station)"
            list="m-locs-to"
            style={inputStyle}
          />
        </div>

        <datalist id="m-locs-from">{KOLKATA_LOCATIONS.map(l => <option key={l.id} value={l.name} />)}</datalist>
        <datalist id="m-locs-to">{KOLKATA_LOCATIONS.map(l => <option key={l.id} value={l.name} />)}</datalist>

        <button
          onClick={handleFind}
          disabled={loading || !routeTo.trim()}
          style={{
            width: '100%', padding: '12px 0', border: 'none', borderRadius: 12,
            background: routeTo.trim()
              ? 'linear-gradient(135deg, #16a34a, #15803d)'
              : '#e2e8f0',
            color: routeTo.trim() ? 'white' : '#94a3b8',
            fontSize: 14, fontWeight: 700, cursor: routeTo.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: routeTo.trim() ? '0 4px 14px rgba(22,163,74,0.35)' : 'none',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
          }}
        >
          {loading
            ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Computing safer route…</>
            : <><Navigation size={15} /> Find Safer Route</>
          }
        </button>
      </div>

      {/* ── Map ──────────────────────────────────────────────────────────────── */}
      <div style={{ height: 250, position: 'relative', flexShrink: 0 }}>
        <FloodMap mobile showRoute={!!routeResult} />

        {/* Route legend overlay */}
        {routeResult && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 5,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)',
            borderRadius: 10, padding: '8px 12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          }}>
            <LegendRow color="#2563eb" dash={false} label="Safer Route"       />
            <LegendRow color="#dc2626" dash={true}  label="Avoided (High Risk)" />
          </div>
        )}
      </div>

      {/* ── Route result card ──────────────────────────────────────────────── */}
      {routeResult && (
        <div style={{ margin: '12px 12px 0', background: 'white', borderRadius: 16, padding: '14px 16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }} className="slide-up">
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>✅ Recommended Safer Route</div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <StatBox icon={<Clock size={14} color="#16a34a" />} value={`${routeResult.safer.duration} min`} sub={`${routeResult.safer.distance} km`} />
            <StatBox icon={<Shield size={14} color="#16a34a" />} value={<RiskBadge level={routeResult.safer.riskLevel} size="xs" />} sub="Risk level" />
          </div>

          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            📍 {routeResult.safer.path}
          </div>

          {routeResult.safer.avoidedRoads?.length > 0 && (
            <div style={{ background: '#fff1f2', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#b91c1c', marginBottom: 8 }}>
              ⚠ Avoids: {routeResult.safer.avoidedRoads.join(', ')}
            </div>
          )}

          <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 10 }}>
            Risk: {routeResult.riskReduction} · +{routeResult.extraDistance} km for safety
          </div>

          {/* Normal route comparison */}
          <div style={{ background: '#fff5f5', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>Alternative Direct Route</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#374151' }}>{routeResult.normal.distance} km · {routeResult.normal.duration} min</span>
              <RiskBadge level={routeResult.normal.riskLevel} size="xs" />
            </div>
          </div>

          <button
            onClick={clearRoute}
            style={{ width: '100%', border: '1px solid #e2e8f0', background: 'none', borderRadius: 10, padding: 9, fontSize: 12, color: '#94a3b8', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            Clear Route
          </button>
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}

function LegendRow({ color, dash, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
      <div style={{
        width: 24, height: 4,
        background: dash ? 'none' : color,
        backgroundImage: dash ? `repeating-linear-gradient(90deg,${color} 0 6px,transparent 6px 10px)` : 'none',
        borderRadius: 2,
      }} />
      <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function StatBox({ icon, value, sub }) {
  return (
    <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{sub}</div>
    </div>
  );
}

const inputStyle = {
  flex: 1,
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: '9px 12px',
  fontSize: 13,
  color: '#0f172a',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  background: '#f8fafc',
};
