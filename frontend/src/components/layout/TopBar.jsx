import React from 'react';
import { MapPin, CloudRain, User, ChevronDown, Wifi } from 'lucide-react';
import useAppStore from '../../store/appStore.js';

export default function TopBar() {
  const rainfall = useAppStore(s => s.rainfall);
  const overallRisk = useAppStore(s => s.overallRisk);

  const riskColors = {
    LOW: '#16a34a', MODERATE: '#ca8a04', HIGH: '#ea580c', CRITICAL: '#dc2626'
  };

  return (
    <header style={{
      height: 60,
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
      zIndex: 9,
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    }}>
      {/* Brand text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', letterSpacing: '0.01em' }}>Urban Flood Nowcasting for Safer Cities</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>People · Data · Resilient Tomorrow</div>
      </div>

      {/* SIH Badge */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        border: '1px solid #f59e0b',
        borderRadius: 8,
        padding: '5px 12px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e', letterSpacing: '0.05em' }}>SIH 2026 PROTOTYPE</div>
        <div style={{ fontSize: 9, color: '#a16207', fontWeight: 500 }}>SIMULATED DATA · NOT FOR OPERATIONAL USE</div>
      </div>

      {/* Location */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 8, padding: '6px 12px', cursor: 'pointer'
      }}>
        <MapPin size={14} color="#2563eb" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Kolkata, West Bengal</span>
        <ChevronDown size={13} color="#94a3b8" />
      </div>

      {/* Weather */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#eff6ff', borderRadius: 8 }}>
        <CloudRain size={18} color="#2563eb" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>24°C</div>
          <div style={{ fontSize: 10, color: '#3b82f6' }}>Light Rain</div>
        </div>
      </div>

      {/* System status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="status-online" />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>System Online</div>
          <div style={{ fontSize: 9, color: '#64748b' }}>All sensors active</div>
        </div>
      </div>

      {/* Risk indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: `${riskColors[overallRisk]}15`,
        border: `1px solid ${riskColors[overallRisk]}40`,
        borderRadius: 8, padding: '5px 11px',
      }}>
        <Wifi size={13} color={riskColors[overallRisk]} />
        <span style={{ fontSize: 12, fontWeight: 700, color: riskColors[overallRisk] }}>{overallRisk} RISK</span>
      </div>

      {/* Profile */}
      <div style={{
        width: 36, height: 36,
        background: 'linear-gradient(135deg, #1e40af, #2563eb)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
      }}>
        <User size={18} color="white" />
      </div>
    </header>
  );
}
