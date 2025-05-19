import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AdminHeader from '../components/layout/AdminHeader';

const AdminLayout = () => {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock user data (replace with your auth system)
  const user = {
    name: 'Admin User',
    email: 'admin@elegancevenues.com',
    // avatar: 'https://example.com/avatar.jpg', // Uncomment if available
  };

  const handleLogout = () => {
    // Implement logout logic (e.g., clear token, redirect to /logout)
    console.log('Logged out');
    window.location.href = '/logout';
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        toggleSidebar={toggleSidebar}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        user={user}
        handleLogout={handleLogout}
        sidebarOpen={sidebarOpen}
      />
      <main className="flex-grow bg-gray-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="bg-gray-800 text-white py-4 text-center">
        <p>© 2025 A One Cafe All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminLayout;