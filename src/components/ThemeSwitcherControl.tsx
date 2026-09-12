import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Check,
  ChevronDown,
  Sun,
  Terminal,
  Snowflake,
  Zap,
  Flame,
} from 'lucide-react';
import { useTheme, THEME_OPTIONS, AppTheme } from '../context/ThemeContext';

interface ThemeSwitcherControlProps {
  onOpenFullModal?: () => void;
  variant?: 'pill' | 'icon' | 'select';
}

export const ThemeSwitcherControl: React.FC<ThemeSwitcherControlProps> = ({
  onOpenFullModal,
  variant = 'pill',
}) => {
  const { theme, setTheme, currentThemeOption } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = (id: AppTheme) => {
    switch (id) {
      case 'enterprise-indigo':
        return <Sun className="w-3.5 h-3.5 text-indigo-500" />;
      case 'cyber-obsidian':
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
      case 'nordic-frost':
        return <Snowflake className="w-3.5 h-3.5 text-teal-500" />;
      case 'synthwave-neon':
        return <Zap className="w-3.5 h-3.5 text-fuchsia-400" />;
      case 'luxury-amber':
        return <Flame className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="theme-quick-switch-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        title="Switch Platform Theme (Obsidian, Nordic, Synthwave, Copper, Indigo)"
      >
        <span className="flex items-center gap-1.5">
          {getThemeIcon(theme)}
          <span className="hidden md:inline truncate max-w-[110px]">{currentThemeOption.name}</span>
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn"
          id="theme-dropdown-menu"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Select Theme Style
            </span>
            {onOpenFullModal && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullModal();
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            )}
          </div>

          <div className="space-y-0.5 px-1">
            {THEME_OPTIONS.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 font-bold text-indigo-900'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getThemeIcon(t.id)}
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.accentLabel}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs flex-shrink-0"
                      style={{ backgroundColor: t.palette.primary }}
                    />
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
