import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserStats } from '../services/userStats';

const PROFICIENCY_LEVELS = [
  { value: 1, label: "Can't do", color: "bg-red-500", textColor: "text-red-400" },
  { value: 2, label: "Struggle", color: "bg-orange-500", textColor: "text-orange-400" },
  { value: 3, label: "Sometimes", color: "bg-yellow-500", textColor: "text-yellow-400" },
  { value: 4, label: "Usually", color: "bg-blue-500", textColor: "text-blue-400" },
  { value: 5, label: "Consistently", color: "bg-green-500", textColor: "text-green-400" }
];

export default function StatisticsModal({ isOpen, onClose, techs }) {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadUserStats(user.uid);
      } else {
        setUserStats({});
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Reload stats when modal opens to ensure fresh data
  useEffect(() => {
    if (isOpen && user) {
      loadUserStats(user.uid);
    }
  }, [isOpen, user]);

  const loadUserStats = async (userId) => {
    try {
      setLoading(true);
      const stats = await getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatsOverview = () => {
    const attemptedTechs = Object.keys(userStats).length;
    const ratedTechs = Object.values(userStats).filter(stat => stat.proficiencyLevel).length;
    const avgProficiency = ratedTechs > 0 
      ? Object.values(userStats)
          .filter(stat => stat.proficiencyLevel)
          .reduce((sum, stat) => sum + stat.proficiencyLevel, 0) / ratedTechs
      : 0;

    const proficiencyDistribution = PROFICIENCY_LEVELS.map(level => ({
      ...level,
      count: Object.values(userStats).filter(stat => stat.proficiencyLevel === level.value).length
    }));

    return {
      totalTechs: techs.length,
      attemptedTechs,
      ratedTechs,
      avgProficiency: avgProficiency.toFixed(1),
      proficiencyDistribution
    };
  };

  const getFilteredTechs = () => {
    return techs.filter(tech => {
      const techStats = userStats[tech.id];
      
      // Filter by proficiency level
      if (filterLevel !== 'all') {
        if (filterLevel === 'unrated') {
          if (techStats?.proficiencyLevel) return false;
        } else if (filterLevel === 'attempted') {
          if (!techStats?.attempted) return false;
        } else {
          if (techStats?.proficiencyLevel !== parseInt(filterLevel)) return false;
        }
      }
      
      return true;
    });
  };

  const stats = getStatsOverview();
  const filteredTechs = getFilteredTechs();

  if (!user) {
    return (
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
                className="relative bg-pr-dark p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
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

                <h2 className="text-2xl font-bold text-pr-neon mb-6">Statistics</h2>
                
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg mb-4">Please log in with Discord to view your statistics</p>
                  <p className="text-gray-500">Track your progress and proficiency across all parkour techs</p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
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
              className="relative bg-pr-dark p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
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

              <h2 className="text-2xl font-bold text-pr-neon mb-6">Statistics</h2>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading statistics...</p>
                </div>
              ) : (
                <>
                  {/* Overview Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-pr-neon">{stats.attemptedTechs}</div>
                      <div className="text-sm text-gray-400">Attempted</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-pr-neon">{stats.ratedTechs}</div>
                      <div className="text-sm text-gray-400">Rated</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-pr-neon">{stats.avgProficiency}</div>
                      <div className="text-sm text-gray-400">Avg Level</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-pr-neon">{stats.totalTechs}</div>
                      <div className="text-sm text-gray-400">Total Techs</div>
                    </div>
                  </div>

                  {/* Proficiency Distribution */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Proficiency Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      {stats.proficiencyDistribution.map(level => (
                        <div key={level.value} className="bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                            <span className="text-sm text-gray-300">{level.label}</span>
                          </div>
                          <div className="text-xl font-bold text-pr-neon">{level.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Filter by Proficiency</label>
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1"
                      >
                        <option value="all">All Techs</option>
                        <option value="attempted">Attempted Only</option>
                        <option value="unrated">Unrated Only</option>
                        {PROFICIENCY_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tech List */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Techs ({filteredTechs.length})
                    </h3>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredTechs.map(tech => {
                        const techStats = userStats[tech.id];
                        const proficiencyLevel = PROFICIENCY_LEVELS.find(l => l.value === techStats?.proficiencyLevel);
                        
                        return (
                          <div key={tech.id} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-white">{tech.name}</div>
                              <div className="text-sm text-gray-400">Difficulty {tech.difficulty}</div>
                            </div>
                            <div className="text-right">
                              {techStats?.attempted ? (
                                proficiencyLevel ? (
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${proficiencyLevel.color}`}></div>
                                    <span className={`text-sm ${proficiencyLevel.textColor}`}>
                                      {proficiencyLevel.label}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">Attempted</span>
                                )
                              ) : (
                                <span className="text-sm text-gray-500">Not attempted</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
