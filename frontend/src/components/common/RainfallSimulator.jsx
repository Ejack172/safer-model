import React, { useState } from 'react';
import { CloudRain } from 'lucide-react';
import useAppStore from '../../store/appStore.js';

/**
 * Compact rainfall intensity slider for mobile home screen
 * Allows the user to simulate different rainfall conditions
 */
export default function RainfallSimulator() {
  const rainfall = useAppStore(s => s.rainfall);
  const setRainfall = useAppStore(s => s.setRainfall);
  const isSimulating = useAppStore(s => s.isSimulating);
  const [expanded, setExpanded] = useState(false);

  const intensity = rainfall < 15 ? 'Light' : rainfall < 30 ? 'Moderate' : rainfall < 50 ? 'Heavy' : 'Extreme';
  const intensityColor = rainfall < 15 ? '#16a34a' : rainfall < 30 ? '#ca8a04' : rainfall < 50 ? '#ea580c' : '#dc2626';

  return (
    <div style={{
      margin: '0 12px 12px',
      background: 'white',
      borderRadius: 14,
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
    }}>
      {/* Header — tap to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloudRain size={16} color="#2563eb" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
            Simulate Rainfall
          </span>
          {isSimulating && (
            <span style={{ fontSize: 10, color: '#ca8a04', fontWeight: 600 }}>⚙ Computing…</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: intensityColor,
            background: `${intensityColor}15`,
            padding: '2px 8px',
            borderRadius: 6,
          }}>
            {rainfall} mm/hr · {intensity}
          </span>
          <span style={{ fontSize: 14, color: '#94a3b8', transition: 'transform 0.2s', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : '' }}>▾</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }} className="slide-up">
          <input
            type="range"
            min={0}
            max={80}
            step={2}
            value={rainfall}
            onChange={e => setRainfall(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer', marginBottom: 6 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
            <span>0 — Dry</span>
            <span>20 — Light</span>
            <span>40 — Heavy</span>
            <span>80 — Extreme</span>
          </div>
          <div style={{
            marginTop: 10,
            background: '#f8fafc',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 11,
            color: '#64748b',
            fontStyle: 'italic',
          }}>
            ℹ Adjusting rainfall recomputes flood risk across all roads and drainage points using Q = C × i × A (Rational Method).
            <strong style={{ display: 'block', marginTop: 3, color: '#f59e0b' }}>SIH 2026 Prototype · Simulated Data Only</strong>
          </div>
        </div>
      )}
    </div>
  );
}
