import React from 'react';
import { X } from 'lucide-react';
import FloodMap from '../../components/map/FloodMap.jsx';
import RiskBadge from '../../components/common/RiskBadge.jsx';
import useAppStore from '../../store/appStore.js';
import { getRiskColor } from '../../engine/floodModel.js';

const TIME_STEPS = ['Now', '+1h', '+2h', '+3h'];

export default function FloodMapScreen() {
  const selectedTimeStep = useAppStore(s => s.selectedTimeStep);
  const setSelectedTimeStep = useAppStore(s => s.setSelectedTimeStep);
  const selectedRoad = useAppStore(s => s.selectedRoad);
  const clearSelectedRoad = useAppStore(s => s.clearSelectedRoad);
  const rainfall = useAppStore(s => s.setRainfall);

  const road = selectedRoad?.properties;
  const riskColor = road ? getRiskColor(road.computedRisk || road.baseRisk) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── Time selector (floating above map) ─────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(15,31,61,0.9)', backdropFilter: 'blur(8px)',
        borderRadius: 12, padding: '5px 6px',
        display: 'flex', gap: 4,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}>
        {TIME_STEPS.map((t, i) => (
          <button
            key={t}
            className={`time-tab ${selectedTimeStep === i ? 'active' : ''}`}
            onClick={() => setSelectedTimeStep(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Full-screen map ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <FloodMap mobile />
      </div>

      {/* ── Road detail popup card (slides up from bottom) ──────────────────── */}
      {selectedRoad && road && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'white',
          borderRadius: '18px 18px 0 0',
          padding: '16px 16px 24px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          zIndex: 10,
        }} className="slide-up">
          {/* Handle */}
          <div style={{ width: 36, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 14px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{road.name}</div>
              <RiskBadge level={road.computedRisk || road.baseRisk} size="sm" />
            </div>
            <button
              onClick={clearSelectedRoad}
              style={{
                border: 'none', background: '#f1f5f9', borderRadius: '50%',
                width: 30, height: 30, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} color="#64748b" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <PopupRow label="Est. Water Depth" value={`${road.waterDepth ?? '—'} m`} />
            <PopupRow label="Drainage Stress"  value={`${road.drainageStress ?? '—'}%`} />
            <PopupRow label="Peak Runoff (Q)"  value={`${road.Q ?? '—'} m³/s`} />
            <PopupRow label="Trend"            value="↑ Increasing" valueColor="#ea580c" />
          </div>

          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
            C={road.runoffCoeff} · Elevation: {road.elevation}m · Area: {road.catchmentArea}km²
            <br /><em>SIH 2026 · Q = C × i × A (Rational Method)</em>
          </div>

          <button style={{
            width: '100%',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white', border: 'none', borderRadius: 12, padding: '12px 0',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
          }}>
            View Engineering Details
          </button>
        </div>
      )}
    </div>
  );
}

function PopupRow({ label, value, valueColor }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '9px 11px' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: valueColor || '#0f172a' }}>{value}</div>
    </div>
  );
}
