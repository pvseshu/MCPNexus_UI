import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  Search,
  Plus,
  FileText,
  Globe,
  FileCode,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Tag,
  Calendar,
  Sparkles,
  ArrowRight,
  Upload,
  X,
} from 'lucide-react';
import { KnowledgeSource } from '../types';

// Deterministic color assignment so every category gets a distinct, stable badge color
// (falls back to a rotating palette for categories created ad-hoc via the Add modal).
const CATEGORY_COLOR_PALETTE = [
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
];

const getCategoryColor = (category: string) => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_COLOR_PALETTE[hash % CATEGORY_COLOR_PALETTE.length];
};

interface KnowledgeHubViewProps {
  sources: KnowledgeSource[];
  onAddSource: (newSource: KnowledgeSource) => void;
  onOpenSearch?: () => void;
  showAddModalDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
}

export const KnowledgeHubView: React.FC<KnowledgeHubViewProps> = ({
  sources,
  onAddSource,
  showAddModalDirectly,
  onCloseAddModalDirectly,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PDF' | 'Web' | 'Document' | 'Article'>('ALL');
  const [showAddModal, setShowAddModal] = useState(showAddModalDirectly || false);

  // Add source draft states
  const [sourceType, setSourceType] = useState<'Web' | 'Document' | 'Article' | 'PDF'>('PDF');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [tagsDraft, setTagsDraft] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const existingCategories = Array.from(new Set(sources.map((s) => s.category))).sort();

  const addTagFromInput = () => {
    const next = tagInput.trim().replace(/^#/, '');
    if (next && !tagsDraft.some((t) => t.toLowerCase() === next.toLowerCase())) {
      setTagsDraft((prev) => [...prev, next]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTagsDraft((prev) => prev.filter((t) => t !== tag));
  };

  // Type-specific draft states
  const [webUrl, setWebUrl] = useState('');
  const [crawlSubpages, setCrawlSubpages] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [articleContent, setArticleContent] = useState('');
  const [articleSourceUrl, setArticleSourceUrl] = useState('');

  const resetTypeSpecificFields = () => {
    setWebUrl('');
    setCrawlSubpages(false);
    setDocumentFile(null);
    setIsDragActive(false);
    setArticleContent('');
    setArticleSourceUrl('');
  };

  const handleFileSelected = (file: File | null) => {
    if (!file) return;
    setDocumentFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const filtered = sources.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || s.type === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) return;
    if (sourceType === 'PDF' && !documentFile) return;
    if (sourceType === 'Web' && !webUrl.trim()) return;
    if (sourceType === 'Article' && !articleContent.trim()) return;

    const urlOrFilename =
      sourceType === 'PDF'
        ? documentFile?.name || 'uploaded-document.pdf'
        : sourceType === 'Web'
        ? webUrl
        : articleSourceUrl || 'internal-article';

    const newSource: KnowledgeSource = {
      id: `kn-${Date.now()}`,
      title,
      type: sourceType,
      category,
      owner: 'Current Operator',
      accessLevel: 'Internal',
      tags: tagsDraft.length > 0 ? tagsDraft : ['Enterprise Knowledge', 'AI Grounding'],
      lastUpdated: '2026-08-30',
      urlOrFilename,
      summary: summary || articleContent.slice(0, 160) || 'Enterprise documentation indexed for AI assistant reasoning.',
      indexedItemsCount: Math.floor(Math.random() * 200) + 50,
      relevanceScore: 0.95,
    };

    onAddSource(newSource);
    setShowAddModal(false);
    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
    setTitle('');
    setSummary('');
    setCategory('');
    setTagsDraft([]);
    setTagInput('');
    resetTypeSpecificFields();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="knowledge-hub-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Knowledge Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              1,284 Indexed Sources
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Search and manage enterprise knowledge from one place.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          id="knowledge-add-btn"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Knowledge Source</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Total Knowledge Sources</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">1,284</div>
          <div className="text-[11px] text-teal-600 font-medium mt-0.5">PDFs, Webpages, SOP Documents</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Indexed Document Chunks</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">24,582</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Vector Embeddings Active</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Last Knowledge Sync</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">Today</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Continuous Incremental Indexer</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search policies, SOPs, articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'PDF', 'Web', 'Document', 'Article'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Formats' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item) => {
          const catColor = getCategoryColor(item.category);
          return (
          <div
            key={item.id}
            className={`bg-white border-l-4 border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between ${catColor.border}`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    {item.type === 'PDF' ? (
                      <FileText className="w-4 h-4" />
                    ) : item.type === 'Web' ? (
                      <Globe className="w-4 h-4" />
                    ) : (
                      <BookOpen className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{item.title}</h3>
                    <span
                      className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${catColor.bg} ${catColor.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot}`} />
                      {item.category}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-700">
                  {item.type}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{item.summary}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {item.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-[10px] text-slate-600 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Updated: {item.lastUpdated}</span>
              <span className="font-semibold text-slate-700">
                {item.indexedItemsCount} Chunks Indexed
              </span>
            </div>
          </div>
          );
        })}
      </div>

      {/* Add Knowledge Source Modal — portaled to document.body so the backdrop covers
          the whole window instead of being trapped inside this view's animated wrapper. */}
      {(showAddModal || showAddModalDirectly) &&
        createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Enterprise Knowledge Source</h3>
                  <p className="text-xs text-slate-500">Index documents, SOPs, and wikis for AI assistant reasoning.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  if (onCloseAddModalDirectly) onCloseAddModalDirectly();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Type Options */}
            <div className="grid grid-cols-3 gap-3">
              {(['Document', 'Web', 'Article'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setSourceType(type === 'Document' ? 'PDF' : type);
                    resetTypeSpecificFields();
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    (sourceType === 'PDF' && type === 'Document') || sourceType === type
                      ? 'border-teal-500 bg-teal-50/60 text-teal-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div className="text-xs">{type}</div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {type === 'Document' ? 'Upload PDF/Doc' : type === 'Web' ? 'Scrape URL' : 'Rich Text'}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Knowledge Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Production Access Procedure"
                  className="w-full px-3.5 py-2 border rounded-lg"
                />
              </div>

              {sourceType === 'PDF' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Upload File *</label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('knowledge-file-input')?.click()}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-teal-500 bg-teal-50/60'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className={`w-5 h-5 ${isDragActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    {documentFile ? (
                      <>
                        <span className="font-semibold text-slate-800">{documentFile.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {(documentFile.size / 1024).toFixed(0)} KB &middot; click or drop to replace
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-700">Drag &amp; drop a file here, or click to browse</span>
                        <span className="text-[10px] text-slate-400">PDF, DOC, DOCX up to 25MB</span>
                      </>
                    )}
                    <input
                      id="knowledge-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              )}

              {sourceType === 'Web' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Source URL *</label>
                    <input
                      type="url"
                      required
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      placeholder="e.g. https://docs.internal.aexp.com/policies/access"
                      className="w-full px-3.5 py-2 border rounded-lg font-mono"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crawlSubpages}
                      onChange={(e) => setCrawlSubpages(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-slate-600">Crawl and index linked subpages</span>
                  </label>
                </div>
              )}

              {sourceType === 'Article' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Article Content *</label>
                    <textarea
                      rows={5}
                      required
                      value={articleContent}
                      onChange={(e) => setArticleContent(e.target.value)}
                      placeholder="Paste or write the rich text content of the article..."
                      className="w-full px-3.5 py-2 border rounded-lg leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Source URL (optional)</label>
                    <input
                      type="url"
                      value={articleSourceUrl}
                      onChange={(e) => setArticleSourceUrl(e.target.value)}
                      placeholder="e.g. https://wiki.internal.aexp.com/article"
                      className="w-full px-3.5 py-2 border rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  list="knowledge-category-options"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Security & IAM Policies (pick existing or type a new one)"
                  className="w-full px-3.5 py-2 border rounded-lg"
                />
                <datalist id="knowledge-category-options">
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {category && (
                  <span
                    className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${getCategoryColor(category).bg} ${getCategoryColor(category).text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(category).dot}`} />
                    {existingCategories.includes(category) ? 'Existing category' : 'New category'}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tags</label>
                <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 border rounded-lg">
                  {tagsDraft.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 border border-teal-100 text-teal-700 font-medium"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-teal-400 hover:text-teal-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTagFromInput();
                      } else if (e.key === 'Backspace' && !tagInput && tagsDraft.length > 0) {
                        removeTag(tagsDraft[tagsDraft.length - 1]);
                      }
                    }}
                    onBlur={addTagFromInput}
                    placeholder={tagsDraft.length === 0 ? 'e.g. IAM, Production Access, Approval Workflow' : 'Add another tag...'}
                    className="flex-1 min-w-[120px] py-0.5 outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Press Enter or comma to add a tag.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Summary / AI Scope</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe the domain knowledge contained in this document..."
                  className="w-full px-3.5 py-2 border rounded-lg leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
                  }}
                  className="px-4 py-2 border rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Index & Ground Knowledge
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
