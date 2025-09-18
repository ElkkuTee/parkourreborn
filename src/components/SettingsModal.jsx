import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitch from './ThemeSwitch';

export default function SettingsModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md
              bg-white dark:bg-pr-dark rounded-lg shadow-xl z-50 p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white">Settings</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-medium mb-4 dark:text-white">Theme</h3>
                <ThemeSwitch />
              </div>
              {/* Placeholder for future settings sections */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}