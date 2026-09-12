import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Bot,
  User,
  Clock,
  Wrench,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { ConversationSession, ChatMessage } from '../types';

interface ConversationsViewProps {
  conversations?: ConversationSession[];
  sessions?: ConversationSession[];
  onOpenAiChat?: (conversationId?: string) => void;
  onResumeSession?: (session: ConversationSession) => void;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({
  conversations: rawConversations,
  sessions: rawSessions,
  onOpenAiChat,
  onResumeSession,
}) => {
  const conversations = rawConversations || rawSessions || [];
  const handleOpenChat = (session?: ConversationSession) => {
    if (onResumeSession && session) {
      onResumeSession(session);
    } else if (onOpenAiChat) {
      onOpenAiChat(session?.id);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState<ConversationSession | null>(
    conversations?.[0] || null
  );

  const allTags = ['ALL', ...Array.from(new Set(conversations.flatMap((c) => c.tags || [])))];

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.applicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = selectedTagFilter === 'ALL' || (c.tags && c.tags.includes(selectedTagFilter));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn" id="conversations-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Conversations & Session History</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Audit Traces & Transcripts
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Browse full enterprise AI chat sessions, tool execution trees, authorization audits, and token telemetry.
          </p>
        </div>

        <button
          onClick={() => handleOpenChat()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>New AI Chat Session</span>
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sessions List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Tag Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations, user, app..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(tag)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedTagFilter === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Session Cards */}
          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {filtered.map((session) => {
              const isSelected = selectedSession?.id === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{session.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex-shrink-0">
                      {session.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{session.summary}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-slate-600">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{session.user}</span>
                    </div>
                    <span>{session.startedAt}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {session.toolsInvoked.map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No conversations match your filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Session Detail & Transcript */}
        <div className="lg:col-span-7 space-y-4">
          {selectedSession ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Session Detail Header */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedSession.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span>User: <strong>{selectedSession.user}</strong> ({selectedSession.userEmail})</span>
                    <span>•</span>
                    <span>App: <strong>{selectedSession.applicationName}</strong></span>
                    <span>•</span>
                    <span>Tokens: <strong>{selectedSession.tokensUsed}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenChat(selectedSession)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Resume in Live Chat</span>
                </button>
              </div>

              {/* Transcript Messages */}
              <div className="p-6 space-y-5 max-h-[550px] overflow-y-auto bg-slate-50/30">
                {selectedSession.messages && selectedSession.messages.length > 0 ? (
                  selectedSession.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white shadow-xs rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-none space-y-2.5'
                        }`}
                      >
                        <div className="whitespace-pre-line font-sans">{msg.text}</div>

                        {/* MCP Tools & Actions Badge */}
                        {msg.sourcesAndActions && msg.sourcesAndActions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50 p-2 rounded-lg space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                              <Wrench className="w-3 h-3 text-indigo-600" />
                              <span>MCP Execution Trace</span>
                            </div>
                            {msg.sourcesAndActions.map((sa, idx) => (
                              <div key={idx} className="text-[11px] font-mono text-indigo-700">
                                <p className="font-semibold text-slate-700">{sa.mcpServer}:</p>
                                {sa.tools.map((t, i) => (
                                  <p key={i} className="pl-2 text-indigo-600">↳ {t}</p>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Grounded Knowledge Sources */}
                        {msg.knowledgeSources && msg.knowledgeSources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 bg-teal-50/50 p-2 rounded-lg space-y-1 text-teal-800">
                            <div className="text-[10px] font-bold uppercase text-teal-600 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>Grounded Knowledge</span>
                            </div>
                            {msg.knowledgeSources.map((ks, i) => (
                              <div key={i} className="text-[11px]">
                                • <strong>{ks.title}</strong> ({ks.type})
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                          {msg.timestamp}
                        </div>
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-xs">No individual message transcripts recorded for this batch session.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Select a conversation session to view transcript</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
