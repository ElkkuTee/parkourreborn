import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import StatisticsModal from './StatisticsModal';

export default function AccountModal({ isOpen, onClose, techs }) {
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative bg-white dark:bg-pr-dark p-6 rounded-lg shadow-lg w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-pr-neon transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account</h2>
                
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setIsStatsOpen(true);
                      onClose();
                    }}
                    className="w-full p-4 bg-pr-neon text-white rounded-lg hover:opacity-90 transition-opacity text-left"
                  >
                    <div className="font-semibold">View Statistics</div>
                    <div className="text-sm opacity-90">Track your tech proficiency and progress</div>
                  </button>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                      More account features coming soon!
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <StatisticsModal 
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)} 
        techs={techs || []}
      />
    </>
  );
}
