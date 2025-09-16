import React from 'react';

export default function ThemeSwitch({ currentTheme, onThemeChange }) {
  const themes = [
    { id: 'red', label: 'Red Theme', color: 'rgb(255, 74, 74)' },
    { id: 'green', label: 'Green Theme', color: 'rgb(74, 255, 74)' },
    { id: 'blue', label: 'Blue Theme', color: 'rgb(74, 163, 255)' }
  ];

  return (
    <div className="fixed top-0 right-0 z-50 flex gap-2">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${
            currentTheme === theme.id
              ? 'border-white scale-110'
              : 'border-gray-600 opacity-50 hover:opacity-75'
          }`}
          style={{ backgroundColor: theme.color }}
          aria-label={theme.label}
          title={theme.label}
        />
      ))}
    </div>
  );
}