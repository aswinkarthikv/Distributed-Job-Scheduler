import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Queues from './pages/Queues';
import Jobs from './pages/Jobs';
import Workers from './pages/Workers';
import FailedJobs from './pages/FailedJobs';
import DeadLetterQueue from './pages/DeadLetterQueue';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
                  <span className="font-bold text-xl text-white">DJS</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-wider text-slate-100">
                Distributed Job Scheduler
              </h1>
              <p className="text-sm text-slate-400 font-mono flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                Initializing Control Plane...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <BrowserRouter>
          <Routes>
            {/* Authentication Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Dashboard Layout and Pages */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="queues" element={<Queues />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="workers" element={<Workers />} />
              <Route path="failed-jobs" element={<FailedJobs />} />
              <Route path="dlq" element={<DeadLetterQueue />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
};
export default App;
