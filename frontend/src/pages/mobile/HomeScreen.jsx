import React from 'react';
import { MapPin, Droplets, Gauge, TriangleAlert, ChevronRight, TrendingUp } from 'lucide-react';
import FloodMap from '../../components/map/FloodMap.jsx';
import RiskLegend from '../../components/map/RiskLegend.jsx';
import RainfallSimulator from '../../components/common/RainfallSimulator.jsx';
import useAppStore from '../../store/appStore.js';

export default function HomeScreen() {
  const rainfall = useAppStore(s => s.rainfall);
  const overallRisk = useAppStore(s => s.overallRisk);
  const overallWaterDepth = useAppStore(s => s.overallWaterDepth);
  const overallDrainageStress = useAppStore(s => s.overallDrainageStress);
  const currentLocation = useAppStore(s => s.currentLocation);

  const riskColors = {
    LOW: '#16a34a', MODERATE: '#ca8a04', HIGH: '#ea580c', CRITICAL: '#dc2626',
  };
  const riskBg = {
    LOW: '#f0fdf4', MODERATE: '#fefce8', HIGH: '#fff7ed', CRITICAL: '#fff1f2',
  };

  return (
    <div className="mobile-content">
      {/* ── Map ─────────────────────────────────────────────────────────────── */}
      <div style={{ height: 280, position: 'relative', flexShrink: 0 }}>
        <FloodMap mobile />
        {/* Legend bottom-left */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 5 }}>
          <RiskLegend compact />
        </div>
      </div>

      {/* ── Current location card (floating above map seam) ─────────────────── */}
      <div style={{
        background: 'white',
        margin: '0 12px',
        marginTop: -18,
        borderRadius: 14,
        padding: '11px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
        zIndex: 5,
        border: '1px solid #f1f5f9',
      }}>
        <div style={{
          width: 34, height: 34, background: '#eff6ff',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <MapPin size={17} color="#2563eb" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Location</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentLocation}</div>
        </div>
        <ChevronRight size={15} color="#94a3b8" />
      </div>

      {/* ── Metrics row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '12px 12px 0' }}>
        <MetricCard
          emoji="🌧"
          label="Rainfall"
          sub="last 1 hr"
          value={`${rainfall} mm`}
          bg="#eff6ff"
          valueColor="#1d4ed8"
        />
        <MetricCard
          emoji="⚠️"
          label="Flood Risk"
          sub=""
          value={overallRisk}
          bg={riskBg[overallRisk]}
          valueColor={riskColors[overallRisk]}
          pulse={overallRisk === 'CRITICAL'}
        />
        <MetricCard
          emoji="💧"
          label="Est. Water Depth"
          sub=""
          value={`${overallWaterDepth} m`}
          bg="#f0f9ff"
          valueColor="#0369a1"
        />
        <MetricCard
          emoji="📊"
          label="Drainage Stress"
          sub=""
          value={`${overallDrainageStress}%`}
          bg="#eef2ff"
          valueColor="#4f46e5"
          extraInfo={overallDrainageStress >= 75 ? '↑ High' : overallDrainageStress >= 50 ? '↑ Rising' : '↔ Stable'}
          extraColor={overallDrainageStress >= 75 ? '#dc2626' : overallDrainageStress >= 50 ? '#ea580c' : '#16a34a'}
        />
      </div>

      {/* ── Trend indicator ─────────────────────────────────────────────────── */}
      {(overallRisk === 'HIGH' || overallRisk === 'CRITICAL') && (
        <div style={{
          margin: '12px 12px 0',
          background: `linear-gradient(135deg, ${riskBg[overallRisk]}, #ffffff)`,
          border: `1px solid ${riskColors[overallRisk]}40`,
          borderRadius: 12, padding: '10px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <TriangleAlert size={17} color={riskColors[overallRisk]} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: riskColors[overallRisk], marginBottom: 2 }}>
              {overallRisk === 'CRITICAL' ? '🚨 Critical Flood Risk!' : '⚠ High Flood Risk Ahead!'}
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Heavy rainfall and poor drainage detected. Avoid unnecessary travel.
            </div>
          </div>
        </div>
      )}

      {/* ── Rainfall Simulator ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 12 }}>
        <RainfallSimulator />
      </div>

      {/* ── Bottom spacer ───────────────────────────────────────────────────── */}
      <div style={{ height: 8 }} />
    </div>
  );
}

function MetricCard({ emoji, label, sub, value, bg, valueColor, pulse, extraInfo, extraColor }) {
  return (
    <div style={{
      background: bg || 'white',
      borderRadius: 14,
      padding: '13px 14px',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8' }}>{sub}</div>}
      <div style={{
        fontSize: 20, fontWeight: 800,
        color: valueColor || '#0f172a',
        marginTop: 3, lineHeight: 1.1,
        animation: pulse ? 'pulse-risk 1.8s ease-in-out infinite' : 'none',
      }}>
        {value}
      </div>
      {extraInfo && (
        <div style={{ fontSize: 11, fontWeight: 600, color: extraColor, marginTop: 3 }}>{extraInfo}</div>
      )}
    </div>
  );
}
