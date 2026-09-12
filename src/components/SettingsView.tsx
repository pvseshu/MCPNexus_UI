import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Server,
  Zap,
  Lock,
  Save,
  CheckCircle2,
  Key,
  Globe,
  Palette,
  Check,
  Sparkles,
  Sun,
  Terminal,
  Snowflake,
  Flame,
} from 'lucide-react';
import { useTheme, THEME_OPTIONS, AppTheme } from '../context/ThemeContext';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [transportProtocol, setTransportProtocol] = useState('streamable-http');
  const [authMode, setAuthMode] = useState('zero-trust-rbac');
  const [maxConcurrency, setMaxConcurrency] = useState(50);
  const [auditRetentionDays, setAuditRetentionDays] = useState(365);
  const [isSaved, setIsSaved] = useState(false);

  const getThemeIcon = (id: AppTheme) => {
    switch (id) {
      case 'enterprise-indigo':
        return <Sun className="w-4 h-4 text-indigo-500" />;
      case 'cyber-obsidian':
        return <Terminal className="w-4 h-4 text-cyan-400" />;
      case 'nordic-frost':
        return <Snowflake className="w-4 h-4 text-teal-500" />;
      case 'synthwave-neon':
        return <Zap className="w-4 h-4 text-fuchsia-400" />;
      case 'luxury-amber':
        return <Flame className="w-4 h-4 text-amber-500" />;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn" id="settings-view">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
          <p className="text-slate-600 text-sm mt-1">
            Global MCP protocol transport parameters, interface theme styling, governance policies, and cluster limits.
          </p>
        </div>

        {isSaved && (
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Visual Appearance & Theme Selection Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Interface Appearance & Theme</h3>
                <p className="text-xs text-slate-500">
                  Switch the complete visual theme, color palette, card styling, and ambient light.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Instant Live Switch</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {THEME_OPTIONS.map((t) => {
              const isSelected = theme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  id={`settings-theme-${t.id}`}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {getThemeIcon(t.id)}
                        <span className="font-bold text-xs text-slate-900">{t.name}</span>
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {t.category}
                    </span>

                    <div className="flex items-center gap-1 p-0.5 rounded bg-slate-100/70 border border-slate-200/50">
                      <span
                        className="w-3 h-3 rounded-full border border-black/10"
                        style={{ backgroundColor: t.palette.bg }}
                        title="Background"
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-black/10"
                        style={{ backgroundColor: t.palette.card }}
                        title="Card Canvas"
                      />
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: t.palette.primary }}
                        title="Primary Color"
                      />
                      <span
                        className="w-3 h-3 rounded-full"
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

        {/* MCP Transport Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">MCP Transport & Networking</h3>
              <p className="text-xs text-slate-500">Configure how the MCP Orchestrator routes tool calls.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default MCP Transport Protocol
              </label>
              <select
                value={transportProtocol}
                onChange={(e) => setTransportProtocol(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="streamable-http">Streamable HTTP (Recommended for Cloud / Kubernetes)</option>
                <option value="sse">Server-Sent Events (SSE) (Live bidirectional streaming)</option>
                <option value="stdio">stdio (Local container process isolation)</option>
                <option value="websocket">WebSocket (Ultra-low latency duplex)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Parallel Tool Concurrency (Per Tenant)
              </label>
              <input
                type="number"
                value={maxConcurrency}
                onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* Security & Governance Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Zero-Trust Security & RBAC</h3>
              <p className="text-xs text-slate-500">Enforce enterprise entitlement verification before tool execution.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tool Invocation Policy Enforcement
              </label>
              <select
                value={authMode}
                onChange={(e) => setAuthMode(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="zero-trust-rbac">Strict Zero-Trust RBAC (Validate against IAM before every dispatch)</option>
                <option value="cached-rbac">Cached RBAC (15-minute token TTL for high throughput)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Audit Trail Log Retention (Days)
              </label>
              <input
                type="number"
                value={auditRetentionDays}
                onChange={(e) => setAuditRetentionDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
