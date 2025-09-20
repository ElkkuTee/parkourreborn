import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { updateTechProficiency, removeTechProficiency } from '../services/userStats';

const PROFICIENCY_LEVELS = [
  { value: 1, label: "I can't do this tech", color: "bg-red-500" },
  { value: 2, label: "I struggle with this tech", color: "bg-orange-500" },
  { value: 3, label: "I can sometimes do this tech", color: "bg-yellow-500" },
  { value: 4, label: "I can usually do this tech", color: "bg-blue-500" },
  { value: 5, label: "I can consistently do this tech", color: "bg-green-500" }
];

export default function TechProficiency({ tech, userStats, onStatsUpdate }) {
  const [user, setUser] = useState(null);
  const [currentStats, setCurrentStats] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userStats && tech) {
      setCurrentStats(userStats[tech.id] || null);
    }
  }, [userStats, tech]);

  const handleProficiencyChange = async (level) => {
    if (!user || !tech) return;
    
    setUpdating(true);
    try {
      await updateTechProficiency(user.uid, tech.id, level, true);
      setCurrentStats({ proficiencyLevel: level, attempted: true });
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error updating proficiency:', error);
      alert('Failed to update proficiency. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAttemptedToggle = async () => {
    if (!user || !tech) return;
    
    setUpdating(true);
    try {
      if (currentStats?.attempted) {
        // Remove the tech proficiency entirely
        await removeTechProficiency(user.uid, tech.id);
        setCurrentStats(null);
      } else {
        // Mark as attempted without proficiency level
        await updateTechProficiency(user.uid, tech.id, null, true);
        setCurrentStats({ attempted: true, proficiencyLevel: null });
      }
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error updating attempted status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveProficiency = async () => {
    if (!user || !tech || !currentStats) return;
    
    setUpdating(true);
    try {
      await removeTechProficiency(user.uid, tech.id);
      setCurrentStats(null);
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error removing proficiency:', error);
      alert('Failed to remove proficiency. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-pr-neon mb-3">Tech Proficiency</h3>
        <p className="text-gray-400 text-center">
          Please log in with Discord to track your proficiency
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-pr-neon mb-3">Tech Proficiency</h3>
      
      {/* Attempted Toggle */}
      <div className="mb-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentStats?.attempted || false}
            onChange={handleAttemptedToggle}
            disabled={updating}
            className="w-4 h-4 text-pr-neon bg-gray-700 border-gray-600 rounded focus:ring-pr-neon"
          />
          <span className="text-gray-300">I have attempted to learn this tech</span>
        </label>
      </div>

      {/* Proficiency Levels */}
      {currentStats?.attempted && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-3">How well can you perform this tech?</p>
          
          {PROFICIENCY_LEVELS.map((level) => (
            <label key={level.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={`proficiency-${tech.id}`}
                value={level.value}
                checked={currentStats?.proficiencyLevel === level.value}
                onChange={() => handleProficiencyChange(level.value)}
                disabled={updating}
                className="w-4 h-4 text-pr-neon bg-gray-700 border-gray-600 focus:ring-pr-neon"
              />
              <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
              <span className="text-gray-300 text-sm">{level.label}</span>
            </label>
          ))}
          
          {currentStats?.proficiencyLevel && (
            <button
              onClick={handleRemoveProficiency}
              disabled={updating}
              className="mt-3 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Remove proficiency rating
            </button>
          )}
        </div>
      )}
      
      {updating && (
        <div className="mt-3 text-center">
          <span className="text-sm text-gray-400">Updating...</span>
        </div>
      )}
    </div>
  );
}