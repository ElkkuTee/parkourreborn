import React from 'react';

export default function ThemeSwitch({ currentTheme, onThemeChange }) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <select 
        value={currentTheme}
        onChange={(e) => onThemeChange(e.target.value)}
        className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1 cursor-pointer"
      >
        <option value="blue">Neon Blue</option>
        <option value="red">Neon Red</option>
        <option value="green">Neon Green</option>
      </select>
    </div>
  );
}