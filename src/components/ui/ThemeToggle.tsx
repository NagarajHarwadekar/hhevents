import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-between w-14 h-7 p-1 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer ${
        isDark ? 'bg-slate-900 border border-amber-500/30' : 'bg-amber-100 border border-amber-300'
      } ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      
      {/* Background Icons */}
      <Sun className="w-3.5 h-3.5 text-amber-600 transition-opacity duration-200 ml-0.5" />
      <Moon className="w-3.5 h-3.5 text-slate-400 transition-opacity duration-200 mr-0.5" />

      {/* Sliding Knob */}
      <span
        className={`absolute top-0.5 bottom-0.5 w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center shadow-md ${
          isDark
            ? 'translate-x-7 bg-slate-800 text-amber-400 border border-amber-500/50 shadow-amber-500/20'
            : 'translate-x-0 bg-white text-amber-600 border border-amber-200 shadow-slate-300'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5" />
        ) : (
          <Sun className="w-3.5 h-3.5" />
        )}
      </span>
    </button>
  );
};
