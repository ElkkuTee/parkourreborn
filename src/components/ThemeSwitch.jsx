import React from 'react';

export default function ThemeSwitch({ currentTheme, onThemeChange }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Choose your neon style:</h3>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onThemeChange('blue')}
          className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
            currentTheme === 'blue'
              ? 'ring-4 ring-blue-400 bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
        </button>

        <button
          onClick={() => onThemeChange('red')}
          className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
            currentTheme === 'red'
              ? 'ring-4 ring-red-400 bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-red-400 shadow-lg shadow-red-400/50" />
        </button>

        <button
          onClick={() => onThemeChange('green')}
          className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
            currentTheme === 'green'
              ? 'ring-4 ring-green-400 bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
        </button>
      </div>
    </div>
  );
}