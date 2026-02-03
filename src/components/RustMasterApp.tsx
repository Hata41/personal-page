import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dashboard } from './RustMaster/Dashboard';
import { ChallengeLab } from './RustMaster/ChallengeLab';

/**
 * Main RustMaster Application Component.
 *
 * This is the root component that orchestrates the entire Rust learning experience.
 * It manages the application state and handles navigation between different views:
 * - Dashboard: Overview of learning progress and SRS queue
 * - Challenge Lab: Interactive coding challenges for specific concepts
 *
 * The app fetches curriculum and user state data from the backend API.
 * It maintains user progress state and syncs changes back to the server.
 */
export function RustMasterApp() {
  // Application state management
  const [curriculum, setCurriculum] = useState(null);
  const [userState, setUserState] = useState(null);
  const [currentView, setCurrentView] = useState<'dashboard' | string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data from backend...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('http://localhost:8000/api/lattice', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Data fetched successfully:', data);
        setCurriculum(data.curriculum);
        setUserState(data.user_state);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.name === 'AbortError') {
          setError('Request timed out. Make sure the backend server is running on port 8000.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading RustMaster...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Connection Error</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <p className="text-sm text-zinc-500">Make sure the RustMaster backend is running on port 8000.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Smooth page transitions using Framer Motion */}
      <AnimatePresence mode="wait">
        {/* Dashboard View: Main learning overview */}
        {currentView === 'dashboard' && (
          <Dashboard
            curriculum={curriculum}
            userState={userState}
            onNavigate={setCurrentView}
          />
        )}

        {/* Challenge Lab View: Interactive coding challenges */}
        {currentView.startsWith('challenge-') && (
          <ChallengeLab
            nodeSlug={currentView.replace('challenge-', '')}
            onClose={() => setCurrentView('dashboard')}
            curriculum={curriculum}
            userState={userState}
          />
        )}
      </AnimatePresence>
    </div>
  );
}