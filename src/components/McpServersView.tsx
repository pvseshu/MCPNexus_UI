import React, { useState } from 'react';
import {
  Server,
  Wrench,
  CheckCircle2,
  Code2,
  ArrowRight,
  Shield,
  Globe,
  Lock,
  Search,
  SlidersHorizontal,
  Plus,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { McpServer, EnterpriseApplication } from '../types';

interface McpServersViewProps {
  servers: McpServer[];
  applications: EnterpriseApplication[];
  onNavigateToTools: (serverId?: string) => void;
  onToggleCatalogVisibility: (serverId: string) => void | Promise<void>;
  onOpenDetails: (server: McpServer) => void | Promise<void>;
  onOpenRegisterWizard: () => void;
}

export const McpServersView: React.FC<McpServersViewProps> = ({
  servers,
  applications,
  onNavigateToTools,
  onToggleCatalogVisibility,
  onOpenDetails,
  onOpenRegisterWizard,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  // Server whose detail popup is still loading.
  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleOpenDetails = async (server: McpServer) => {
    if (openingId) return;
    setOpeningId(server.id);
    try {
      await onOpenDetails(server);
    } finally {
      setOpeningId(null);
    }
  };

  // Servers whose catalog visibility change is still being saved.
  const [savingCatalogIds, setSavingCatalogIds] = useState<Set<string>>(new Set());

  const handleCatalogToggle = async (serverId: string) => {
    setSavingCatalogIds((prev) => new Set(prev).add(serverId));
    try {
      await onToggleCatalogVisibility(serverId);
    } finally {
      setSavingCatalogIds((prev) => {
        const next = new Set(prev);
        next.delete(serverId);
        return next;
      });
    }
  };

  // Live servers carry their own application summary; static fixtures are matched by mcpServerId.
  const getApp = (server: McpServer) =>
    server.application ?? applications.find((a) => a.mcpServerId === server.id);

  const departments = [
    'ALL',
    ...Array.from(new Set(servers.map((s) => getApp(s)?.department).filter((d): d is string => !!d))),
  ];

  const filteredServers = servers.filter((server) => {
    const app = getApp(server);
    const haystack = [server.name, server.applicationName, server.owner, app?.appCode, app?.ownerEmail]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || app?.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleCopyManifest = (server: McpServer) => {
    const manifest = {
      mcpServer: server.name,
      version: server.version,
      applicationId: server.applicationId,
      endpoint: server.endpointUrl,
      transport: server.transportType,
      toolsCount: server.toolsCount,
      dependsOnServers: server.dependsOnServers,
      governance: {
        rbacEnforced: true,
        auditLogging: 'ENABLED',
      },
    };
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="mcp-servers-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MCP Servers</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {servers.length} Active Servers
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Register an enterprise application and manage its application-specific Model Context Protocol server — one entity, one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="mcp-servers-register-btn"
            onClick={onOpenRegisterWizard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs shadow-indigo-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register Application</span>
          </button>
          <button
            onClick={() => onNavigateToTools()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-slate-500" />
            <span>Explore All {servers.reduce((sum, s) => sum + s.toolsCount, 0)} Tools</span>
          </button>
        </div>
      </div>

      {/* Conceptual Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-600">
            <strong className="text-slate-900">Application-Specific Isolation: </strong>
            Registering an application generates a governed MCP server for it — each card below is both. Click a card to see the
            application's owner, description, AI context, and API spec; use "View Tools" to jump straight to its MCP tools.
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search servers, applications, owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {departments.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'ALL' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServers.map((server) => {
          const app = getApp(server);
          return (
            <div
              key={server.id}
              onClick={() => handleOpenDetails(server)}
              className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group cursor-pointer ${
                openingId === server.id ? 'opacity-60 cursor-wait' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
                    <Server className="w-5 h-5" />
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        server.status === 'Disabled'
                          ? 'bg-slate-200 text-slate-600 border-slate-300'
                          : server.status === 'Maintenance'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                      title="Administrative status — whether this server is turned on"
                    >
                      {server.status}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        server.healthStatus === 'Healthy'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : server.healthStatus === 'Degraded'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                      title="Live reachability — whether the server is currently responding"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          server.healthStatus === 'Healthy'
                            ? 'bg-emerald-500'
                            : server.healthStatus === 'Degraded'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                      />
                      {server.healthStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {server.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Application: {server.applicationName}</p>
                  {app && (
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>{app.owner}</span>
                      <span>•</span>
                      <span>{app.department}</span>
                      {app.isAiReady && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                          <Sparkles className="w-3 h-3" />
                          AI Ready
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCatalogToggle(server.id);
                  }}
                  disabled={savingCatalogIds.has(server.id)}
                  title={
                    server.isPublishedToCatalog
                      ? 'Visible in MCP Catalog — click to make private'
                      : 'Not in MCP Catalog — click to publish for discovery/access requests'
                  }
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                    server.isPublishedToCatalog
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {savingCatalogIds.has(server.id) ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : server.isPublishedToCatalog ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    <span>{server.isPublishedToCatalog ? 'Listed in MCP Catalog' : 'Not enabled for Catalog (Private)'}</span>
                  </span>
                  <span className="underline decoration-dotted">{savingCatalogIds.has(server.id) ? 'Saving…' : 'Change'}</span>
                </button>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Version:</span>
                    <span className="font-mono font-semibold text-slate-800">v{server.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transport:</span>
                    <span className="font-mono font-semibold text-indigo-700">{server.transportType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exposed Tools:</span>
                    <span className="font-bold text-purple-700">{server.toolsCount} MCP Tools</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Endpoint:</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[170px]">
                      {server.endpointUrl}
                    </span>
                  </div>
                </div>

                {/* Outbound dependencies: what this server itself calls into / has access to */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Has Access To:
                  </span>
                  {server.dependsOnServers.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {server.dependsOnServers.map((dep, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium"
                        >
                          <Shield className="w-2.5 h-2.5" />
                          {dep}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      Foundational service — no dependency on other MCP servers
                    </span>
                  )}
                </div>

                {/* Inbound consumers: who calls into this server */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Connected Consumers:
                  </span>
                  {server.usedByApps.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {server.usedByApps.map((consumer, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {consumer}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No consuming applications yet</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleCopyManifest(server)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
                  title="Copy JSON MCP Manifest"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Manifest'}</span>
                </button>

                <button
                  onClick={() => onNavigateToTools(server.id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View {server.toolsCount} Tools</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredServers.length === 0 && (
          <div className="col-span-full text-center py-16 text-sm text-slate-500">
            No MCP servers match your search.
          </div>
        )}
      </div>
    </div>
  );
};
