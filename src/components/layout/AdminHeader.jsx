import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User2, ChevronDown, LogOut, Settings, Calendar, LayoutDashboard, MapPin, Clock, Tag, Utensils, Users, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

const AdminHeader = ({
  toggleSidebar,
  userMenuOpen,
  setUserMenuOpen,
  user,
  logoutAdmin, // Prop may be missing or incorrect
  sidebarOpen,
}) => {
  const [localUser, setLocalUser] = useState(null);
  const menuRef = useRef(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const inactivityTimeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const navigate = useNavigate();
  const { logoutAdmin: contextLogoutAdmin } = useAuth(); // Fallback to context

  // Use prop if provided, otherwise use context
  const logoutFunction = logoutAdmin || contextLogoutAdmin;

  // Inactivity settings
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 1 minute for testing
  const WARNING_TIME = 3 * 1000; // 30 seconds before logout

  // Debug props
  useEffect(() => {
    console.log('AdminHeader props:', { logoutAdmin, user, userMenuOpen, sidebarOpen });
    if (!logoutAdmin) {
      console.warn('logoutAdmin prop is missing or not a function. Using contextLogoutAdmin.');
    }
  }, [logoutAdmin]);

  // Fetch admin data from localStorage
  const fetchUserFromStorage = () => {
    try {
      const storedAdmin = localStorage.getItem('admin');
      if (storedAdmin) {
        const parsedAdmin = JSON.parse(storedAdmin);
        return {
          name: parsedAdmin.name || 'Admin',
          email: parsedAdmin.email || 'No email provided',
          avatar: parsedAdmin.avatar || null,
        };
      }
      return {
        name: 'Admin',
        email: 'No email provided',
        avatar: null,
      };
    } catch (error) {
      console.error('Error parsing admin from localStorage:', error);
      return {
        name: 'Admin',
        email: 'No email provided',
        avatar: null,
      };
    }
  };

  // Reset inactivity timer on user activity
  const resetInactivityTimer = () => {
    // console.log('Resetting inactivity timer');
    lastActivityRef.current = Date.now();
    setWarningOpen(false);
    clearTimeout(warningTimeoutRef.current);
    clearTimeout(inactivityTimeoutRef.current);

    warningTimeoutRef.current = setTimeout(() => {
      // console.log('Showing timeout warning');
      setWarningOpen(true);
    }, INACTIVITY_LIMIT - WARNING_TIME);

    inactivityTimeoutRef.current = setTimeout(() => {
      // console.log('Executing auto logout');
      toast.info('Session timed out due to inactivity');
      handleAutoLogout();
    }, INACTIVITY_LIMIT);
  };

  // Handle auto logout
  const handleAutoLogout = async () => {
    try {
      if (typeof logoutFunction !== 'function') {
        throw new Error('logoutAdmin is not a function');
      }
      await logoutFunction();
      setUserMenuOpen(false);
      setLocalUser(null);
      navigate('/aonecafe/admin/login', { replace: true });
    } catch (error) {
      console.error('Auto logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  // Handle user activity events
  useEffect(() => {
    const handleActivity = () => {
      resetInactivityTimer();
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleActivity));

    resetInactivityTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(warningTimeoutRef.current);
      clearTimeout(inactivityTimeoutRef.current);
    };
  }, []);

  // Initialize localUser and listen for storage changes
  useEffect(() => {
    setLocalUser(fetchUserFromStorage());

    const handleStorageChange = (event) => {
      if (event.key === 'admin') {
        console.log('localStorage admin updated:', event.newValue);
        setLocalUser(fetchUserFromStorage());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen, setUserMenuOpen]);

  const navItems = [
    { name: 'Dashboard', path: '/aonecafe/admin/dashboard', icon: LayoutDashboard },
    { name: 'Bookings', path: '/aonecafe/admin/bookings', icon: Calendar },
    { name: 'Events', path: '/aonecafe/admin/events', icon: PartyPopper },
    { name: 'Venues', path: '/aonecafe/admin/venues', icon: MapPin },
    { name: 'Shifts', path: '/aonecafe/admin/shifts', icon: Clock },
    { name: 'Packages', path: '/aonecafe/admin/packages', icon: Tag },
    { name: 'Menus', path: '/aonecafe/admin/menus', icon: Utensils },
    { name: 'Users', path: '/aonecafe/admin/users', icon: Users },
  ];

  const displayUser = user || localUser || { name: 'Admin', email: 'No email provided', avatar: null };
  const halfName = displayUser.name.split(' ')[0];

  return (
    <header className="sticky top-0 z-20 flex items-center h-20 bg-gradient-to-r from-primary-600 to-primary-700 px-4 md:px-8 backdrop-blur-xs shadow-lg">
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="text-white hover:text-primary-400 transition-colors md:hidden"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <Menu className="h-8 w-8" />
        </button>
        <Link to="/aonecafe/admin/dashboard" className="text-2xl font-extrabold text-white flex items-center hover:text-primary-400 transition-colors">
          <Calendar className="h-7 w-7 text-primary-400 mr-2" />
          A One Cafe
        </Link>
      </div>

      {/* Center navigation */}
      <nav className="hidden md:flex items-center justify-center flex-1 space-x-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center text-white hover:text-primary-400 text-sm font-medium transition-colors"
            title={item.name}
          >
            <item.icon className="h-5 w-5 mr-1" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Right section with user menu */}
      <div className="flex items-center">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 focus:outline-none"
            aria-label="Toggle user menu"
            aria-expanded={userMenuOpen}
            title="User menu"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-800 flex items-center justify-center text-white border-2 border-transparent gradient-border hover:shadow-glow transition-all duration-300">
              <img
                src={displayUser.avatar || '/avatar.png'}
                alt="Admin avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="hidden md:flex md:items-center">
              <span className="text-base font-semibold text-white mr-1">
                {`Hello ${halfName}`}
              </span>
              <ChevronDown className="h-5 w-5 text-white" />
            </div>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200/50"
              >
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">{displayUser.name}</p>
                  <p className="text-xs text-gray-500">{displayUser.email}</p>
                </div>
                <Link
                  to="/aonecafe/admin/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User2 className="h-4 w-4 mr-2" />
                  Your Profile
                </Link>
                <Link
                  to="/aonecafe/admin/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={async () => {
                    try {
                      await logoutFunction();
                      setUserMenuOpen(false);
                      navigate('/aonecafe/admin/login', { replace: true });
                    } catch (error) {
                      console.error('Manual logout failed:', error);
                      toast.error('Failed to log out. Please try again.');
                    }
                  }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-error-50 hover:text-error-700 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {warningOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-800">Session Timeout Warning</h3>
              <p className="text-sm text-gray-600 mt-2">
                Your session will expire in 30 seconds due to inactivity. Do you want to stay logged in?
              </p>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  onClick={async () => {
                    await handleAutoLogout();
                    setWarningOpen(false);
                  }}
                  className="px-4 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg"
                >
                  Log Out
                </button>
                <button
                  onClick={resetInactivityTimer}
                  className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                >
                  Stay Logged In
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AdminHeader;