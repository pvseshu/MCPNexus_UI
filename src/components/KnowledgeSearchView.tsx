import React, { useState } from 'react';
import {
  Search,
  Database,
  Sparkles,
  Sliders,
  FileText,
  Globe,
  Layers,
  ArrowRight,
  Code2,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { KnowledgeSource } from '../types';

interface KnowledgeSearchViewProps {
  sources?: KnowledgeSource[];
  onOpenAiChat: () => void;
}

export const KnowledgeSearchView: React.FC<KnowledgeSearchViewProps> = ({
  sources = [],
  onOpenAiChat,
}) => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(4);
  const [minSimilarity, setMinSimilarity] = useState(70);
  const [hasSearched, setHasSearched] = useState(false);

  const sampleQueries = [
    'What is the dispute handling policy for unauthorized debit card charges?',
    'What permissions are required to access VIP wealth transactions?',
    'How do I onboard a new REST service to an MCP server?',
    'What is the retry SLA for failed SWIFT core ledger settlements?',
  ];

  const simulatedResults = [
    {
      id: 'res-1',
      sourceTitle: 'Production Access Procedure.pdf',
      sourceType: 'PDF',
      score: 0.94,
      chunkIndex: 3,
      content:
        'Section 4.2: Standard Dispute Resolution Procedure. All debit transactions flagged with discrepancy codes must be retrieved using getCustomerTransactions. If dispute amount exceeds $1,000, temporary operator entitlement GROUP_TRANSACTION_VIEW is mandatory.',
      tokens: 380,
    },
    {
      id: 'res-2',
      sourceTitle: 'Retail Banking Dispute SLA Guidelines',
      sourceType: 'Document',
      score: 0.88,
      chunkIndex: 1,
      content:
        'SLA Timelines: Tier-1 consumer fraud disputes must be acknowledged within 2 hours. Automated AI agents can execute provisional credits up to $250.00 without human manager signoff if customer KYC status is Active.',
      tokens: 290,
    },
    {
      id: 'res-3',
      sourceTitle: 'IAM Entitlements & RBAC Standard',
      sourceType: 'Web',
      score: 0.82,
      chunkIndex: 7,
      content:
        'Role Definitions: Operators holding SUPERADMIN or IAM_ADMIN can approve Just-In-Time access requests for GROUP_TRANSACTION_VIEW with expiration windows of 8 hours.',
      tokens: 310,
    },
  ];

  const handleRunSearch = (qText: string) => {
    setQuery(qText);
    setHasSearched(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn" id="knowledge-search-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Semantic Knowledge Vector Search</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Vector Embedding Retrieval
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Test vector similarity search across indexed PDFs, documentation, and enterprise wikis to evaluate grounding context.
          </p>
        </div>

        <button
          onClick={onOpenAiChat}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>Test in AI Chat</span>
        </button>
      </div>

      {/* Search Input Box & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Semantic Query</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setHasSearched(true)}
                placeholder="Ask any natural language question or enter search keywords..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              />
            </div>
            <button
              onClick={() => setHasSearched(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>

        {/* Query Suggestion Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Try sample queries:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => handleRunSearch(sq)}
                className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-600 transition-colors cursor-pointer text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders: Top-K & Min Similarity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-slate-100">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Top-K Chunks</span>
              <span className="text-indigo-600 font-mono">{topK} results</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Min Similarity Threshold</span>
              <span className="text-indigo-600 font-mono">{minSimilarity}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Retrieved Semantic Chunks ({hasSearched ? simulatedResults.length : 0})</span>
          </h2>
          {hasSearched && (
            <span className="text-xs text-slate-500 font-mono">Embedding latency: 48ms</span>
          )}
        </div>

        {hasSearched ? (
          <div className="space-y-3">
            {simulatedResults.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{res.sourceTitle}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">Chunk #{res.chunkIndex}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {(res.score * 100).toFixed(0)}% Match
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{res.tokens} tokens</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed font-sans">
                  "{res.content}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Enter a query or select a sample above</p>
            <p className="text-xs text-slate-400 mt-1">
              Semantic search will retrieve relevant chunks based on vector distance embeddings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
