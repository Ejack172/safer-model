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
        // t=50ms: initial model computation (populates computedRisk in store)
        setTimeout(recomputeModel, 50);
        // t=1500ms: safety net — ensures the Zustand subscription in FloodMap
        // (registered inside map.on('load')) receives at least one update with
        // fully-computed risk values. MapLibre 'load' can take 1-2s in production.
        setTimeout(recomputeModel, 1500);
      })
      .catch(err => console.error('SAFER: Data load failed:', err));
  }, []);

  // Mobile: render mobile experience
  if (isMobile) return <MobileApp />;

  // Desktop: render full dashboard
  return <Dashboard />;
}
