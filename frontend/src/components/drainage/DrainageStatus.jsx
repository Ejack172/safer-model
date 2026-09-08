import React from 'react';
import { Waves, TriangleAlert, TrendingUp } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import RiskBadge from '../common/RiskBadge.jsx';

const STATUS_COLORS = {
  HIGH:     { bg: '#fee2e2', text: '#b91c1c', label: 'High' },
  MODERATE: { bg: '#fef3c7', text: '#a16207', label: 'Moderate' },
  NORMAL:   { bg: '#dcfce7', text: '#15803d', label: 'Normal' },
};

export default function DrainageStatus({ compact = false }) {
  const drainagePoints = useAppStore(s => s.drainagePoints);

  return (
    <div>
      {drainagePoints.map(d => {
        const stress = d.computedStress ?? d.baseStress;
        const status = stress >= 75 ? 'HIGH' : stress >= 50 ? 'MODERATE' : 'NORMAL';
        const cfg = STATUS_COLORS[status];
        return (
          <div key={d.id} style={{
            display: 'flex', alignItems: 'center', gap: compact ? 6 : 8,
            padding: compact ? '6px 0' : '7px 0',
            borderBottom: '1px solid #f1f5f9',
          }}>
            <Waves size={14} color={cfg.text} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{d.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{
                background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700,
                padding: '2px 7px', borderRadius: 5,
              }}>{cfg.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', minWidth: 32, textAlign: 'right' }}>{stress}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
