import React, { useState } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronDown,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Building,
  CreditCard,
  TrendingUp,
  Clock,
  Search,
  User,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { EnterpriseApplication } from '../types';

interface AppEmbedPreviewModalProps {
  application: EnterpriseApplication;
  onClose: () => void;
  primaryColor?: string;
  widgetTitle?: string;
}

export const AppEmbedPreviewModal: React.FC<AppEmbedPreviewModalProps> = ({
  application,
  onClose,
  primaryColor = '#4f46e5',
  widgetTitle = 'AI Support & Servicing Assistant',
}) => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string; time: string; toolCalled?: string }[]>([
    {
      sender: 'ai',
      text: `Hello! I am your AI Assistant powered by **${application.name} MCP**. I can help you search customer records, check transaction histories, and resolve discrepancies in real time.`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const samplePrompts = [
    'Show transactions for customer C12345 in August 2026',
    'What is the dispute status on reference #TXN-9021?',
    'Get profile details for customer C12345',
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputText;
    if (!q.trim()) return;

    const userMsg = { sender: 'user' as const, text: q, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsAiTyping(true);

    setTimeout(() => {
      let aiReply = '';
      let tool = '';
      if (q.toLowerCase().includes('transaction') || q.toLowerCase().includes('c12345')) {
        aiReply = `Found 3 transactions for customer **C12345 (John Smith)** totaling **$447.80** in August 2026:\n\n• Aug 12: AMEX Superstore ($142.50) [Settled]\n• Aug 08: Cloud Services Direct ($215.30) [Settled]\n• Aug 03: Downtown Cafe ($90.00) [Settled]`;
        tool = 'getCustomerTransactions(customerId="C12345")';
      } else if (q.toLowerCase().includes('profile')) {
        aiReply = `**Customer C12345:**\nName: John Smith\nEmail: j.smith@example.com\nAccount Tier: Premier Retail (Active)\nKYC Status: Verified`;
        tool = 'getCustomer(customerId="C12345")';
      } else {
        aiReply = `I have executed the query against **${application.mcpServerName}**. All zero-trust permissions were validated and audit logs have been recorded.`;
        tool = 'searchCustomer(query="' + q + '")';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai' as const,
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolCalled: tool,
        },
      ]);
      setIsAiTyping(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden animate-fadeIn" id="app-embed-full-preview">
      {/* Top Banner indicating Preview Mode */}
      <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between shadow-md border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider">
            Live Host App Preview
          </span>
          <p className="text-xs text-slate-300 font-medium">
            Simulating embedded MCP Chat Widget in your own application: <strong>{application.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Host Context: White Background Customer Portal
          </span>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Preview</span>
          </button>
        </div>
      </div>

      {/* Realistic Host Enterprise Application (Full Pure White Background) */}
      <div className="flex-1 bg-white overflow-y-auto relative">
        {/* Host App Navigation */}
        <header className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                A
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm tracking-tight">AMEX Digital Banking</span>
                <span className="text-[10px] text-slate-400 block font-mono">Enterprise Customer Hub</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
              <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-600 font-bold border-b-2 border-indigo-600 pb-1">
                Accounts & Ledgers
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-900">
                Transactions
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-900">
                Case Resolutions
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-900">
                Card Management
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">John Smith (C12345)</div>
              <div className="text-[10px] text-slate-400 font-mono">Premier Wealth Account</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
              JS
            </div>
          </div>
        </header>

        {/* Host App Body Content (White Canvas) */}
        <main className="p-8 max-w-6xl mx-auto space-y-8 bg-white">
          {/* Welcome Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-200">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Welcome to AMEX Customer Servicing Portal</h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time accounts, SWIFT settlement clearing, and automated AI assistance powered by MCP Nexus.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero-Trust Auth Connected</span>
              </span>
            </div>
          </div>

          {/* Account Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Checking Balance</span>
                <CreditCard className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">$142,850.00</div>
              <span className="text-[11px] text-emerald-600 font-medium">+$2,400.00 posted this week</span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Monthly Volume</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">$38,190.20</div>
              <span className="text-[11px] text-slate-500">Across 24 cleared transactions</span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Active Disputes</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">0 Open Cases</div>
              <span className="text-[11px] text-slate-500">100% SLA compliance</span>
            </div>
          </div>

          {/* Host App Data Table */}
          <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Transactions (August 2026)</h3>
              <span className="text-xs text-slate-400 font-mono">Live Ledger Sync</span>
            </div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Reference ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="px-6 py-3.5 font-bold text-indigo-600">TXN-88401</td>
                  <td className="px-6 py-3.5 text-slate-600">2026-08-12</td>
                  <td className="px-6 py-3.5 font-sans font-medium text-slate-900">AMEX Superstore #402</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">$142.50</td>
                  <td className="px-6 py-3.5"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Settled</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-bold text-indigo-600">TXN-88402</td>
                  <td className="px-6 py-3.5 text-slate-600">2026-08-08</td>
                  <td className="px-6 py-3.5 font-sans font-medium text-slate-900">Cloud Services Direct Corp</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">$215.30</td>
                  <td className="px-6 py-3.5"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Settled</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-bold text-indigo-600">TXN-88403</td>
                  <td className="px-6 py-3.5 text-slate-600">2026-08-03</td>
                  <td className="px-6 py-3.5 font-sans font-medium text-slate-900">Downtown Cafe & Bakery</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">$90.00</td>
                  <td className="px-6 py-3.5"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Settled</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>

        {/* Embedded MCP Chat Widget (Floating in Bottom-Right of the host app) */}
        <div className="fixed bottom-6 right-6 z-40">
          {isWidgetOpen ? (
            <div className="w-96 rounded-2xl bg-white border border-slate-300 shadow-2xl overflow-hidden flex flex-col animate-scaleUp max-h-[580px] h-[550px] ring-1 ring-slate-900/10">
              {/* Widget Header */}
              <div
                className="p-4 text-white flex items-center justify-between shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold leading-tight">{widgetTitle}</h3>
                    <span className="text-[10px] text-white/80 font-mono">
                      Connected: {application.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsWidgetOpen(false)}
                    className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsWidgetOpen(false)}
                    className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50/50 text-xs">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line font-sans">{msg.text}</p>

                      {msg.toolCalled && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px] font-mono text-indigo-700 bg-slate-50 p-1.5 rounded">
                          <Wrench className="w-3 h-3 text-indigo-600" />
                          <span>Tool: {msg.toolCalled}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 px-1">{msg.time}</span>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white p-2 rounded-xl border border-slate-200 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    <span>Executing MCP tool call...</span>
                  </div>
                )}
              </div>

              {/* Quick Suggestion Pills */}
              <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
                {samplePrompts.map((sp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sp)}
                    className="text-[10px] px-2 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 whitespace-nowrap transition-colors cursor-pointer border border-slate-200"
                  >
                    {sp}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask MCP Assistant..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => handleSend()}
                  style={{ backgroundColor: primaryColor }}
                  className="p-2 rounded-lg text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsWidgetOpen(true)}
              style={{ backgroundColor: primaryColor }}
              className="p-4 rounded-full text-white shadow-2xl hover:scale-105 transition-transform flex items-center justify-center cursor-pointer ring-4 ring-indigo-100"
            >
              <Bot className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
