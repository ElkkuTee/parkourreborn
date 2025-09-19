import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getAuth } from 'firebase/auth';

export default function HamburgerMenu({ currentPage, setCurrentPage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return;
      
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/check', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const menuItems = [
    { id: 'techs', icon: '📜', label: 'Tech List' },
    { id: 'account', icon: '📊', label: 'Stats' },
    { id: 'contributions', icon: '🤝', label: 'Contributions' },
    { id: 'about', icon: 'ℹ️', label: 'About' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
    ...(isAdmin ? [{ id: 'admin', icon: '👑', label: 'Admin Panel' }] : [])
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 text-gray-600 hover:text-pr-neon dark:text-gray-300 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Side Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 left-0 w-64 h-full bg-white dark:bg-pr-dark z-50 shadow-lg"
          >
            <div className="p-4 space-y-4">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left text-white p-3 rounded-lg flex items-center space-x-3 transition-colors
                    ${currentPage === item.id 
                      ? 'bg-pr-neon text-white' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
