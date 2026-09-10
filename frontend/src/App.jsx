import React, { useEffect, useState } from 'react';
import Dashboard from './pages/desktop/Dashboard.jsx';
import MobileApp from './components/layout/MobileApp.jsx';
import useAppStore from './store/appStore.js';
import { fetchRoads, fetchDrainage } from './services/api.js';

// Responsive breakpoint for mobile
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function App() {
  const isMobile = useIsMobile();
  const setRoads = useAppStore(s => s.setRoads);
  const setDrainagePoints = useAppStore(s => s.setDrainagePoints);
  const recomputeModel = useAppStore(s => s.recomputeModel);

  // Load data once at app level (shared between desktop + mobile)
  useEffect(() => {
    Promise.all([fetchRoads(), fetchDrainage()])
      .then(([roadsData, drainageData]) => {
        setRoads(roadsData.features || []);
        setDrainagePoints(drainageData);
        // First pass: compute model immediately so store has riskLevels
        setTimeout(recomputeModel, 50);
        // Second pass: re-push data after MapLibre has processed the source
        // (covers the edge case where setData fires before the map 'load' event)
        setTimeout(recomputeModel, 800);
      })
      .catch(err => console.error('SAFER: Data load failed:', err));
  }, []);

  // Mobile: render mobile experience
  if (isMobile) return <MobileApp />;

  // Desktop: render full dashboard
  return <Dashboard />;
}
