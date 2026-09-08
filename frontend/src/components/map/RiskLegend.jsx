import React from 'react';

const LEGEND_ITEMS = [
  { color: '#16a34a', label: 'Low Risk' },
  { color: '#ca8a04', label: 'Moderate Risk' },
  { color: '#ea580c', label: 'High Risk' },
  { color: '#dc2626', label: 'Critical Risk' },
];

export default function RiskLegend({ compact = false }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(6px)',
      borderRadius: 10,
      padding: compact ? '8px 10px' : '10px 14px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
      border: '1px solid rgba(255,255,255,0.8)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Flood Risk (Roads)
      </div>
      {LEGEND_ITEMS.map(item => (
        <div key={item.color} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 5,
            background: item.color,
            borderRadius: 3,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
