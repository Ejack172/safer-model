import React, { useState } from 'react';
import { RainfallChart, FloodRiskChart } from '../../components/charts/FloodCharts.jsx';
import useAppStore from '../../store/appStore.js';

export default function TrendsScreen() {
  const [activeTab, setActiveTab] = useState('rainfall');

  return (
    <div className="mobile-content" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '14px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>← Rainfall & Flood Risk Trend</div>
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3, gap: 2 }}>
          {['rainfall', 'floodrisk'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '7px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? '#0f172a' : '#64748b',
                fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab === 'rainfall' ? 'Rainfall' : 'Flood Risk'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {activeTab === 'rainfall' && (
          <div className="slide-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🌧</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Rainfall Forecast (Next 3 Hours)</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>mm/hr</div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 14, padding: '14px 12px', marginBottom: 16 }}>
              <RainfallChart />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
                {[{ label: 'Now', v: 24 }, { label: '+1h', v: 32 }, { label: '+2h', v: 28 }, { label: '+3h', v: 18 }].map(d => (
                  <div key={d.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1d4ed8' }}>{d.v}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'floodrisk' && (
          <div className="slide-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>📈</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Flood Risk Trend</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Next 3 hours</div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 14, padding: '14px 12px', marginBottom: 16 }}>
              <FloodRiskChart />
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10 }}>
                {[{ label: 'Now', risk: 'Moderate' }, { label: '+1h', risk: 'High' }, { label: '+2h', risk: 'High' }, { label: '+3h', risk: 'Moderate' }].map(d => (
                  <div key={d.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{d.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: d.risk === 'High' ? '#ea580c' : '#ca8a04' }}>{d.risk}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{
          background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px',
          fontSize: 12, color: '#92400e',
        }}>
          <strong>Note:</strong> This is simulated data for the SIH 2026 prototype. Actual conditions may vary.
        </div>
      </div>
    </div>
  );
}
