import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Trash2,
  Cpu,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Server,
  Wrench,
  Database,
  FileText,
  Lock,
  ArrowRight,
  Shield,
  Layers,
  RotateCw,
  ExternalLink,
  Code2,
  Check,
  User,
  Info,
  BookOpen,
  X,
} from 'lucide-react';
import { fetchMcpServers } from '../api/mcpServers';
import { sendChatMessage, CHAT_ERROR_MESSAGE } from '../api/chat';
import { isDemoMode } from '../utils/demoMode';
import { ChatMessage, DemoScenarioId, EnterpriseApplication, McpServer } from '../types';

interface AiChatViewProps {
  onOpenAccessRequests?: () => void;
  onOpenEmbedModal?: () => void;
  applications?: EnterpriseApplication[];
}

// Chat history outside /demo is kept per MCP server in sessionStorage so it survives page
// navigation and refreshes (it is dropped when the browser tab is closed). Storage can be unavailable, so every access is guarded.
const HISTORY_KEY = 'mcpnexus.chat.history';
const SERVER_KEY = 'mcpnexus.chat.server';
const SESSION_KEY = 'mcpnexus.chat.sessions';

// Each server's chat window has its own backend sessionId (API_chat.md), kept next to its history.
const readSessions = (): Record<string, string> => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
};

