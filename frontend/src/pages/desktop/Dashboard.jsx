import React, { useEffect, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import TopBar from '../../components/layout/TopBar.jsx';
import FloodMap from '../../components/map/FloodMap.jsx';
import RiskLegend from '../../components/map/RiskLegend.jsx';
import RoutePanel from '../../components/routing/RoutePanel.jsx';
import DrainageStatus from '../../components/drainage/DrainageStatus.jsx';
import { RainfallChart, FloodRiskChart } from '../../components/charts/FloodCharts.jsx';
import useAppStore from '../../store/appStore.js';

const TIME_STEPS = ['Now', '+1h', '+2h', '+3h'];

export default function Dashboard() {
  const selectedTimeStep = useAppStore(s => s.selectedTimeStep);
  const setSelectedTimeStep = useAppStore(s => s.setSelectedTimeStep);
  const alerts = useAppStore(s => s.alerts);
  const rainfall = useAppStore(s => s.rainfall);
  const setRainfall = useAppStore(s => s.setRainfall);
  const roads = useAppStore(s => s.roads);
  const isSimulating = useAppStore(s => s.isSimulating);

  const [searchQuery, setSearchQuery] = useState('');
  const dataLoaded = roads.length > 0;

  const alertTypeColors = { CRITICAL: '#dc2626', HIGH: '#ea580c', MODERATE: '#ca8a04', LOW: '#16a34a' };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <TopBar />

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Map + bottom strip */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Map area */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {/* Map toolbar */}
              <div style={{
                position: 'absolute', top: 12, left: 12, right: 12, zIndex: 5,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {/* Search bar */}
                <div style={{
                  flex: 1, maxWidth: 380,
                  background: 'white', borderRadius: 10, padding: '9px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0',
                }}>
                  <Search size={15} color="#94a3b8" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search location (e.g. area, landmark, road)..."
                    style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', flex: 1, fontFamily: 'Inter, sans-serif', background: 'transparent' }}
                  />
                </div>

                {/* Time selector */}
                <div style={{
                  background: 'rgba(15,31,61,0.88)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 10, padding: '5px 6px',
                  display: 'flex', gap: 4,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
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

                {/* Date/time */}
                <div style={{
                  background: 'rgba(15,31,61,0.88)', backdropFilter: 'blur(8px)',
                  borderRadius: 10, padding: '6px 14px', color: 'white',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{dateStr}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.02em' }}>{timeStr}</div>
                </div>

                {isSimulating && (
                  <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: '#a16207' }}>
                    ⚙ Simulating…
                  </div>
                )}
              </div>

              {/* Rainfall slider (overlay) */}
              <div style={{
                position: 'absolute', bottom: 14, left: 12, zIndex: 5,
                background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(6px)',
                borderRadius: 12, padding: '10px 14px', minWidth: 220,
                boxShadow: '0 2px 14px rgba(0,0,0,0.14)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>☔ Rainfall Intensity</span>
                  <span style={{ color: '#2563eb' }}>{rainfall} mm/hr</span>
                </div>
                <input
                  type="range" min={0} max={80} value={rainfall}
                  onChange={e => setRainfall(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                  <span>0</span><span>Light</span><span>Heavy</span><span>80</span>
                </div>
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, textAlign: 'center', fontStyle: 'italic' }}>
                  SIH 2026 · Simulated Data
                </div>
              </div>

              {/* Risk Legend */}
              <div style={{ position: 'absolute', bottom: 14, left: 250, zIndex: 5 }}>
                <RiskLegend />
              </div>

              {/* Map */}
              {dataLoaded && <FloodMap />}
              {!dataLoaded && (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 14, color: '#64748b' }}>Loading map data…</div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Dashboard Strip */}
            <div style={{
              height: 220,
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: 0,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {/* Rainfall Trend */}
              <DashCard icon="🌧" title="Rainfall Trend (Next 3 Hours)" subtitle="mm/hr" style={{ flex: 1 }}>
                <RainfallChart compact />
              </DashCard>

              <div style={{ width: 1, background: '#e2e8f0', flexShrink: 0 }} />

              {/* Flood Risk Trend */}
              <DashCard icon="📈" title="Flood Risk Trend" style={{ flex: 1 }}>
                <FloodRiskChart compact />
              </DashCard>

              <div style={{ width: 1, background: '#e2e8f0', flexShrink: 0 }} />

              {/* Drainage Status */}
              <DashCard icon="🔵" title="Drainage Network Status" action={<a href="#" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>View Details <ArrowRight size={11} /></a>} style={{ flex: 1, overflowY: 'auto' }}>
                <DrainageStatus compact />
              </DashCard>

              <div style={{ width: 1, background: '#e2e8f0', flexShrink: 0 }} />

              {/* Alerts */}
              <DashCard icon="🔔" title="Latest Alerts" action={<a href="#" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>View All <ArrowRight size={11} /></a>} style={{ flex: 1, overflowY: 'auto' }}>
                {alerts.slice(0, 4).map(alert => (
                  <div key={alert.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: alertTypeColors[alert.type],
                      marginTop: 4, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{alert.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{alert.detail}</div>
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{alert.time}</div>
                  </div>
                ))}
              </DashCard>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{
            width: 300,
            background: '#f1f5f9',
            borderLeft: '1px solid #e2e8f0',
            padding: 14,
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            <RoutePanel />
          </div>
        </div>
      </div>
    </div>
  );
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
