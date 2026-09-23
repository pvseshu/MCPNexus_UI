import React, { useState } from 'react';
import {
  Compass,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Code2,
  Server,
  Zap,
  Globe,
  Sliders,
  FileCode,
} from 'lucide-react';
import { DiscoveredEndpoint } from '../api/apiDiscovery';

interface ApiDiscoveryViewProps {
  // One row per stored endpoint, enabled or not (API.md section 12).
  endpoints?: DiscoveredEndpoint[];
  isLoading?: boolean;
  error?: string | null;
  onInspectEndpoint?: (endpoint: DiscoveredEndpoint) => void;
  // Enable / disable the endpoint's MCP tool; rejects on failure. Not passed on /demo.
  onToggleEndpoint?: (endpoint: DiscoveredEndpoint) => Promise<void>;
  onOpenRegisterWizard?: () => void;
  onRegisterNew?: () => void;
}

export const ApiDiscoveryView: React.FC<ApiDiscoveryViewProps> = ({
  endpoints = [],
  isLoading = false,
  error = null,
  onInspectEndpoint,
  onToggleEndpoint,
  onOpenRegisterWizard,
  onRegisterNew,
}) => {

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<{ id: string; message: string } | null>(null);

  const handleToggle = async (api: DiscoveredEndpoint) => {
    if (!onToggleEndpoint) return;
    setTogglingId(api.id);
    setToggleError(null);
    try {
      await onToggleEndpoint(api);
    } catch (err) {
      setToggleError({ id: api.id, message: err instanceof Error ? err.message : 'Could not update the tool.' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenRegister = () => {
    if (onRegisterNew) onRegisterNew();
    else if (onOpenRegisterWizard) onOpenRegisterWizard();
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppFilter, setSelectedAppFilter] = useState('ALL');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState('ALL');
  const [onlyAiReady, setOnlyAiReady] = useState(false);

  const term = searchTerm.toLowerCase();
  const filtered = endpoints.filter((api) => {
    const matchesSearch =
      api.endpoint.toLowerCase().includes(term) ||
      api.summary.toLowerCase().includes(term) ||
      api.suggestedToolName.toLowerCase().includes(term) ||
      api.applicationName.toLowerCase().includes(term);

    const matchesApp = selectedAppFilter === 'ALL' || api.applicationId === selectedAppFilter;
    const matchesMethod = selectedMethodFilter === 'ALL' || api.method === selectedMethodFilter;
    const matchesAiReady = !onlyAiReady || api.enabledForMcp;

    return matchesSearch && matchesApp && matchesMethod && matchesAiReady;
  });

  // Stat cards and the application dropdown are worked out from the list itself.
  const totalApisCount = endpoints.length;
  const mcpEnabledApisCount = endpoints.filter((api) => api.enabledForMcp).length;
  const applications = Array.from(
    new Map(endpoints.map((api) => [api.applicationId, api.applicationName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POST':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn" id="api-discovery-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Discovery & Ingestion</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              OpenAPI / Swagger Ingestion
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Discover endpoints across all registered enterprise microservices and transform raw REST APIs into governed MCP tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenRegister}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            <span>Import OpenAPI Spec</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Discovered Endpoints</span>
            <div className="text-xl font-bold text-slate-900">{totalApisCount} Endpoints</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Transformed to MCP Tools</span>
            <div className="text-xl font-bold text-emerald-600">{mcpEnabledApisCount} Active Tools</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Registered Enterprise Apps</span>
            <div className="text-xl font-bold text-slate-900">{applications.length} Systems</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search endpoints, method, summary, or tool..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={selectedAppFilter}
            onChange={(e) => setSelectedAppFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Enterprise Applications</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>

          <select
            value={selectedMethodFilter}
            onChange={(e) => setSelectedMethodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All HTTP Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={onlyAiReady}
              onChange={(e) => setOnlyAiReady(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>MCP Enabled Only</span>
          </label>
        </div>
      </div>

      {/* Discovered Endpoints Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>Discovered REST Endpoints ({filtered.length})</span>
          </h3>
          <span className="text-xs text-slate-500">Live schema inspection</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((api) => (
            <div key={api.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getMethodBadgeClass(api.method)}`}>
                    {api.method}
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 truncate">
                    {api.endpoint}
                  </span>
                  {api.enabledForMcp ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Tool: {api.suggestedToolName}</span>
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <AlertCircle className="w-3 h-3" />
                      <span>Not Active</span>
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {api.applicationName}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{api.summary || api.description}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                  <span>Tag: {api.tag || 'General'}</span>
                  <span>•</span>
                  <span>{api.parametersCount} Parameters</span>
                  <span>•</span>
                  <span>Server: {api.serverName}</span>
                </div>

                {toggleError?.id === api.id && (
                  <p className="text-xs text-red-600 pt-1" role="alert">
                    {toggleError.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {onToggleEndpoint && (
                  <button
                    onClick={() => handleToggle(api)}
                    disabled={togglingId === api.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      api.enabledForMcp
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <span>
                      {togglingId === api.id
                        ? api.enabledForMcp ? 'Disabling…' : 'Enabling…'
                        : api.enabledForMcp ? 'Disable' : 'Enable'}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => onInspectEndpoint?.(api)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Inspect MCP Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {error && (
            <div className="p-6 text-center text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          {isLoading && endpoints.length === 0 && !error && (
            <div className="p-12 text-center text-sm text-slate-500">Loading endpoints…</div>
          )}

          {filtered.length === 0 && !isLoading && !error && (
            <div className="p-12 text-center text-slate-500">
              <Compass className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700">No matching API endpoints found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
