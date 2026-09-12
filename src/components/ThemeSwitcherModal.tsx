import React from 'react';
import {
  Palette,
  X,
  Check,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Flame,
  Snowflake,
  Terminal,
} from 'lucide-react';
import { useTheme, THEME_OPTIONS, AppTheme } from '../context/ThemeContext';

interface ThemeSwitcherModalProps {
  onClose: () => void;
}

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = (id: AppTheme) => {
    switch (id) {
      case 'enterprise-indigo':
        return <Sun className="w-5 h-5 text-indigo-600" />;
      case 'cyber-obsidian':
        return <Terminal className="w-5 h-5 text-cyan-400" />;
      case 'nordic-frost':
        return <Snowflake className="w-5 h-5 text-teal-600" />;
      case 'synthwave-neon':
        return <Zap className="w-5 h-5 text-fuchsia-400" />;
      case 'luxury-amber':
        return <Flame className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      id="theme-switcher-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
        id="theme-switcher-modal"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Select Platform Theme</h2>
              <p className="text-xs text-slate-500">
                Instantly transform the entire design, colors, cards, and atmosphere.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            id="close-theme-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEME_OPTIONS.map((t) => {
              const isSelected = theme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  id={`theme-card-${t.id}`}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/30'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs bg-white'
                  }`}
                >
                  {/* Theme Top Info */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getThemeIcon(t.id)}
                        <span className="font-bold text-sm text-slate-900">{t.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                            t.category === 'Dark'
                              ? 'bg-slate-900 text-slate-200 border-slate-700'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {t.category}
                        </span>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  {/* Visual Color Palette Swatches Preview */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {t.accentLabel}
                    </span>

                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100/80 border border-slate-200/60">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: t.palette.bg }}
                        title="Background"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: t.palette.card }}
                        title="Card Canvas"
                      />
                      <span
                        className="w-4 h-4 rounded-full shadow-2xs"
                        style={{ backgroundColor: t.palette.primary }}
                        title="Primary Color"
                      />
                      <span
                        className="w-4 h-4 rounded-full shadow-2xs"
                        style={{ backgroundColor: t.palette.accent }}
                        title="Accent Glow"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Theme applies instantly across all views & modals</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
