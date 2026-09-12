import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Bot,
  Server,
  Layers,
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Play,
  Clock,
  Database,
  ShieldCheck,
  Code2,
  RefreshCw,
  Cpu,
  Radio,
  Sliders,
  ChevronRight,
  Terminal,
  ExternalLink,
  Laptop,
} from 'lucide-react';

interface McpOrchestratorViewProps {
  onOpenAiChat: () => void;
  onOpenEmbedModal?: () => void;
  mcpServersCount?: number;
  mcpToolsCount?: number;
}

type SimulationScenario = 'multi-mcp' | 'iam-auth' | 'knowledge-sop';

export const McpOrchestratorView: React.FC<McpOrchestratorViewProps> = ({
  onOpenAiChat,
  onOpenEmbedModal,
  mcpServersCount = 0,
  mcpToolsCount = 0,
}) => {
  const [selectedNode, setSelectedNode] = useState<string>('router');
  const [activeSimulation, setActiveSimulation] = useState<SimulationScenario | null>(null);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationLogs, setSimulationLogs] = useState<{ time: string; node: string; event: string; status: 'ok' | 'denied' | 'info' }[]>([]);

  const stats = [
    { label: 'Active MCP Servers', value: `${mcpServersCount}`, icon: Server, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Governed Tools', value: `${mcpToolsCount}`, icon: Zap, color: 'text-purple-600 bg-purple-50' },
    { label: 'Avg Route Latency', value: '38ms', icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Orchestrations Today', value: '3,142', icon: Activity, color: 'text-blue-600 bg-blue-50' },
  ];

  const nodeDetails: Record<string, { title: string; subtitle: string; description: string; metrics: Record<string, string>; tools?: string[]; rules?: string[] }> = {
    client: {
      title: 'Enterprise Ingress Clients',
      subtitle: 'Host Application Web Widgets & APIs',
      description: 'Accepts natural language user requests from internal banking portals, mobile servicing apps, and customer CRMs.',
      metrics: { 'Active Connections': '128', 'Protocol': 'WSS / gRPC / HTTPS', 'Avg Ingress': '24 req/s' },
      tools: ['Web Chat Embed', 'REST Ingress Gateway', 'Workflow Scheduler'],
    },
    router: {
      title: 'AI Reasoning & Semantic Router',
      subtitle: 'Gemini Intent Decomposition Kernel',
      description: 'Analyzes user prompts, extracts entities, decomposes multi-system requests, and builds the parallel tool execution DAG.',
      metrics: { 'Reasoning Latency': '42ms', 'Model Engine': 'Gemini 2.5 Flash', 'Intent Precision': '99.4%' },
      rules: ['Parallel MCP fan-out', 'Zero-shot entity resolution', 'Automatic schema mapping'],
    },
    governance: {
      title: 'Zero-Trust Governance & RBAC Kernel',
      subtitle: 'Access Guard & Audit Interceptor',
      description: 'Enforces least-privilege RBAC checks on every individual tool dispatch before execution. Redacts PII and records immutable audit logs.',
      metrics: { 'Enforcement Mode': 'Strict RBAC', 'PII Redaction': 'Active', 'Policy Check Latency': '< 2ms' },
      rules: ['GROUP_TRANSACTION_VIEW required for VIP accounts', 'Auto-JIT access request routing', 'PAN masking'],
    },
    custTx: {
      title: 'Customer Transaction Portal MCP',
      subtitle: 'Retail Transactions & Customer Profile',
      description: 'Translates AI tool calls into high-speed REST calls against internal transaction ledgers and customer relationship databases.',
      metrics: { 'Tools Count': '4 Tools', 'Target Microservice': 'app-cust-tx:8080', 'Status': 'Healthy (0.01% err)' },
      tools: ['getCustomer', 'getCustomerTransactions', 'getCustomerStatus', 'searchCustomer'],
    },
    caseMgmt: {
      title: 'Case Management & Resolution MCP',
      subtitle: 'Dispute Cases & SLA Tracking',
      description: 'Interfaces with customer dispute databases, ticketing queues, and fraud investigation workflows.',
      metrics: { 'Tools Count': '3 Tools', 'Target Microservice': 'app-case-mgmt:8082', 'Status': 'Healthy' },
      tools: ['getCustomerCases', 'createCase', 'updateCaseNotes'],
    },
    iamMcp: {
      title: 'IAM & Access Governance MCP',
      subtitle: 'Entitlements & Just-In-Time Grants',
      description: 'Queries active operator clearances, checks missing security groups, and initiates access requests.',
      metrics: { 'Tools Count': '3 Tools', 'Target Microservice': 'app-iam:8443', 'Status': 'Healthy' },
      tools: ['getUserAccess', 'requestAccess', 'verifySecurityToken'],
    },
    knowledgeHub: {
      title: 'Knowledge Hub Vector Store',
      subtitle: 'RAG Embeddings & Policy SOPs',
      description: 'Performs semantic vector retrieval against PDF manuals, compliance binders, and API documentation for grounded reasoning.',
      metrics: { 'Indexed Chunks': '1,240 Chunks', 'Embedding Model': 'text-embedding-004', 'Avg Search': '18ms' },
      tools: ['vectorSearch', 'fetchChunk', 'groundPolicy'],
    },
  };

  const runSimulation = (scenario: SimulationScenario) => {
    setActiveSimulation(scenario);
    setSimulationStep(1);
    setSimulationLogs([]);

    const steps = [
      { time: '00:00.012', node: 'client', event: 'Received client inquiry: "Investigate customer C12345 dispute & transactions"', status: 'info' as const },
      { time: '00:00.045', node: 'router', event: 'Gemini Intent decomposed: [CustomerTx.getTransactions, CaseMgmt.getCustomerCases]', status: 'ok' as const },
      { time: '00:00.058', node: 'governance', event: 'RBAC Zero-Trust verification: Operator holds GROUP_TRANSACTION_VIEW [APPROVED]', status: 'ok' as const },
      { time: '00:00.082', node: 'custTx', event: 'Dispatched getCustomerTransactions(customerId="C12345") -> 3 transactions returned', status: 'ok' as const },
      { time: '00:00.096', node: 'caseMgmt', event: 'Dispatched getCustomerCases(customerId="C12345") -> 0 active disputes returned', status: 'ok' as const },
      { time: '00:00.124', node: 'router', event: 'Synthesized multi-MCP payload response into natural language with citations', status: 'ok' as const },
    ];

    steps.forEach((st, idx) => {
      setTimeout(() => {
        setSimulationStep(idx + 1);
        setSelectedNode(st.node);
        setSimulationLogs((prev) => [...prev, st]);
      }, (idx + 1) * 600);
    });

    setTimeout(() => {
      setActiveSimulation(null);
    }, (steps.length + 1) * 600);
  };

  const selectedData = nodeDetails[selectedNode] || nodeDetails.router;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn" id="mcp-orchestrator-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MCP Multi-Server Orchestrator</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interactive Topology Graph
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Dynamic request decomposition, parallel tool fan-out, zero-trust authorization, and live execution telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenEmbedModal && (
            <button
              onClick={onOpenEmbedModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>Embed in Your App</span>
            </button>
          )}

          <button
            onClick={onOpenAiChat}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Launch in AI Chat</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400">{s.label}</span>
                <div className="text-xl font-bold text-slate-900">{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulation Trigger Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Interactive Route Simulation Lab</h3>
            <p className="text-xs text-slate-300">Play real-time execution scenarios across the topology graph.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => runSimulation('multi-mcp')}
            disabled={activeSimulation !== null}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Multi-MCP Join</span>
          </button>

          <button
            onClick={() => runSimulation('iam-auth')}
            disabled={activeSimulation !== null}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate RBAC Guard</span>
          </button>
        </div>
      </div>

      {/* Interactive Topology Graph Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 8-Column Dynamic Visual Graph Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden">
          {/* Subtle Grid Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Graph Header */}
          <div className="flex items-center justify-between relative z-10 border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Interactive Architecture Topology
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Telemetry Grid Active
            </span>
          </div>

          <div className="relative z-10 space-y-6">
            {/* Tier 1: Ingress Clients */}
            <div className="flex justify-center">
              <div
                onClick={() => setSelectedNode('client')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer max-w-sm w-full text-center relative ${
                  selectedNode === 'client'
                    ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-1">
                  <Laptop className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Enterprise Ingress Clients</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Customer Portals • Internal CRM • API Webhooks</p>
              </div>
            </div>

            {/* Connecting Vertical Line */}
            <div className="flex justify-center -my-2">
              <div className="w-px h-6 bg-gradient-to-b from-blue-500 to-indigo-500" />
            </div>

            {/* Tier 2: AI Reasoning & Router */}
            <div className="flex justify-center">
              <div
                onClick={() => setSelectedNode('router')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer max-w-md w-full text-center relative ${
                  selectedNode === 'router'
                    ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/30'
                    : 'bg-slate-900 border-indigo-500/40 hover:border-indigo-400'
                }`}
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
                  Gemini Reasoning Core
                </span>
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 mx-auto flex items-center justify-center mt-1 mb-1">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">MCP Nexus Orchestration Kernel</h3>
                <p className="text-[11px] text-indigo-200 mt-0.5 font-mono">Dynamic Intent Decomposition & DAG Planner</p>
              </div>
            </div>

            {/* Connecting Vertical Line */}
            <div className="flex justify-center -my-2">
              <div className="w-px h-6 bg-gradient-to-b from-indigo-500 to-purple-500" />
            </div>

            {/* Tier 3: Zero-Trust Security Kernel */}
            <div className="flex justify-center">
              <div
                onClick={() => setSelectedNode('governance')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer max-w-md w-full text-center ${
                  selectedNode === 'governance'
                    ? 'bg-purple-600/30 border-purple-400 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-900/90 border-purple-500/40 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-purple-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Zero-Trust RBAC & Audit Interceptor</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Least-Privilege Enforcement • PII Redaction</p>
              </div>
            </div>

            {/* Connecting Fan-Out Line */}
            <div className="flex justify-center -my-2">
              <div className="w-px h-6 bg-gradient-to-b from-purple-500 to-indigo-500" />
            </div>

            {/* Tier 4: Multi-MCP Application Servers Fan-Out Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {/* Server 1 */}
              <div
                onClick={() => setSelectedNode('custTx')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  selectedNode === 'custTx'
                    ? 'bg-blue-600/30 border-blue-400 ring-1 ring-blue-400 shadow-md shadow-blue-500/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-blue-400 font-bold text-xs">
                  <Server className="w-3.5 h-3.5" />
                  <span className="truncate">Customer Tx MCP</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                  <p>↳ getCustomer</p>
                  <p>↳ getTransactions</p>
                </div>
              </div>

              {/* Server 2 */}
              <div
                onClick={() => setSelectedNode('caseMgmt')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  selectedNode === 'caseMgmt'
                    ? 'bg-purple-600/30 border-purple-400 ring-1 ring-purple-400 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-purple-500/50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-purple-400 font-bold text-xs">
                  <Server className="w-3.5 h-3.5" />
                  <span className="truncate">Case Mgmt MCP</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                  <p>↳ getCustomerCases</p>
                  <p>↳ createCase</p>
                </div>
              </div>

              {/* Server 3 */}
              <div
                onClick={() => setSelectedNode('iamMcp')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  selectedNode === 'iamMcp'
                    ? 'bg-amber-600/30 border-amber-400 ring-1 ring-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-amber-400 font-bold text-xs">
                  <Server className="w-3.5 h-3.5" />
                  <span className="truncate">IAM & RBAC MCP</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                  <p>↳ getUserAccess</p>
                  <p>↳ requestAccess</p>
                </div>
              </div>

              {/* Server 4 */}
              <div
                onClick={() => setSelectedNode('knowledgeHub')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  selectedNode === 'knowledgeHub'
                    ? 'bg-emerald-600/30 border-emerald-400 ring-1 ring-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-emerald-400 font-bold text-xs">
                  <Database className="w-3.5 h-3.5" />
                  <span className="truncate">Knowledge Hub</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                  <p>↳ vectorSearch</p>
                  <p>↳ fetchChunk</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 4-Column Inspector & Live Telemetry Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Node Details Inspector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Selected Node</span>
                <h3 className="text-sm font-bold text-slate-900">{selectedData.title}</h3>
                <span className="text-xs text-slate-400">{selectedData.subtitle}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sliders className="w-4 h-4" />
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{selectedData.description}</p>

            {/* Metrics List */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Telemetry</span>
              <div className="space-y-1.5 text-xs font-mono">
                {Object.entries(selectedData.metrics).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">{k}:</span>
                    <span className="font-bold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools or Rules */}
            {selectedData.tools && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Governed Tools</span>
                <div className="flex flex-wrap gap-1">
                  {selectedData.tools.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-mono font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Execution Logs Stream */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulation Trace Logs</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {simulationLogs.length} events
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto text-[10px] font-mono pr-1">
              {simulationLogs.map((log, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="flex justify-between text-slate-400">
                    <span>{log.time}</span>
                    <span className="text-indigo-400 uppercase">{log.node}</span>
                  </div>
                  <p className="text-slate-200">{log.event}</p>
                </div>
              ))}

              {simulationLogs.length === 0 && (
                <p className="text-slate-500 text-center py-4">Click "Simulate Multi-MCP Join" above to stream execution traces.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