const writeSession = (serverId: string, sessionId: string) => {
  try {
    const all = readSessions();
    if (sessionId) all[serverId] = sessionId;
    else delete all[serverId];
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
};

const readHistory = (): Record<string, ChatMessage[]> => {
  try {
    return JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
};

const writeHistory = (serverId: string, msgs: ChatMessage[]) => {
  try {
    const all = readHistory();
    if (msgs.length) all[serverId] = msgs;
    else delete all[serverId];
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
};

// Minimal, dependency-free renderer for the "## heading" / "- bullet" / "**bold**"
// markdown-lite syntax used in ApplicationAiSummaryConfig.sampleOutput strings.
const renderSummaryMarkdown = (text: string) => {
  const renderInline = (line: string, key: number) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <React.Fragment key={key}>
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      </React.Fragment>
    );
  };

  return text.split('\n').map((line, idx) => {
    if (line.startsWith('## ')) {
      return (
        <h4 key={idx} className="text-sm font-bold text-white mt-4 first:mt-0 mb-1.5">
          {renderInline(line.replace('## ', ''), idx)}
        </h4>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h5 key={idx} className="text-xs font-bold text-indigo-300 mt-3 mb-1 uppercase tracking-wide">
          {renderInline(line.replace('### ', ''), idx)}
        </h5>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <div key={idx} className="flex items-start gap-2 pl-1 py-0.5 text-xs text-slate-200 leading-relaxed">
          <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
          <span>{renderInline(line.replace(/^- /, ''), idx)}</span>
        </div>
      );
    }
    if (line.trim().startsWith('_') && line.trim().endsWith('_')) {
      return (
        <p key={idx} className="text-[10px] text-slate-500 italic mt-3 pt-2 border-t border-slate-800">
          {line.trim().slice(1, -1)}
        </p>
      );
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-1.5" />;
    }
    return (
      <p key={idx} className="text-xs text-slate-200 leading-relaxed">
        {renderInline(line, idx)}
      </p>
    );
  });
};

export const AiChatView: React.FC<AiChatViewProps> = ({
  onOpenAccessRequests,
  onOpenEmbedModal,
  applications = [],
}) => {
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  const iamApp = applications.find((a) => a.id === 'app-iam-sec');
  const aiSummaryConfig = iamApp?.aiSummaryConfig;
  // /demo keeps the original scenario-driven chat; the regular app uses the MCP server picker.
  const demo = isDemoMode();
  // Outside /demo the assistant is branded with the MCP Nexus logo (same icon as the nav brand).
  const BrandIcon = demo ? Bot : Cpu;
  const [selectedScenario, setSelectedScenario] = useState<DemoScenarioId>('scenario-1-success');
  const [selectedServerId, setSelectedServerId] = useState(() => {
    if (isDemoMode()) return '';
    try {
      return sessionStorage.getItem(SERVER_KEY) ?? '';
    } catch {
      return '';
    }
  });
  // Outside /demo the picker is fed straight from GET /api/mcp-servers (not the app-wide list, which
  // silently falls back to static demo fixtures when the API is down).
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [serversState, setServersState] = useState<'loading' | 'ready' | 'error'>(demo ? 'ready' : 'loading');
  const selectableServers = mcpServers.filter((s) => s.status === 'Active');
  const selectedServer = selectableServers.find((s) => s.id === selectedServerId);
  const [sessionId, setSessionId] = useState('');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    fetchMcpServers()
      .then((list) => {
        if (cancelled) return;
        setMcpServers(list);
        setServersState('ready');
      })
      .catch((err) => {
        console.warn('Could not load MCP servers for the chat picker.', err);
        if (!cancelled) setServersState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the saved history whenever the picked server changes, and save on every message change.
  // The save effect only depends on `messages`, so switching servers never writes the previous
  // server's messages under the new key.
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (demo) return;
    skipNextSave.current = true;
    try {
      sessionStorage.setItem(SERVER_KEY, selectedServerId);
    } catch {
      // ignore
    }
    setMessages(selectedServerId ? readHistory()[selectedServerId] ?? [] : []);
    setSessionId(selectedServerId ? readSessions()[selectedServerId] ?? '' : '');
  }, [selectedServerId]);

  useEffect(() => {
    if (demo || !selectedServerId) return;
    // The first run after (re)loading a server's history still holds the stale in-memory list;
    // saving it would wipe what was just stored.
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    writeHistory(selectedServerId, messages);
  }, [messages]);

  // Auto scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Load Scenario logic
  // Demo replaces the conversation with the full scripted scenario; otherwise only the AI reply
  // is appended so the user's own typed message is kept.
  const setScenarioReply = (msgs: ChatMessage[]) =>
    setMessages((prev) => (demo ? msgs : [...prev, ...msgs.filter((m) => m.sender === 'ai')]));

  const loadScenario = (scenarioId: DemoScenarioId) => {
    setSelectedScenario(scenarioId);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      switch (scenarioId) {
        case 'scenario-1-success':
          setScenarioReply([
            {
              id: 'm-1',
              sender: 'user',
              text: "Show me John's recent transactions.",
              timestamp: 'Just now',
            },
            {
              id: 'm-2',
              sender: 'ai',
              text: "I've retrieved John Smith's recent transaction records from the Customer Transaction Portal MCP. Here is the verified account activity:",
              timestamp: 'Just now',
              actionsTaken: {
                identifiedCustomer: 'John Smith (C12345)',
                mcpServer: 'Customer Transaction Portal MCP',
                toolsCalled: ['getCustomer', 'getCustomerTransactions'],
                authStatus: 'verified',
              },
              structuredData: {
                type: 'transactions',
                data: {
                  customer: { name: 'John Smith', id: 'C12345', tier: 'Standard' },
                  transactions: [
                    { id: 'TX1001', date: 'Aug 14, 2026', merchant: 'Whole Foods Market', category: 'Groceries', amount: 125.50, status: 'COMPLETED' },
                    { id: 'TX1002', date: 'Aug 12, 2026', merchant: 'Chevron Gas Station', category: 'Automotive', amount: 82.30, status: 'COMPLETED' },
                    { id: 'TX1003', date: 'Aug 10, 2026', merchant: 'Delta Airlines Flights', category: 'Travel', amount: 240.00, status: 'COMPLETED' },
                  ],
                  total: 447.80,
                },
              },
              sourcesAndActions: [
                {
                  mcpServer: 'Customer Transaction Portal MCP',
                  tools: ['getCustomer', 'getCustomerTransactions'],
                },
              ],
              technicalDetails: {
                resolvedCustomerId: 'C12345',
                latencyMs: 148,
                authorizationToken: 'Bearer eyJhbGciOi... (GROUP_TRANSACTION_VIEW verified)',
                httpStatus: 200,
              },
            },
          ]);
          break;

        case 'scenario-2-permission-denied':
          setScenarioReply([
            {
              id: 'm-2-1',
              sender: 'user',
              text: "Show me John's transactions.",
              timestamp: 'Just now',
            },
            {
              id: 'm-2-2',
              sender: 'ai',
              text: "I found John Smith's transaction information in the system, but you do not currently hold the required security entitlement to view financial transaction records.",
              timestamp: 'Just now',
              actionsTaken: {
                identifiedCustomer: 'John Smith (C12345)',
                mcpServer: 'IAM & Access Governance MCP',
                toolsCalled: ['getUserAccess', 'getCustomerTransactions'],
                authStatus: 'denied',
              },
              structuredData: {
                type: 'permission_denied',
                data: {
                  requiredGroup: 'GROUP_TRANSACTION_VIEW',
                  reason: 'Transaction viewing permission is required by enterprise policy.',
                  hasRequested: false,
                },
              },
              sourcesAndActions: [
                {
                  mcpServer: 'IAM & Access Governance MCP',
                  tools: ['getUserAccess'],
                },
              ],
              technicalDetails: {
                userId: 'pvseshu@aexp.com',
                missingEntitlement: 'GROUP_TRANSACTION_VIEW',
                policyEnforcement: 'Strict Zero-Trust RBAC',
              },
            },
          ]);
          break;

        case 'scenario-3-multi-orchestration':
          setScenarioReply([
            {
              id: 'm-3-1',
              sender: 'user',
              text: "Show me John's transactions and check whether he has premium access.",
              timestamp: 'Just now',
            },
            {
              id: 'm-3-2',
              sender: 'ai',
              text: "I coordinated with both the Customer Transaction Portal MCP and the IAM Governance MCP through the MCP Orchestrator.",
              timestamp: 'Just now',
              actionsTaken: {
                identifiedCustomer: 'John Smith (C12345)',
                mcpServer: 'Customer Transaction MCP + IAM MCP',
                toolsCalled: ['getCustomer', 'getCustomerTransactions', 'getUserAccess'],
                authStatus: 'verified',
              },
              structuredData: {
                type: 'multi_orchestration',
                data: {
                  customer: 'John Smith (C12345)',
                  totalTransactions: 3,
                  totalAmount: 447.80,
                  tier: 'Standard',
                  hasPremium: false,
                  summary: 'John Smith has 3 recent transactions totaling $447.80. He currently has Standard access and does not have Premium access.',
                },
              },
              sourcesAndActions: [
                {
                  mcpServer: 'Customer Transaction Portal MCP',
                  tools: ['getCustomer', 'getCustomerTransactions'],
                },
                {
                  mcpServer: 'IAM & Access Governance MCP',
                  tools: ['getUserAccess'],
                },
              ],
              technicalDetails: {
                orchestrationHops: 2,
                totalExecutionMs: 290,
                orchestratorJobId: 'ORCH-9941',
              },
            },
          ]);
          break;

        case 'scenario-4-knowledge-search':
          setScenarioReply([
            {
              id: 'm-4-1',
              sender: 'user',
              text: 'What is the process for requesting production access?',
              timestamp: 'Just now',
            },
            {
              id: 'm-4-2',
              sender: 'ai',
              text: 'According to our official enterprise security documentation:',
              timestamp: 'Just now',
              actionsTaken: {
                knowledgeSearched: ['Production Access Procedure.pdf', 'Security Access Guidelines', 'Production Access FAQ'],
              },
              structuredData: {
                type: 'knowledge_result',
                data: {
                  summary:
                    'To request production access, submit an access request through the IAM portal and obtain approval from your application owner. Dual-custody approval is mandatory for financial ledger groups, and temporary credentials expire automatically after 8 hours.',
                  sources: [
                    { title: 'Production Access Procedure.pdf', type: 'PDF', date: 'Aug 14, 2026', relevance: '98%' },
                    { title: 'Security Access Guidelines', type: 'Web Source', date: 'Aug 10, 2026', relevance: '92%' },
                    { title: 'Production Access FAQ', type: 'Article', date: 'Aug 20, 2026', relevance: '88%' },
                  ],
                },
              },
              knowledgeSources: [
                { title: 'Production Access Procedure.pdf', type: 'PDF', date: 'Aug 14, 2026' },
                { title: 'Security Access Guidelines', type: 'Web', date: 'Aug 10, 2026' },
              ],
            },
          ]);
          break;

        case 'scenario-5-not-integrated':
          setScenarioReply([
            {
              id: 'm-5-1',
              sender: 'user',
              text: "Show me John's payroll information.",
              timestamp: 'Just now',
            },
            {
              id: 'm-5-2',
              sender: 'ai',
              text: "I checked our enterprise MCP Catalog, but I couldn't find an integrated application or MCP capability that provides payroll or HR compensation information.",
              timestamp: 'Just now',
              actionsTaken: {
                mcpServer: 'MCP Catalog Registry',
                toolsCalled: ['queryCatalog'],
              },
              structuredData: {
                type: 'not_integrated',
                data: {
                  availableDomains: [
                    'Customer Information & Profiles',
                    'Transaction History & Disputed Charges',
                    'Case Management & Tickets',
                    'IAM Security & Entitlements',
                    'Core Banking Balances',
                  ],
                },
              },
            },
          ]);
          break;

        case 'scenario-6-combined-knowledge-mcp':
          setScenarioReply([
            {
              id: 'm-6-1',
              sender: 'user',
              text: 'How do I request access to the transaction application, and do I already have access?',
              timestamp: 'Just now',
            },
            {
              id: 'm-6-2',
              sender: 'ai',
              text: 'I combined our verified knowledge repository with a real-time entitlement lookup from the IAM MCP to give you a complete answer:',
              timestamp: 'Just now',
              actionsTaken: {
                knowledgeSearched: ['Production Access Procedure.pdf'],
                mcpServer: 'IAM & Access Governance MCP',
                toolsCalled: ['getUserAccess'],
                authStatus: 'verified',
              },
              structuredData: {
                type: 'combined',
                data: {
                  policySummary:
                    'Per the Production Access Procedure, transaction portal access requires the GROUP_TRANSACTION_VIEW security group approved by your team lead.',
                  liveStatus:
                    'Real-Time Check: Your account (pvseshu@aexp.com) currently has Standard Operator roles, but does NOT yet have the GROUP_TRANSACTION_VIEW entitlement.',
                  hasRequested: false,
                },
              },
              sourcesAndActions: [
                {
                  mcpServer: 'IAM & Access Governance MCP',
                  tools: ['getUserAccess'],
                },
              ],
              knowledgeSources: [
                { title: 'Production Access Procedure.pdf', type: 'PDF', date: 'Aug 14, 2026' },
              ],
            },
          ]);
          break;
      }
    }, 450);
  };

  useEffect(() => {
    if (demo) loadScenario('scenario-1-success');
  }, []);

  const handleCustomSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || (!demo && !selectedServer)) return;

    const userText = inputPrompt;
    setInputPrompt('');

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsProcessing(true);

    if (!demo && selectedServer) {
      // Real chat: wait for the API (spinner shows while isProcessing); a failure or a 10-minute
      // timeout shows the default error message.
      let aiText = CHAT_ERROR_MESSAGE;
      let isError = true;
      let items: string[] = [];
      try {
        const res = await sendChatMessage(userText, selectedServer, sessionId);
        if (res.sessionId) {
          setSessionId(res.sessionId);
          writeSession(selectedServer.id, res.sessionId);
        }
        aiText = res.message;
        isError = res.status === 'error';
        items = res.list;
      } catch {
        // keep the default error message
      }
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', text: aiText, timestamp: 'Just now', isError, items },
      ]);
      setIsProcessing(false);
      return;
    }

    setTimeout(() => {
      setIsProcessing(false);
      const lower = userText.toLowerCase();

      if (lower.includes('payroll') || lower.includes('salary') || lower.includes('hr')) {
        loadScenario('scenario-5-not-integrated');
      } else if (lower.includes('how do i') || lower.includes('policy') || lower.includes('procedure')) {
        loadScenario('scenario-4-knowledge-search');
      } else if (lower.includes('premium') || lower.includes('and check')) {
        loadScenario('scenario-3-multi-orchestration');
      } else if (lower.includes('permission') || lower.includes('deny')) {
        loadScenario('scenario-2-permission-denied');
      } else {
        loadScenario('scenario-1-success');
      }
    }, 550);
  };

  // Handler for clicking "Request Access" in Scenario 2 or 6
  const handleRequestAccessClick = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.structuredData) {
          return {
            ...m,
            structuredData: {
              ...m.structuredData,
              data: {
                ...m.structuredData.data,
                hasRequested: true,
                requestId: 'AR-10245',
              },
            },
          };
        }
        return m;
      })
    );

    setTimeout(() => {
      const confirmationMsg: ChatMessage = {
        id: `conf-${Date.now()}`,
        sender: 'ai',
        text: "I've submitted the access request for GROUP_TRANSACTION_VIEW. Your request ID is AR-10245 (Status: Pending Approval).",
        timestamp: 'Just now',
        sourcesAndActions: [
          {
            mcpServer: 'IAM & Access Governance MCP',
            tools: ['requestAccess'],
          },
        ],
        technicalDetails: {
          invokedMcp: 'IAM & Access Governance MCP',
          tool: 'requestAccess',
          generatedRequestId: 'AR-10245',
          approverQueue: 'SECURITY_OPS_LEAD',
        },
      };
      setMessages((prev) => [...prev, confirmationMsg]);
    }, 400);
  };

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-slate-50 animate-fadeIn" id="ai-chat-view">
      {/* Top Controls & MCP Server Picker */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
            <BrandIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">MCP Nexus AI</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  !demo && serversState === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {demo
                  ? 'Connected to 24 MCPs + Knowledge'
                  : serversState === 'error'
                    ? 'MCP servers unavailable'
                    : `Connected to ${selectableServers.length} ${selectableServers.length === 1 ? 'MCP' : 'MCPs'} + Knowledge`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Autonomous Tool Orchestrator & Knowledge Assistant</p>
          </div>
        </div>

        {/* MCP Server Picker & Embed Button */}
        <div className="flex items-center gap-3 flex-wrap">
          {aiSummaryConfig?.enabled && (
            <button
              onClick={() => setShowAiSummaryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-colors cursor-pointer shadow-2xs"
              title={`Preview the configured "${aiSummaryConfig.title}" for IAM & Security Governance`}
              id="ai-summary-button"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Summary</span>
            </button>
          )}

          {onOpenEmbedModal && (
            <button
              onClick={onOpenEmbedModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
              title="Integrate MCP Chat in your own application"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Embed Chat in App</span>
            </button>
          )}

          {demo ? (
          <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200 rounded-xl px-3 py-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs font-bold text-indigo-950 whitespace-nowrap">Demo Scenario:</span>
            <select
              value={selectedScenario}
              onChange={(e) => loadScenario(e.target.value as DemoScenarioId)}
              className="bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              id="demo-scenario-selector"
            >
              <option value="scenario-1-success">1. Successful API Query</option>
              <option value="scenario-2-permission-denied">2. Permission Denied ➔ Access Request</option>
              <option value="scenario-3-multi-orchestration">3. Multi-MCP Orchestration</option>
              <option value="scenario-4-knowledge-search">4. Enterprise Knowledge Search</option>
              <option value="scenario-5-not-integrated">5. Application Not Integrated</option>
              <option value="scenario-6-combined-knowledge-mcp">6. Combined Knowledge + MCP</option>
            </select>
          </div>
          ) : (
          <>
          {messages.length > 0 && (
            <button
              onClick={() => {
                // A cleared chat is a new chat: drop the backend session id along with the history.
                setMessages([]);
                setSessionId('');
                if (selectedServerId) writeSession(selectedServerId, '');
              }}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Clear this chat's history"
              id="chat-clear-btn"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200 rounded-xl px-3 py-1.5">
            <Server className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs font-bold text-indigo-950 whitespace-nowrap">MCP Server:</span>
            <select
              value={selectedServerId}
              onChange={(e) => setSelectedServerId(e.target.value)}
              className="bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs max-w-56"
              id="chat-mcp-server-selector"
            >
              <option value="">
                {serversState === 'loading'
                  ? 'Loading MCP servers…'
                  : serversState === 'error'
                    ? 'Could not load MCP servers'
                    : selectableServers.length === 0
                      ? 'No active MCP servers'
                      : 'Select an MCP server…'}
              </option>
              {selectableServers.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>
          </>
          )}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto" id="chat-messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-xs mt-0.5">
                <BrandIcon className="w-4 h-4" />
              </div>
            )}

            <div className={`space-y-3 max-w-2xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-wrap break-words ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                    : msg.isError
                      ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-xs flex items-start gap-2'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                }`}
              >
                {msg.isError && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 -mt-0.5" />}
                <span>{msg.text}</span>
              </div>

              {/* Menu of items returned by the chat API, styled like the demo result cards */}
              {msg.items && msg.items.length > 0 && (
                <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="flex items-center gap-2 font-bold text-xs text-indigo-950">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Results</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                      {msg.items.length} {msg.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {msg.items.map((item, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors flex items-center gap-3 text-xs"
                      >
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
                          {i + 1}
                        </span>
                        <span className="font-bold text-slate-800 break-words min-w-0">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expandable Execution Actions Banner */}
              {msg.actionsTaken && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-indigo-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Autonomous AI Actions & Reasoning</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold uppercase">Executed Live</span>
                  </div>

                  <div className="space-y-1 text-slate-700 font-mono text-[11px]">
                    {msg.actionsTaken.identifiedCustomer && (
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Identified customer: <strong>{msg.actionsTaken.identifiedCustomer}</strong></span>
                      </div>
                    )}
                    {msg.actionsTaken.mcpServer && (
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Target: <strong>{msg.actionsTaken.mcpServer}</strong></span>
                      </div>
                    )}
                    {msg.actionsTaken.toolsCalled && (
                      <div className="flex items-center gap-1.5 text-indigo-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Invoked Tools: <strong>{msg.actionsTaken.toolsCalled.join(' ➔ ')}</strong></span>
                      </div>
                    )}
                    {msg.actionsTaken.authStatus === 'verified' && (
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Authorization Entitlement Verified</span>
                      </div>
                    )}
                    {msg.actionsTaken.authStatus === 'denied' && (
                      <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Permission Check: Access Group Required</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scenario 1: Formatted Transactions Results */}
              {msg.structuredData?.type === 'transactions' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">
                      Recent Transactions for {msg.structuredData.data.customer.name}
                    </span>
                    <span className="font-bold text-xs text-emerald-700">
                      Total: ${msg.structuredData.data.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {msg.structuredData.data.transactions.map((tx: any) => (
                      <div
                        key={tx.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{tx.merchant}</div>
                          <div className="text-[10px] text-slate-400">
                            {tx.date} • {tx.category} • {tx.id}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-900">${tx.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scenario 2: Permission Denied & Actionable Request Card */}
              {msg.structuredData?.type === 'permission_denied' && (
                <div className="border border-amber-300 bg-amber-50/70 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">Required Enterprise Access</h4>
                      <p className="text-xs text-amber-800 mt-0.5 font-mono font-bold">
                        {msg.structuredData.data.requiredGroup}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">{msg.structuredData.data.reason}</p>
                    </div>
                  </div>

                  {!msg.structuredData.data.hasRequested ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                      <button
                        onClick={() => handleRequestAccessClick(msg.id)}
                        className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Request Access
                      </button>
                      <button className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100/60">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-amber-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Access request submitted (ID: {msg.structuredData.data.requestId} — Pending Approval)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Scenario 3: Multi-Orchestration Result */}
              {msg.structuredData?.type === 'multi_orchestration' && (
                <div className="bg-white border border-purple-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Multi-MCP Analysis Complete</span>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100 text-xs text-slate-800 leading-relaxed">
                    {msg.structuredData.data.summary}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-slate-50 border">
                      <span className="text-[10px] text-slate-400 block">Customer Transaction MCP</span>
                      <strong className="text-slate-900">3 Transactions ($447.80)</strong>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 border">
                      <span className="text-[10px] text-slate-400 block">IAM Governance MCP</span>
                      <strong className="text-amber-800">Standard Tier (No Premium)</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Scenario 4: Knowledge Result & Sources */}
              {msg.structuredData?.type === 'knowledge_result' && (
                <div className="bg-white border border-teal-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {msg.structuredData.data.summary}
                  </p>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                      Referenced Enterprise Knowledge Sources:
                    </span>
                    {msg.structuredData.data.sources.map((src: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-bold text-slate-900">{src.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                            {src.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">Updated {src.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scenario 5: Application Not Integrated (Helpful informational state) */}
              {msg.structuredData?.type === 'not_integrated' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>No Integrated MCP Capability Found for Payroll</span>
                  </div>

                  <p className="text-xs text-blue-800 leading-relaxed">
                    MCP Nexus enforces strict governance and does not simulate or hallucinate capabilities that are not registered in the MCP Catalog.
                  </p>

                  <div className="pt-2 border-t border-blue-200">
                    <span className="text-[11px] font-bold text-blue-900 block mb-1">
                      Currently Available Enterprise Domains:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.structuredData.data.availableDomains.map((dom: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded bg-white text-blue-800 border border-blue-200 text-[11px] font-medium"
                        >
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Scenario 6: Combined Knowledge + MCP Action */}
              {msg.structuredData?.type === 'combined' && (
                <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3 shadow-xs">
                  {/* Knowledge Side */}
                  <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-100 text-xs text-slate-800 space-y-1">
                    <span className="font-bold text-teal-900 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-teal-600" />
                      <span>Enterprise Policy (Knowledge Hub):</span>
                    </span>
                    <p className="leading-relaxed">{msg.structuredData.data.policySummary}</p>
                  </div>

                  {/* Live MCP State */}
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs text-slate-800 space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Live Entitlement State (IAM MCP):</span>
                    </span>
                    <p className="leading-relaxed">{msg.structuredData.data.liveStatus}</p>
                  </div>

                  {!msg.structuredData.data.hasRequested ? (
                    <button
                      onClick={() => handleRequestAccessClick(msg.id)}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      + Submit JIT Access Request for GROUP_TRANSACTION_VIEW
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Access Request AR-10245 submitted to Security Operations queue.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sources & Actions Footer */}
              {msg.sourcesAndActions && msg.sourcesAndActions.length > 0 && (
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-600">Sources & Actions:</span>
                  {msg.sourcesAndActions.map((sa, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]"
                    >
                      {sa.mcpServer} ({sa.tools.join(', ')})
                    </span>
                  ))}
                </div>
              )}

              {/* Technical Details Accordion */}
              {msg.technicalDetails && (
                <div>
                  <button
                    onClick={() =>
                      setExpandedDetailsId(expandedDetailsId === msg.id ? null : msg.id)
                    }
                    className="text-[10px] text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>
                      {expandedDetailsId === msg.id ? 'Hide Execution Telemetry' : 'Expand Execution Telemetry'}
                    </span>
                    {expandedDetailsId === msg.id ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {expandedDetailsId === msg.id && (
                    <pre className="mt-1.5 p-2.5 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                      {JSON.stringify(msg.technicalDetails, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-3 text-xs text-indigo-600 font-semibold">
            <RotateCw className="w-4 h-4 animate-spin" />
            <span>MCP Nexus is orchestrating tools & knowledge...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
        <form
          onSubmit={handleCustomSend}
          className="max-w-4xl mx-auto flex items-center gap-3 relative"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={!demo && !selectedServer}
            placeholder={demo ? 'Ask about customer transactions, access policies, or type custom query...' : selectedServer ? `Message ${selectedServer.name}...` : 'Select an MCP server to start chatting'}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-400"
            id="chat-input-prompt"
          />

          <button
            type="submit"
            disabled={(!demo && !selectedServer) || !inputPrompt.trim() || isProcessing}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            id="chat-send-btn"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* AI Summary Preview Modal */}
      {showAiSummaryModal && aiSummaryConfig && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          id="ai-summary-modal"
        >
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-purple-950 via-slate-950 to-slate-950">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{aiSummaryConfig.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                      {iamApp?.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Generated using the AI Summary instructions configured for this application in Settings.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiSummaryModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer flex-shrink-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Body: Sample Output */}
            <div className="p-5 overflow-y-auto flex-1 space-y-1">
              {renderSummaryMarkdown(aiSummaryConfig.sampleOutput)}
            </div>

            {/* Footer: Underlying Instructions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Admin-Provided Instructions Behind This Summary
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">{aiSummaryConfig.instructions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
