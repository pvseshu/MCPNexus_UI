import React, { useState } from 'react';
import {
  Wrench,
  Server,
  AppWindow,
  Search,
  SlidersHorizontal,
  Play,
  Settings,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Code2,
  FileJson,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { McpTool } from '../types';

interface McpToolsViewProps {
  tools: McpTool[];
  onConfigureTool: (tool: McpTool) => void;
  onLaunchTester: (tool: McpTool) => void;
  initialServerFilter?: string;
}

export const McpToolsView: React.FC<McpToolsViewProps> = ({
  tools,
  onConfigureTool,
  onLaunchTester,
  initialServerFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServerFilter, setSelectedServerFilter] = useState<string>(
    initialServerFilter || 'ALL'
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | McpTool['status']>('ALL');

  const serverNames = ['ALL', ...Array.from(new Set(tools.map((t) => t.serverName)))];
  const activeCount = tools.filter((t) => t.status === 'Active').length;
  const inactiveCount = tools.length - activeCount;

  const filteredTools = tools.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sourceEndpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.serverName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesServer =
      selectedServerFilter === 'ALL' || t.serverName === selectedServerFilter || t.serverId === selectedServerFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;
    return matchesSearch && matchesServer && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="mcp-tools-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MCP Tools</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              {tools.length} Governed Capabilities
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {inactiveCount} Inactive
              </span>
            )}
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Individual AI-ready capabilities exposed by application MCP servers.
          </p>
        </div>
      </div>

      {/* Educational Concept Card */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Understanding MCP Tools</span>
          </div>
          <h3 className="text-sm font-bold text-white">
            How APIs become AI-Ready Tools in MCP Nexus
          </h3>
          <p className="text-xs text-purple-200 leading-relaxed">
            Unlike raw REST endpoints, an MCP Tool embeds full JSON input/output schemas, multiple administrator sample payloads, domain usage rules (&quot;when to use&quot; / &quot;when NOT to use&quot;), and enterprise authorization policies.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-mono flex items-center gap-2 text-white flex-shrink-0">
          <span className="text-blue-300 font-bold">Existing REST API</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-emerald-300 font-bold">MCP Tool + AI Context</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tools, endpoints, schemas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">MCP Server:</span>
          <select
            value={selectedServerFilter}
            onChange={(e) => setSelectedServerFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {serverNames.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All MCP Servers' : s}
              </option>
            ))}
          </select>

          <span className="text-xs font-medium text-slate-500 ml-2">Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as 'ALL' | McpTool['status'])}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Needs Configuration">Needs Configuration</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="tools-cards-grid">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
              tool.status === 'Active' ? 'border-slate-200 hover:border-purple-300' : 'border-slate-200 opacity-75'
            }`}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-mono font-bold text-sm text-slate-900 truncate">
                      {tool.name}
                    </h3>
                    <p className="text-[11px] text-indigo-600 font-medium truncate">{tool.serverName}</p>
                  </div>
                </div>

                {tool.status === 'Active' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex-shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active ({tool.aiReadinessScore}%)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 flex-shrink-0">
                    {tool.status}
                  </span>
                )}
              </div>

              {/* Transformation Badge */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Source:</span>
                <span className="font-bold text-blue-700 truncate">{tool.sourceEndpoint}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{tool.description}</p>

              {/* Metadata chips */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Sample Inputs</span>
                  <strong className="text-slate-900">{tool.sampleInputsCount ?? tool.sampleInputs.length} Configured</strong>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Sample Outputs</span>
                  <strong className="text-slate-900">{tool.sampleOutputsCount ?? tool.sampleOutputs.length} Configured</strong>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block font-medium">RBAC Security</span>
                  <strong className="text-indigo-700 truncate block font-mono text-[11px]">
                    {tool.requiredPermission}
                  </strong>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Used: {tool.lastUsed} ({tool.callCount} calls)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLaunchTester(tool)}
                  disabled={tool.status !== 'Active'}
                  title={tool.status !== 'Active' ? 'Enable this tool before testing' : undefined}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test Tool</span>
                </button>

                <button
                  onClick={() => onConfigureTool(tool)}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure Tool</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
