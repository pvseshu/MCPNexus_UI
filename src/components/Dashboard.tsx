import React, { useState } from 'react';
import {
  Server,
  Wrench,
  KeyRound,
  Database,
  Plus,
  ArrowRight,
  ArrowDown,
  Sparkles,
  Bot,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Zap,
  Activity,
  Compass,
  AlertTriangle,
  FileCode,
  Lock,
} from 'lucide-react';
import { NavSection, AuditEvent, EnterpriseApplication, McpServer, McpTool, AccessRequest } from '../types';

interface DashboardProps {
  applications?: EnterpriseApplication[];
  mcpServers?: McpServer[];
  mcpTools?: McpTool[];
  accessRequests?: AccessRequest[];
  onNavigate: (section: NavSection) => void;
  onOpenRegisterWizard?: () => void;
  onRegisterAppClick?: () => void;
  onOpenAddKnowledge?: () => void;
  onOpenAiChat?: () => void;
  onOpenTransformation?: () => void;
  pendingRequestsCount?: number;
  recentAuditEvents?: AuditEvent[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  applications = [],
  mcpServers = [],
  mcpTools = [],
  accessRequests = [],
  onNavigate,
  onOpenRegisterWizard,
  onRegisterAppClick,
  onOpenAddKnowledge,
  onOpenAiChat,
  onOpenTransformation,
  pendingRequestsCount,
  recentAuditEvents = [],
}) => {
  const [selectedDiagramNode, setSelectedDiagramNode] = useState<string | null>(null);

  const calculatedPendingRequests =
    pendingRequestsCount !== undefined
      ? pendingRequestsCount
      : accessRequests.filter((r) => r.status === 'Pending').length;

  const handleRegisterApp = () => {
    if (onOpenRegisterWizard) {
      onOpenRegisterWizard();
    } else if (onRegisterAppClick) {
      onRegisterAppClick();
    } else {
      onNavigate('mcp-servers');
    }
  };

  const handleAddKnowledge = () => {
    if (onOpenAddKnowledge) {
      onOpenAddKnowledge();
    } else {
      onNavigate('knowledge-hub');
    }
  };

  const handleOpenAiChat = () => {
    if (onOpenAiChat) {
      onOpenAiChat();
    } else {
      onNavigate('ai-chat');
    }
  };

  const aiReadyAppsCount = applications.filter((a) => a.isAiReady).length;

  const kpis = [
    {
      id: 'kpi-applications',
      label: 'Enterprise Applications',
      value: applications.length > 0 ? `${applications.length}` : '18',
      sublabel: `${aiReadyAppsCount} AI-Ready via MCP`,
      icon: Compass,
      color: 'blue',
      section: 'api-discovery' as NavSection,
      trend: 'Registered via OpenAPI/Swagger',
    },
    {
      id: 'kpi-servers',
      label: 'MCP Servers',
      value: mcpServers.length > 0 ? `${mcpServers.length}` : '24',
      sublabel: `${applications.length} Registered Applications`,
      icon: Server,
      color: 'indigo',
      section: 'mcp-servers' as NavSection,
      trend: '100% healthy status',
    },
    {
      id: 'kpi-tools',
      label: 'MCP Tools',
      value: mcpTools.length > 0 ? `${mcpTools.length}` : '186',
      sublabel: 'AI-Ready Capabilities',
      icon: Wrench,
      color: 'purple',
      section: 'mcp-tools' as NavSection,
      trend: '94% AI context configured',
    },
    {
      id: 'kpi-requests',
      label: 'Pending Access Requests',
      value: `${calculatedPendingRequests}`,
      sublabel: 'App-to-App Approvals',
      icon: KeyRound,
      color: 'amber',
      section: 'access-requests' as NavSection,
      trend: 'Needs review today',
      highlight: calculatedPendingRequests > 0,
    },
    {
      id: 'kpi-knowledge',
      label: 'Knowledge Sources',
      value: '1,284',
      sublabel: '24,582 Indexed Docs',
      icon: Database,
      color: 'teal',
      section: 'knowledge-hub' as NavSection,
      trend: 'Auto-sync active',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn" id="dashboard-view">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MCP Nexus</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Platform v2.4
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Connect enterprise applications, APIs, AI and knowledge through a governed MCP ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            id="dash-add-knowledge-btn"
            onClick={handleAddKnowledge}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>+ Add Knowledge Source</span>
          </button>

          <button
            id="dash-register-app-btn"
            onClick={handleRegisterApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register Application</span>
          </button>
        </div>
      </div>

      {/* Core Mission Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Core Architectural Principle</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Connect existing enterprise applications to AI safely and easily.
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Transform OpenAPI/Swagger specifications into application-specific, governed MCP servers with AI context layers, sample inputs/outputs, and multi-MCP orchestration.
            </p>
          </div>

          <button
            onClick={handleOpenAiChat}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-md flex-shrink-0 cursor-pointer"
            id="dash-test-ai-chat-btn"
          >
            <Bot className="w-4 h-4" />
            <span>Open Enterprise AI Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              id={kpi.id}
              onClick={() => onNavigate(kpi.section)}
              className={`bg-white border rounded-xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${
                kpi.highlight
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    kpi.color === 'blue'
                      ? 'bg-blue-50 text-blue-600'
                      : kpi.color === 'indigo'
                      ? 'bg-indigo-50 text-indigo-600'
                      : kpi.color === 'purple'
                      ? 'bg-purple-50 text-purple-600'
                      : kpi.color === 'amber'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-teal-50 text-teal-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{kpi.sublabel}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className={kpi.highlight ? 'text-amber-700 font-medium' : 'text-slate-400'}>
                  {kpi.trend}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visually Impressive Ecosystem Architecture Visualizer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs" id="ecosystem-architecture-diagram">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Governed Enterprise MCP Architecture</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live end-to-end data flow: From existing enterprise APIs to AI Agent execution and enterprise chat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Real-time Bus Active
            </span>
            <button
              onClick={() => onNavigate('mcp-catalog')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
            >
              Explore Catalog <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-center relative">
            {/* Step 1: Applications & their generated MCP Servers (one merged entity) */}
            <div
              onClick={() => onNavigate('mcp-servers')}
              className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">Applications &amp; MCP Servers</h4>
                  <span className="text-[10px] text-slate-500">{applications.length} Apps ➔ {mcpServers.length} Servers</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Register an app from its OpenAPI spec; it becomes an isolated, governed MCP server with AI Context & Skills.
              </p>
              <div className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-indigo-700">
                <Server className="w-3 h-3" />
                <span>{mcpTools.length} MCP Tools</span>
              </div>
            </div>

            {/* Connector 1 */}
            <div className="hidden lg:flex flex-col items-center justify-center text-slate-400">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Govern</span>
              <ArrowRight className="w-5 h-5 text-indigo-500 animate-pulse" />
            </div>

            {/* Step 2: MCP Orchestrator */}
            <div
              onClick={() => onNavigate('ai-workflows')}
              className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-400 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700">MCP Orchestrator</h4>
                  <span className="text-[10px] text-slate-500">Multi-MCP Router</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Dispatches tools, enforces IAM permissions & joins data.
              </p>
              <div className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-purple-700">
                <Lock className="w-3 h-3" />
                <span>Zero-Trust RBAC</span>
              </div>
            </div>

            {/* Connector 2 */}
            <div className="hidden lg:flex flex-col items-center justify-center text-slate-400">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Serve</span>
              <ArrowRight className="w-5 h-5 text-indigo-500 animate-pulse" />
            </div>

            {/* Step 3: AI Agent & Enterprise Chat */}
            <div
              onClick={onOpenAiChat}
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Enterprise AI Chat</h4>
                  <span className="text-[10px] text-slate-500">AI Agent Runtime</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Executes live tool actions and synthesizes enterprise answers.
              </p>
              <div className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <Bot className="w-3 h-3" />
                <span>Live Assistant</span>
              </div>
            </div>
          </div>

          {/* Knowledge Hub Integration Branch */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50 rounded-xl p-3.5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Knowledge Hub Branch</h4>
                <p className="text-[11px] text-slate-500">
                  1,284 Sources (PDFs, Wikis, SOPs) ➔ Grounded directly into AI Agent alongside live MCP Actions
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('knowledge-hub')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-400 text-teal-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <FileCode className="w-3.5 h-3.5 text-teal-600" />
              <span>Inspect Knowledge Vector Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Section: Recent Activity & Quick Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Activity Log */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Platform Activity & Governance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live telemetry of tool calls, access requests, and indexers.</p>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
            >
              View Full Audit Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {(recentAuditEvents || []).slice(0, 5).map((evt) => (
              <div key={evt.id} className="py-3 flex items-start justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      evt.status === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-600'
                        : evt.status === 'DENIED'
                        ? 'bg-amber-50 text-amber-600'
                        : evt.status === 'CONFIG_UPDATED'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {evt.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : evt.status === 'DENIED' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{evt.action}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium truncate max-w-[180px]">
                        {evt.mcpServer || evt.targetResource || 'MCP Server'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{evt.details}</p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {evt.timestamp} • {evt.actor || evt.userOrApp || 'System'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    evt.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : evt.status === 'DENIED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {evt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Quick Hackathon Demo Scenarios */}
        <div className="bg-gradient-to-b from-indigo-50/70 to-white border border-indigo-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Demo Scenario Quick-Launch</h3>
                <p className="text-[11px] text-slate-500">Interactive live scenarios for presentation</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleOpenAiChat}
                className="w-full text-left p-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                    1. Successful API Query
                  </div>
                  <p className="text-[11px] text-slate-500">"Show John's recent transactions"</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                onClick={handleOpenAiChat}
                className="w-full text-left p-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                    2. Permission Denied ➔ Access Request
                  </div>
                  <p className="text-[11px] text-slate-500">Requires GROUP_TRANSACTION_VIEW</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                onClick={handleOpenAiChat}
                className="w-full text-left p-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                    3. Multi-MCP Orchestration
                  </div>
                  <p className="text-[11px] text-slate-500">Customer Transaction MCP + IAM MCP</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                onClick={handleOpenAiChat}
                className="w-full text-left p-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                    6. Combined Knowledge + MCP Action
                  </div>
                  <p className="text-[11px] text-slate-500">Access Policy Doc + Live IAM Status</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-100">
            <button
              onClick={handleOpenAiChat}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Launch AI Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
