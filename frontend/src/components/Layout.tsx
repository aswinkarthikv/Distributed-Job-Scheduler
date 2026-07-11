import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/AuthStore';
import { useProjectStore } from '../store/ProjectStore';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const Layout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { fetchProjects } = useProjectStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main console content */}
      <div className="flex flex-col flex-grow overflow-hidden">
        <Navbar />
        <main className="flex-grow overflow-y-auto p-8 max-w-[1600px] w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
export default Layout;
