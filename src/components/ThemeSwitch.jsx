import React, { useState, useEffect } from 'react';

export default function ThemeSwitch({ currentTheme, onThemeChange }) {
  const [clickSequence, setClickSequence] = useState([]);
  const [purpleUnlocked, setPurpleUnlocked] = useState(() => {
    return localStorage.getItem('purpleThemeUnlocked') === 'true';
  });

  const requiredSequence = ['blue', 'red', 'green'];
  const totalSequences = 3;

  useEffect(() => {
    localStorage.setItem('purpleThemeUnlocked', purpleUnlocked.toString());
  }, [purpleUnlocked]);

  const handleThemeClick = (theme) => {
    if (theme === 'purple') {
      onThemeChange(theme);
      return;
    }

    // If switching away from purple theme, disable it completely
    if (currentTheme === 'purple' && theme !== 'purple') {
      setPurpleUnlocked(false);
    }

    // Handle easter egg sequence tracking
    const newSequence = [...clickSequence, theme];
    
    // Check if this click continues the correct sequence
    const expectedIndex = newSequence.length - 1;
    const sequenceIndex = expectedIndex % requiredSequence.length;
    
    if (theme === requiredSequence[sequenceIndex]) {
      setClickSequence(newSequence);
      
      // Check if we've completed the required number of sequences
      if (newSequence.length === requiredSequence.length * totalSequences) {
        setPurpleUnlocked(true);
        setClickSequence([]); // Reset sequence
        onThemeChange('purple'); // Auto-equip purple theme
        return; // Don't switch to the clicked theme
      }
    } else {
      // Wrong click, reset sequence
      setClickSequence([]);
    }

    onThemeChange(theme);
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Choose your neon style:</h3>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleThemeClick('blue')}
          className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
            currentTheme === 'blue'
              ? 'ring-4 ring-blue-400 bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
        </button>

        <button
          onClick={() => handleThemeClick('red')}
          className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
            currentTheme === 'red'
              ? 'ring-4 ring-red-400 bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-red-400 shadow-lg shadow-red-400/50" />
        </button>

        <button
          onClick={() => handleThemeClick('green')}
          className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
            currentTheme === 'green'
              ? 'ring-4 ring-green-400 bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
        </button>

        {purpleUnlocked && (
          <button
            onClick={() => handleThemeClick('purple')}
            className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
              currentTheme === 'purple'
                ? 'ring-4 ring-purple-400 bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
          </button>
        )}
      </div>
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          Sequence: {clickSequence.length}/{requiredSequence.length * totalSequences}
        </div>
      )}
    </div>
  );
}
