import React from 'react';
import { Waves, ChevronRight } from 'lucide-react';
import useAppStore from '../../store/appStore.js';

const STATUS_LABELS = { HIGH: 'High', MODERATE: 'Moderate', NORMAL: 'Normal' };
const STATUS_STYLES = {
  HIGH:     { bg: '#fee2e2', text: '#b91c1c', bar: '#dc2626' },
  MODERATE: { bg: '#fef3c7', text: '#a16207', bar: '#ca8a04' },
  NORMAL:   { bg: '#dcfce7', text: '#15803d', bar: '#16a34a' },
};

export default function DrainageScreen() {
  const drainagePoints = useAppStore(s => s.drainagePoints);

  return (
    <div className="mobile-content" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>← Drainage Status</div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {drainagePoints.map(d => {
          const stress = d.computedStress ?? d.baseStress;
          const status = stress >= 75 ? 'HIGH' : stress >= 50 ? 'MODERATE' : 'NORMAL';
          const cfg = STATUS_STYLES[status];
          return (
            <div key={d.id} style={{
              background: 'white', borderRadius: 14, padding: '14px 16px', marginBottom: 10,
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, background: cfg.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Waves size={18} color={cfg.bar} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{d.zone} Zone</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 700,
                    padding: '3px 9px', borderRadius: 6,
                  }}>{STATUS_LABELS[status]}</span>
                  <ChevronRight size={15} color="#94a3b8" />
                </div>
              </div>

              {/* Stress bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Drainage Stress</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.bar }}>{stress}%</span>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${stress}%`, background: cfg.bar,
                    borderRadius: 3, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#64748b' }}>{d.description}</div>
              {d.notes && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{d.notes}</div>}
            </div>
          );
        })}

        {/* Info note */}
        <div style={{ background: '#eff6ff', borderRadius: 12, padding: '10px 14px', marginTop: 4, fontSize: 12, color: '#1d4ed8' }}>
          Drainage stress indicates how full the drainage network is based on real-time and forecasted flow.
          <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 4, fontStyle: 'italic' }}>SIH 2026 Prototype · Simulated Data</div>
        </div>
      </div>
    </div>
  );
}
