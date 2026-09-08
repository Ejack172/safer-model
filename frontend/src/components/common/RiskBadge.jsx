import React from 'react';

const RISK_CONFIG = {
  LOW:      { label: 'Low',      bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
  MODERATE: { label: 'Moderate', bg: '#fef3c7', text: '#a16207', dot: '#ca8a04' },
  HIGH:     { label: 'High',     bg: '#ffedd5', text: '#c2410c', dot: '#ea580c' },
  CRITICAL: { label: 'Critical', bg: '#fee2e2', text: '#b91c1c', dot: '#dc2626' },
};

export default function RiskBadge({ level = 'LOW', size = 'sm', showDot = false, pulse = false }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.LOW;
  const pxMap = { xs: '10px', sm: '12px', md: '13px', lg: '14px' };
  const pyMap = { xs: '1px 6px', sm: '2px 8px', md: '3px 10px', lg: '4px 12px' };

  return (
    <span
      className={level === 'CRITICAL' && pulse ? 'risk-critical-pulse' : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: cfg.bg,
        color: cfg.text,
        fontSize: pxMap[size],
        fontWeight: 700,
        padding: pyMap[size],
        borderRadius: 6,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {showDot && (
        <span style={{
          width: 7, height: 7,
          background: cfg.dot,
          borderRadius: '50%',
          display: 'inline-block',
        }} />
      )}
      {cfg.label}
    </span>
  );
}
