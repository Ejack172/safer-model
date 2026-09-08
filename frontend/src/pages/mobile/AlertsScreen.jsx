import React from 'react';
import { ArrowLeft, TriangleAlert, MapPin, TrendingUp, Gauge } from 'lucide-react';
import RiskBadge from '../../components/common/RiskBadge.jsx';
import useAppStore from '../../store/appStore.js';

export default function AlertsScreen() {
  const overallRisk = useAppStore(s => s.overallRisk);
  const overallDrainageStress = useAppStore(s => s.overallDrainageStress);
  const overallWaterDepth = useAppStore(s => s.overallWaterDepth);
  const rainfall = useAppStore(s => s.rainfall);
  const alerts = useAppStore(s => s.alerts);
  const currentLocation = useAppStore(s => s.currentLocation);

  return (
    <div className="mobile-content" style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>← Area Warning</div>
      </div>

      {/* Main warning card */}
      <div style={{ margin: 16 }}>
        <div style={{
          background: 'linear-gradient(135deg, #b91c1c, #dc2626)',
          borderRadius: 16, padding: '16px 18px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
          boxShadow: '0 6px 24px rgba(220,38,38,0.35)',
        }}>
          <TriangleAlert size={28} color="white" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 6 }}>High Flood Risk Ahead!</div>
            <div style={{ fontSize: 13, color: '#fecaca' }}>Heavy rainfall and poor drainage detected in your selected area.</div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div style={{ margin: '0 16px', background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #f1f5f9', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <MapPin size={15} color="#2563eb" />
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{currentLocation}</div>
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>Nowcast (Next 3 Hours)</div>
      </div>

      {/* Risk metrics */}
      <div style={{ margin: '0 16px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricRow icon="⚠️" label="Flood Risk" value={overallRisk} valueColor="#ea580c" />
        <MetricRow icon="💧" label="Est. Water Depth" value={`${overallWaterDepth}–${(overallWaterDepth + 0.15).toFixed(2)} m`} valueColor="#0369a1" />
        <MetricRow icon={<Gauge size={16} color="#6366f1" />} label="Drainage Stress" value={`${overallDrainageStress}%`} valueColor="#4f46e5" />
        <MetricRow icon="📈" label="Trend" value="Increasing" valueColor="#ea580c" />
      </div>

      {/* Be Cautious card */}
      <div style={{ margin: '0 16px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <TriangleAlert size={16} color="#ea580c" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#c2410c' }}>Be Cautious</span>
        </div>
        {['Avoid unnecessary travel', 'Use safer alternate routes', 'Follow local authority instructions'].map(tip => (
          <div key={tip} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
            <span style={{ color: '#ea580c', fontSize: 13, marginTop: 1 }}>•</span>
            <span style={{ fontSize: 13, color: '#92400e' }}>{tip}</span>
          </div>
        ))}
      </div>

      {/* All alerts list */}
      <div style={{ margin: '0 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Active Alerts</div>
        {alerts.map(alert => {
          const typeColors = { CRITICAL: '#dc2626', HIGH: '#ea580c', MODERATE: '#ca8a04' };
          return (
            <div key={alert.id} style={{
              background: 'white', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
              borderLeft: `4px solid ${typeColors[alert.type] || '#94a3b8'}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{alert.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{alert.detail}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{alert.location} · {alert.time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricRow({ icon, label, value, valueColor }) {
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {typeof icon === 'string' ? <span style={{ fontSize: 16 }}>{icon}</span> : icon}
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: valueColor || '#0f172a' }}>{value}</div>
    </div>
  );
}
