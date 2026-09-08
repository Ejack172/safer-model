import React from 'react';
import { Home, Map, Navigation, Bell, Waves, BarChart2, Settings } from 'lucide-react';
import useAppStore from '../../store/appStore.js';

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',            Icon: Home },
  { id: 'floodmap', label: 'Flood Map',       Icon: Map },
  { id: 'routes',   label: 'Safer Routes',    Icon: Navigation },
  { id: 'alerts',   label: 'Alerts',          Icon: Bell, badge: 3 },
  { id: 'drainage', label: 'Drainage Status', Icon: Waves },
  { id: 'reports',  label: 'Reports',         Icon: BarChart2 },
  { id: 'settings', label: 'Settings',        Icon: Settings },
];

export default function Sidebar() {
  const activeNav = useAppStore(s => s.activeNav);
  const setActiveNav = useAppStore(s => s.setActiveNav);

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'linear-gradient(180deg, #0f1f3d 0%, #162040 60%, #0f1f3d 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 12px',
      flexShrink: 0,
      boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 8px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 4px 12px rgba(37,99,235,0.5)',
          }}>🌊</div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 20, letterSpacing: '0.02em', lineHeight: 1 }}>SAFER</div>
            <div style={{ color: '#93c5fd', fontSize: 10, fontWeight: 500, lineHeight: 1.3, marginTop: 2 }}>Smart AI Flood Early Response</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV_ITEMS.map(({ id, label, Icon, badge }) => (
          <div
            key={id}
            className={`nav-item ${activeNav === id ? 'active' : ''}`}
            onClick={() => setActiveNav(id)}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
            {badge && activeNav !== id && <span className="badge">{badge}</span>}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 8px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💡</div>
          <div>
            <div style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>SAFER</div>
            <div style={{ color: '#93c5fd', fontSize: 10 }}>Safer People. Stronger Cities.</div>
          </div>
        </div>
        <div style={{ color: '#475569', fontSize: 10, textAlign: 'center' }}>Smart India Hackathon 2026</div>
        <div style={{ color: '#475569', fontSize: 10, textAlign: 'center' }}>Disaster Management</div>
      </div>
    </aside>
  );
}
