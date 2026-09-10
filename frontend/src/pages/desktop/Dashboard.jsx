import React, { useState } from 'react';
import { Search, ArrowRight, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import TopBar from '../../components/layout/TopBar.jsx';
import FloodMap from '../../components/map/FloodMap.jsx';
import RiskLegend from '../../components/map/RiskLegend.jsx';
import RoutePanel from '../../components/routing/RoutePanel.jsx';
import DrainageStatus from '../../components/drainage/DrainageStatus.jsx';
import { RainfallChart, FloodRiskChart } from '../../components/charts/FloodCharts.jsx';
import useAppStore from '../../store/appStore.js';

const TIME_STEPS = ['Now', '+1h', '+2h', '+3h'];

// ── Desktop content views keyed by activeNav ──────────────────────────────────

/** Shared bottom analytics strip used by Home + Flood Map views */
function BottomStrip({ alerts, alertTypeColors }) {
  return (
    <div style={{
      height: 220, background: '#f8fafc', borderTop: '1px solid #e2e8f0',
      display: 'flex', overflow: 'hidden', flexShrink: 0,
    }}>
      <DashCard icon="🌧" title="Rainfall Trend (Next 3 Hours)" subtitle="mm/hr" style={{ flex: 1 }}>
        <RainfallChart compact />
      </DashCard>
      <Divider />
      <DashCard icon="📈" title="Flood Risk Trend" style={{ flex: 1 }}>
        <FloodRiskChart compact />
      </DashCard>
      <Divider />
      <DashCard icon="🔵" title="Drainage Network Status" action={<ViewAll />} style={{ flex: 1, overflowY: 'auto' }}>
        <DrainageStatus compact />
      </DashCard>
      <Divider />
      <DashCard icon="🔔" title="Latest Alerts" action={<ViewAll label="View All" />} style={{ flex: 1, overflowY: 'auto' }}>
        {alerts.slice(0, 4).map(alert => (
          <div key={alert.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: alertTypeColors[alert.type], marginTop: 4, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{alert.title}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{alert.detail}</div>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{alert.time}</div>
          </div>
        ))}
      </DashCard>
    </div>
  );
}

/** Home view — map + route panel + bottom strip */
function HomeView({ rainfall, setRainfall, selectedTimeStep, setSelectedTimeStep, isSimulating, alerts, alertTypeColors }) {
  const roads = useAppStore(s => s.roads);
  const [searchQuery, setSearchQuery] = useState('');
  const dataLoaded = roads.length > 0;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Map + bottom strip */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, maxWidth: 380, background: 'white', borderRadius: 10, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0' }}>
              <Search size={15} color="#94a3b8" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search location (e.g. area, landmark, road)..." style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', flex: 1, fontFamily: 'Inter, sans-serif', background: 'transparent' }} />
            </div>
            <div style={{ background: 'rgba(15,31,61,0.88)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '5px 6px', display: 'flex', gap: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
              {TIME_STEPS.map((t, i) => (
                <button key={t} className={`time-tab ${selectedTimeStep === i ? 'active' : ''}`} onClick={() => setSelectedTimeStep(i)}>{t}</button>
              ))}
            </div>
            <div style={{ background: 'rgba(15,31,61,0.88)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '6px 14px', color: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{dateStr}</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{timeStr}</div>
            </div>
            {isSimulating && <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: '#a16207' }}>⚙ Simulating…</div>}
          </div>
          {/* Rainfall slider */}
          <div style={{ position: 'absolute', bottom: 14, left: 12, zIndex: 5, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(6px)', borderRadius: 12, padding: '10px 14px', minWidth: 220, boxShadow: '0 2px 14px rgba(0,0,0,0.14)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>☔ Rainfall Intensity</span>
              <span style={{ color: '#2563eb' }}>{rainfall} mm/hr</span>
            </div>
            <input type="range" min={0} max={80} value={rainfall} onChange={e => setRainfall(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
              <span>0</span><span>Light</span><span>Heavy</span><span>80</span>
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, textAlign: 'center', fontStyle: 'italic' }}>SIH 2026 · Simulated Data</div>
          </div>
          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 14, left: 250, zIndex: 5 }}><RiskLegend /></div>
          {/* Map */}
          {dataLoaded && <FloodMap />}
          {!dataLoaded && <LoadingMap />}
        </div>
        <BottomStrip alerts={alerts} alertTypeColors={alertTypeColors} />
      </div>
      {/* Right route panel */}
      <div style={{ width: 300, background: '#f1f5f9', borderLeft: '1px solid #e2e8f0', padding: 14, overflowY: 'auto', flexShrink: 0 }}>
        <RoutePanel />
      </div>
    </div>
  );
}

/** Flood Map view — full map + route panel, no bottom strip clutter */
function FloodMapView({ rainfall, setRainfall, selectedTimeStep, setSelectedTimeStep, isSimulating }) {
  const roads = useAppStore(s => s.roads);
  const dataLoaded = roads.length > 0;
  const [searchQuery, setSearchQuery] = useState('');
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, maxWidth: 380, background: 'white', borderRadius: 10, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0' }}>
            <Search size={15} color="#94a3b8" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search location..." style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', flex: 1, fontFamily: 'Inter, sans-serif', background: 'transparent' }} />
          </div>
          <div style={{ background: 'rgba(15,31,61,0.88)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '5px 6px', display: 'flex', gap: 4 }}>
            {TIME_STEPS.map((t, i) => (
              <button key={t} className={`time-tab ${selectedTimeStep === i ? 'active' : ''}`} onClick={() => setSelectedTimeStep(i)}>{t}</button>
            ))}
          </div>
          <div style={{ background: 'rgba(15,31,61,0.88)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '6px 14px', color: 'white' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{dateStr}</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{timeStr}</div>
          </div>
          {isSimulating && <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: '#a16207' }}>⚙ Simulating…</div>}
        </div>
        {/* Rainfall slider */}
        <div style={{ position: 'absolute', bottom: 14, left: 12, zIndex: 5, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(6px)', borderRadius: 12, padding: '10px 14px', minWidth: 220, boxShadow: '0 2px 14px rgba(0,0,0,0.14)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>☔ Rainfall Intensity</span><span style={{ color: '#2563eb' }}>{rainfall} mm/hr</span>
          </div>
          <input type="range" min={0} max={80} value={rainfall} onChange={e => setRainfall(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 2 }}><span>0</span><span>Light</span><span>Heavy</span><span>80</span></div>
          <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, textAlign: 'center', fontStyle: 'italic' }}>SIH 2026 · Simulated Data</div>
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 250, zIndex: 5 }}><RiskLegend /></div>
        {dataLoaded ? <FloodMap /> : <LoadingMap />}
      </div>
      <div style={{ width: 300, background: '#f1f5f9', borderLeft: '1px solid #e2e8f0', padding: 14, overflowY: 'auto', flexShrink: 0 }}>
        <RoutePanel />
      </div>
    </div>
  );
}

/** Routes view */
function RoutesView() {
  const roads = useAppStore(s => s.roads);
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {roads.length > 0 ? <FloodMap showRoute /> : <LoadingMap />}
        <div style={{ position: 'absolute', bottom: 14, left: 12, zIndex: 5 }}><RiskLegend /></div>
      </div>
      <div style={{ width: 360, background: '#f1f5f9', borderLeft: '1px solid #e2e8f0', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
        <RoutePanel />
      </div>
    </div>
  );
}

/** Alerts view */
function AlertsView({ alerts, alertTypeColors }) {
  const overallRisk = useAppStore(s => s.overallRisk);
  const overallWaterDepth = useAppStore(s => s.overallWaterDepth);
  const overallDrainageStress = useAppStore(s => s.overallDrainageStress);
  const rainfall = useAppStore(s => s.rainfall);
  const riskColors = { LOW: '#16a34a', MODERATE: '#ca8a04', HIGH: '#ea580c', CRITICAL: '#dc2626' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#f8fafc' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>🔔 Active Alerts & Warnings</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Live alerts generated from flood model simulation · SIH 2026 Prototype</p>

        {/* Metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Rainfall', value: `${rainfall} mm/hr`, color: '#1d4ed8', bg: '#eff6ff' },
            { label: 'Flood Risk', value: overallRisk, color: riskColors[overallRisk], bg: '#fff7ed' },
            { label: 'Water Depth', value: `${overallWaterDepth} m`, color: '#0369a1', bg: '#f0f9ff' },
            { label: 'Drainage Stress', value: `${overallDrainageStress}%`, color: '#4f46e5', bg: '#eef2ff' },
          ].map(m => (
            <div key={m.label} style={{ background: m.bg, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: m.color, marginTop: 4 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Alert list */}
        {alerts.length === 0
          ? <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>✅ No active alerts</div>
          : alerts.map(alert => (
            <div key={alert.id} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', marginBottom: 10, borderLeft: `4px solid ${alertTypeColors[alert.type] || '#94a3b8'}`, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{alert.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{alert.detail}</div>
                  {alert.location && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>📍 {alert.location}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: alertTypeColors[alert.type], background: alertTypeColors[alert.type] + '18', padding: '3px 9px', borderRadius: 6 }}>{alert.type}</span>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{alert.time}</div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

/** Drainage view */
function DrainageView() {
  const drainagePoints = useAppStore(s => s.drainagePoints);
  const STATUS_STYLES = {
    HIGH:     { bg: '#fee2e2', text: '#b91c1c', bar: '#dc2626', label: 'High' },
    MODERATE: { bg: '#fef3c7', text: '#a16207', bar: '#ca8a04', label: 'Moderate' },
    NORMAL:   { bg: '#dcfce7', text: '#15803d', bar: '#16a34a', label: 'Normal' },
  };
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#f8fafc' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>🌊 Drainage Network Status</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Real-time drainage capacity and stress simulation · SIH 2026 Prototype</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 14 }}>
          {drainagePoints.map(d => {
            const stress = d.computedStress ?? d.baseStress;
            const status = stress >= 75 ? 'HIGH' : stress >= 50 ? 'MODERATE' : 'NORMAL';
            const cfg = STATUS_STYLES[status];
            return (
              <div key={d.id} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div><div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{d.name}</div><div style={{ fontSize: 12, color: '#64748b' }}>{d.zone} Zone</div></div>
                  <span style={{ background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>{cfg.label}</span>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Drainage Stress</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.bar }}>{stress}%</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stress}%`, background: cfg.bar, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{d.description}</div>
                {d.notes && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{d.notes}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Reports view */
function ReportsView() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#f8fafc' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>📊 Flood Risk Reports & Analytics</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Trend analysis and flood risk summary · SIH 2026 Prototype</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>🌧 Rainfall Trend (Next 3 Hours)</div>
            <RainfallChart />
          </div>
          <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>📈 Flood Risk Trend</div>
            <FloodRiskChart />
          </div>
          <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', gridColumn: '1/-1' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>🔵 Drainage Network Status</div>
            <DrainageStatus />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Settings view */
function SettingsView() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#f8fafc' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>⚙ Settings</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Prototype configuration · SIH 2026</p>
        {[
          { label: 'Application Mode', value: 'Prototype / Simulated Data', note: 'Switch to Live APIs when credentials are available' },
          { label: 'Study Area', value: 'Kolkata, West Bengal, India', note: 'Coordinates: 22.5726°N, 88.3639°E' },
          { label: 'Flood Model', value: 'Rational Method (Q = C × i × A)', note: 'Runoff coefficients calibrated for Kolkata urban areas' },
          { label: 'Time Horizon', value: '0 – 3 hours nowcast', note: '4 discrete time steps: Now, +1h, +2h, +3h' },
          { label: 'Map Tile Source', value: 'OpenStreetMap (raster)', note: 'No API key required. Upgrade to MapTiler/Mapbox for vector tiles.' },
          { label: 'Routing Engine', value: 'Simulated (Rational Method–weighted)', note: 'Replace api.js with OpenRouteService for real routing' },
          { label: 'Data Status', value: 'All data is SIMULATED', note: 'DO NOT use for operational flood emergency response' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '14px 18px', marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{s.note}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', textAlign: 'right', flexShrink: 0 }}>{s.value}</div>
          </div>
        ))}
        <div style={{ marginTop: 20, background: '#fff7ed', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#92400e', border: '1px solid #fed7aa' }}>
          ⚠ <strong>SIH 2026 Prototype</strong> — Problem Statement 26085 · Urban Flood Nowcasting System · Simulated Data Only
        </div>
      </div>
    </div>
  );
}

// ── Shared helpers ──────────────────────────────────────────────────────────────
function LoadingMap() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, color: '#64748b' }}>Loading map data…</div>
      </div>
    </div>
  );
}
function Divider() {
  return <div style={{ width: 1, background: '#e2e8f0', flexShrink: 0 }} />;
}
function ViewAll({ label = 'View Details' }) {
  return <a href="#" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>{label} <ArrowRight size={11} /></a>;
}
function DashCard({ icon, title, subtitle, action, children, style = {} }) {
  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', minWidth: 0, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 10, color: '#64748b' }}>{subtitle}</div>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const activeNav           = useAppStore(s => s.activeNav);
  const selectedTimeStep    = useAppStore(s => s.selectedTimeStep);
  const setSelectedTimeStep = useAppStore(s => s.setSelectedTimeStep);
  const alerts              = useAppStore(s => s.alerts);
  const rainfall            = useAppStore(s => s.rainfall);
  const setRainfall         = useAppStore(s => s.setRainfall);
  const isSimulating        = useAppStore(s => s.isSimulating);

  const alertTypeColors = { CRITICAL: '#dc2626', HIGH: '#ea580c', MODERATE: '#ca8a04', LOW: '#16a34a' };
  const shared = { rainfall, setRainfall, selectedTimeStep, setSelectedTimeStep, isSimulating, alerts, alertTypeColors };

  /** Route the center content based on sidebar selection */
  function renderContent() {
    switch (activeNav) {
      case 'floodmap':  return <FloodMapView {...shared} />;
      case 'routes':    return <RoutesView />;
      case 'alerts':    return <AlertsView alerts={alerts} alertTypeColors={alertTypeColors} />;
      case 'drainage':  return <DrainageView />;
      case 'reports':   return <ReportsView />;
      case 'settings':  return <SettingsView />;
      default:          return <HomeView {...shared} />; // 'home'
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
