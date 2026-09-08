import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, ReferenceLine } from 'recharts';
import useAppStore from '../../store/appStore.js';

const RISK_COLORS = {
  LOW: '#16a34a', MODERATE: '#ca8a04', HIGH: '#ea580c', CRITICAL: '#dc2626'
};

function CustomTooltipRainfall({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '2px 0 0', color: '#2563eb', fontSize: 12 }}>{payload[0].value} mm/hr</p>
    </div>
  );
}

export function RainfallChart({ compact = false }) {
  const forecast = useAppStore(s => s.rainfallForecast);
  const selectedStep = useAppStore(s => s.selectedTimeStep);

  return (
    <div>
      <ResponsiveContainer width="100%" height={compact ? 90 : 120}>
        <BarChart data={forecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltipRainfall />} />
          <Bar dataKey="intensity" radius={[5, 5, 0, 0]}>
            {forecast.map((entry, idx) => (
              <Cell key={idx} fill={idx === selectedStep ? '#2563eb' : '#93c5fd'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {!compact && forecast.map(f => (
        <div key={f.label} style={{ display: 'none' }}>
          <span>{f.label}: {f.intensity} mm</span>
        </div>
      ))}
    </div>
  );
}

const RISK_LINE_DATA = [
  { label: 'Now', value: 65, risk: 'HIGH' },
  { label: '+1h', value: 80, risk: 'HIGH' },
  { label: '+2h', value: 75, risk: 'HIGH' },
  { label: '+3h', value: 55, risk: 'MODERATE' },
];

function CustomDot({ cx, cy, payload }) {
  const color = RISK_COLORS[payload.risk] || '#94a3b8';
  return <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={2} />;
}

function CustomTooltipRisk({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const risk = payload[0]?.payload?.risk || 'LOW';
  const color = RISK_COLORS[risk];
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{label}</p>
      <p style={{ margin: '2px 0 0', color, fontSize: 12, fontWeight: 700 }}>{risk}</p>
    </div>
  );
}

export function FloodRiskChart({ compact = false }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={compact ? 90 : 120}>
        <LineChart data={RISK_LINE_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => v >= 75 ? 'Critical' : v >= 50 ? 'High' : v >= 25 ? 'Mod' : 'Low'}
            tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltipRisk />} />
          <ReferenceLine y={75} stroke="#dc262633" strokeDasharray="3 3" />
          <ReferenceLine y={50} stroke="#ea580c33" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#ea580c"
            strokeWidth={2.5}
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: '#ea580c', stroke: 'white', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {!compact && (
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0', fontStyle: 'italic' }}>
          ↑ Risk expected to remain high in next 2 hours due to continued rainfall.
        </p>
      )}
    </div>
  );
}
