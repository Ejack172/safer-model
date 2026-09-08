import React from 'react';
import { Home, Map, Navigation, Bell, MoreHorizontal } from 'lucide-react';
import useAppStore from '../../store/appStore.js';
import HomeScreen      from '../../pages/mobile/HomeScreen.jsx';
import FloodMapScreen  from '../../pages/mobile/FloodMapScreen.jsx';
import RoutesScreen    from '../../pages/mobile/RoutesScreen.jsx';
import AlertsScreen    from '../../pages/mobile/AlertsScreen.jsx';
import TrendsScreen    from '../../pages/mobile/TrendsScreen.jsx';
import DrainageScreen  from '../../pages/mobile/DrainageScreen.jsx';

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',      Icon: Home          },
  { id: 'floodmap', label: 'Flood Map', Icon: Map           },
  { id: 'routes',   label: 'Routes',    Icon: Navigation    },
  { id: 'alerts',   label: 'Alerts',    Icon: Bell, badge: 2},
  { id: 'more',     label: 'More',      Icon: MoreHorizontal},
];

// Pages that want the full flex area (no outer scroll wrapper)
const FULL_HEIGHT_PAGES = new Set(['floodmap']);

function MoreMenu({ onSelect }) {
  return (
    <div className="mobile-content" style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>More</div>
      {[
        { id: 'more_trends',   label: 'Rainfall & Flood Risk Trend', icon: '📈', desc: 'View forecast charts' },
        { id: 'more_drainage', label: 'Drainage Status',             icon: '🌊', desc: 'Network capacity & stress' },
      ].map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          style={{
            width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: 14,
            padding: '14px 16px', marginBottom: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14,
            fontFamily: 'Inter, sans-serif', textAlign: 'left',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: 26 }}>{item.icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.desc}</div>
          </div>
        </button>
      ))}

      {/* Credits */}
      <div style={{ marginTop: 20, background: '#f8fafc', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>🌊 SAFER</div>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
          Smart AI Flood Early Response<br />
          SIH 2026 · Problem Statement 26085<br />
          Urban Flood Nowcasting System
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
          ⚠ Simulated Data · Not For Operational Use
        </div>
      </div>
    </div>
  );
}

export default function MobileApp() {
  const mobilePage    = useAppStore(s => s.mobilePage);
  const setMobilePage = useAppStore(s => s.setMobilePage);
  const alerts        = useAppStore(s => s.alerts);
  const overallRisk   = useAppStore(s => s.overallRisk);

  const activeNavId = ['home','floodmap','routes','alerts'].includes(mobilePage) ? mobilePage : 'more';
  const isFullHeight = FULL_HEIGHT_PAGES.has(mobilePage);

  const riskColors = { LOW: '#16a34a', MODERATE: '#ca8a04', HIGH: '#ea580c', CRITICAL: '#dc2626' };

  function renderScreen() {
    switch (mobilePage) {
      case 'home':          return <HomeScreen />;
      case 'floodmap':      return <FloodMapScreen />;
      case 'routes':        return <RoutesScreen />;
      case 'alerts':        return <AlertsScreen />;
      case 'more_trends':   return <TrendsScreen />;
      case 'more_drainage': return <DrainageScreen />;
      default:              return <MoreMenu onSelect={setMobilePage} />;
    }
  }

  const alertBadge = alerts.filter(a => a.type === 'CRITICAL' || a.type === 'HIGH').length;

  return (
    <div className="mobile-app">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 3px 10px rgba(37,99,235,0.4)',
            }}>🌊</div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>SAFER</div>
              <div style={{ color: '#93c5fd', fontSize: 9.5 }}>Smart AI Flood Early Response</div>
            </div>
          </div>

          {/* Right side: location + status */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#93c5fd', fontWeight: 500, marginBottom: 3 }}>📍 Kolkata</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
              <div className="status-online" />
              <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SIH Prototype banner ─────────────────────────────────────────── */}
      <div className="prototype-banner" style={{ padding: '5px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.04em' }}>
          SIH PROTOTYPE · SIMULATED DATA
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'white',
          background: riskColors[overallRisk],
          padding: '2px 7px', borderRadius: 5,
        }}>
          {overallRisk}
        </span>
      </div>

      {/* ── Screen content area ──────────────────────────────────────────── */}
      {isFullHeight
        /* Full-height screens (Flood Map) get flex:1 so the map fills the space */
        ? <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {renderScreen()}
          </div>
        /* Scrollable screens get mobile-content class */
        : renderScreen()
      }

      {/* ── Bottom Navigation ────────────────────────────────────────────── */}
      <nav className="mobile-nav">
        {NAV_ITEMS.map(({ id, label, Icon, badge }) => {
          const isActive = activeNavId === id;
          const dynamicBadge = id === 'alerts' ? (alertBadge || null) : (badge || null);
          return (
            <button
              key={id}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobilePage(id)}
            >
              <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} />
              <span>{label}</span>
              {dynamicBadge && !isActive && (
                <span className="nav-badge">{dynamicBadge > 9 ? '9+' : dynamicBadge}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
