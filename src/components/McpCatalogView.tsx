import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Layers,
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  X,
} from 'lucide-react';
import { McpServer, EnterpriseApplication } from '../types';

interface McpCatalogViewProps {
  servers: McpServer[];
  applications: EnterpriseApplication[];
  pendingRequestServerNames: string[];
  onViewTools: (serverId: string) => void;
  onRequestAccess: (server: McpServer, requestingAppName: string, reason: string) => void;
}

export const McpCatalogView: React.FC<McpCatalogViewProps> = ({
  servers,
  applications,
  pendingRequestServerNames,
  onViewTools,
  onRequestAccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [requestModalServer, setRequestModalServer] = useState<McpServer | null>(null);
  const [requestingAppId, setRequestingAppId] = useState(applications[0]?.id || '');
  const [requestReason, setRequestReason] = useState('');

  // Only servers the owning team has explicitly published are discoverable here —
  // private servers (e.g. Core Banking Ledger) stay out of the catalog entirely.
  const catalogServers = servers.filter((s) => s.isPublishedToCatalog);

  const filtered = catalogServers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.applicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openRequestModal = (server: McpServer) => {
    setRequestModalServer(server);
    // No silent default here — an app can't meaningfully request access to a server
    // it already owns, and defaulting to "the first app in the list" regardless of
    // which card was clicked is exactly what produced backwards-looking request
    // messages before. Force an explicit, deliberate choice instead.
    setRequestingAppId('');
    setRequestReason('');
  };

  const eligibleRequestingApps = requestModalServer
    ? applications.filter((a) => a.name !== requestModalServer.applicationName)
    : applications;

  const handleSubmitRequest = () => {
    if (!requestModalServer) return;
    const requestingApp = applications.find((a) => a.id === requestingAppId);
    if (!requestingApp) return;

    onRequestAccess(requestModalServer, requestingApp.name, requestReason || `Access requested via MCP Catalog for ${requestModalServer.name}`);
    setRequestModalServer(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="mcp-catalog-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MCP Catalog</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Enterprise Registry
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Discover reusable MCP servers other teams have published, and request access instead of rebuilding a capability that already exists.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search catalog by MCP name, domain, owner..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((server) => {
          const isPending = pendingRequestServerNames.includes(server.name);
          return (
            <div
              key={server.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {server.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{server.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Application: {server.applicationName}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Owner:</span>
                    <span className="font-semibold text-slate-800">{server.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available MCP Tools:</span>
                    <span className="font-bold text-purple-700">{server.toolsCount} Tools</span>
                  </div>
                </div>

                {/* Used by Apps */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Active Consuming Apps:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {server.usedByApps.map((appName, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-medium"
                      >
                        {appName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {isPending ? (
                  <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Requested — Pending Approval</span>
                  </span>
                ) : (
                  <button
                    onClick={() => openRequestModal(server)}
                    className="text-xs text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Request Access</span>
                  </button>
                )}

                <button
                  onClick={() => onViewTools(server.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <span>View Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-sm text-slate-500">
            No published MCP servers match your search.
          </div>
        )}
      </div>

      {/* Request Access Modal — portaled to document.body so it grays out the whole
          window (like the Register Application wizard), not just this view's content
          area. Nesting it here directly would trap it inside this view's animated
          (transformed) wrapper, which creates its own containing block for fixed
          elements and shrinks the backdrop down to the view's bounds. */}
      {requestModalServer &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Request Access</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{requestModalServer.name}</p>
                </div>
                <button onClick={() => setRequestModalServer(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Requesting Application</label>
                  <select
                    value={requestingAppId}
                    onChange={(e) => setRequestingAppId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>
                      Select the application requesting access...
                    </option>
                    {eligibleRequestingApps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name}
                      </option>
                    ))}
                  </select>
                  {requestingAppId && (
                    <p className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-2.5 py-1.5 mt-1.5">
                      <strong>{eligibleRequestingApps.find((a) => a.id === requestingAppId)?.name}</strong> will request access to{' '}
                      <strong>{requestModalServer.name}</strong>.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason (optional)</label>
                  <textarea
                    rows={3}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Need to verify operator entitlements before releasing a disputed transaction refund."
                  />
                </div>

                <p className="text-[11px] text-slate-500">
                  This creates a pending request — it does not grant access. An administrator reviews and approves or rejects it from Access Requests.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRequestModalServer(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={!requestingAppId}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
