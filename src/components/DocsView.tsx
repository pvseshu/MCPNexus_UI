import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import mermaid from 'mermaid';
import { BookOpen, FileText, List, ExternalLink, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';
import readmeSource from '../../README.md?raw';
import conceptSource from '../../PROJECT_CONCEPT.md?raw';

interface DocEntry {
  id: 'readme' | 'concept';
  label: string;
  icon: React.ElementType;
  source: string;
}

const DOCS: DocEntry[] = [
  { id: 'readme', label: 'README', icon: FileText, source: readmeSource },
  { id: 'concept', label: 'Project Concept', icon: BookOpen, source: conceptSource },
];

interface Heading {
  depth: number;
  text: string;
  slug: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

// Tailwind utility classes drive all typography colors so the docs viewer
// automatically re-skins with the app's 5 theme overrides in index.css —
// no doc-specific CSS variables needed.
const renderer = new marked.Renderer();

renderer.heading = ({ tokens, depth }) => {
  const text = tokens.map((t: any) => t.raw ?? t.text ?? '').join('');
  const slug = slugify(text);
  const sizes: Record<number, string> = {
    1: 'text-3xl font-extrabold mt-2 mb-4 pb-3 border-b border-slate-200',
    2: 'text-2xl font-bold mt-10 mb-4 pb-2 border-b border-slate-200',
    3: 'text-lg font-bold mt-8 mb-3',
    4: 'text-base font-bold mt-6 mb-2',
  };
  const cls = sizes[depth] || 'text-sm font-bold mt-4 mb-2';
  const html = marked.parseInline(text) as string;
  return `<h${depth} id="${slug}" class="${cls} text-slate-900 scroll-mt-24 group">
    <a href="#${slug}" class="no-underline hover:text-indigo-600">${html}</a>
  </h${depth}>`;
};

renderer.paragraph = ({ tokens }) => {
  const html = marked.Parser.parseInline(tokens);
  return `<p class="text-[15px] leading-7 text-slate-700 mb-4">${html}</p>`;
};

renderer.list = (token) => {
  const tag = token.ordered ? 'ol' : 'ul';
  const cls = token.ordered
    ? 'list-decimal list-outside ml-5 mb-4 space-y-1.5 text-[15px] text-slate-700'
    : 'list-disc list-outside ml-5 mb-4 space-y-1.5 text-[15px] text-slate-700';
  // Block-level parse (not parseInline) so nested lists/paragraphs inside an item
  // — which are sibling block tokens, not inline tokens — render instead of throwing.
  const items = token.items
    .map((item: any) => `<li class="leading-6 pl-1">${marked.Parser.parse(item.tokens, { renderer } as any)}</li>`)
    .join('');
  return `<${tag} class="${cls}">${items}</${tag}>`;
};

renderer.blockquote = ({ tokens }) => {
  const html = marked.Parser.parse(tokens, { renderer } as any);
  return `<blockquote class="border-l-4 border-indigo-300 bg-indigo-50/60 text-slate-700 italic px-4 py-2 rounded-r-lg mb-4">${html}</blockquote>`;
};

renderer.codespan = ({ text }) =>
  `<code class="px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-700 text-[13px] font-mono border border-slate-200">${text}</code>`;

renderer.code = ({ text, lang }) => {
  if (lang === 'mermaid') {
    return `<div class="mermaid-frame relative group my-6">
      <div class="mermaid cursor-zoom-in flex justify-center bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto transition-shadow group-hover:ring-2 group-hover:ring-indigo-300">${text}</div>
      <div class="absolute top-2.5 right-2.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900/85 text-white text-[11px] font-medium px-2 py-1 rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        Click to zoom
      </div>
    </div>`;
  }
  return `<pre class="bg-slate-900 text-slate-100 rounded-xl p-4 mb-4 overflow-x-auto text-[13px] leading-6 font-mono border border-slate-800"><code>${text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')}</code></pre>`;
};

renderer.link = ({ href, title, tokens }) => {
  const html = marked.Parser.parseInline(tokens);
  const external = /^https?:\/\//.test(href || '');
  return `<a href="${href}" ${title ? `title="${title}"` : ''} class="text-indigo-600 font-medium hover:underline underline-offset-2" ${
    external ? 'target="_blank" rel="noopener noreferrer"' : ''
  }>${html}</a>`;
};

renderer.table = (token) => {
  const headerCells = token.header
    .map(
      (cell: any) =>
        `<th class="px-4 py-2.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wide bg-slate-50 border-b border-slate-200">${marked.Parser.parseInline(
          cell.tokens
        )}</th>`
    )
    .join('');
  const rows = token.rows
    .map(
      (row: any) =>
        `<tr class="hover:bg-slate-50/70 transition-colors">${row
          .map(
            (cell: any) =>
              `<td class="px-4 py-2.5 text-[13.5px] text-slate-700 border-b border-slate-100 align-top">${marked.Parser.parseInline(
                cell.tokens
              )}</td>`
          )
          .join('')}</tr>`
    )
    .join('');
  return `<div class="overflow-x-auto mb-6 rounded-xl border border-slate-200 shadow-xs"><table class="w-full border-collapse">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
};

renderer.hr = () => '<hr class="my-8 border-slate-200" />';

renderer.strong = ({ tokens }) =>
  `<strong class="font-bold text-slate-900">${marked.Parser.parseInline(tokens)}</strong>`;

marked.use({ renderer, gfm: true, breaks: false });

const extractHeadings = (markdown: string): Heading[] => {
  const lines = markdown.split('\n');
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{1,3})\s+(.*)$/.exec(line);
    if (match) {
      const text = match[2].replace(/[*`]/g, '').trim();
      headings.push({ depth: match[1].length, text, slug: slugify(text) });
    }
  }
  return headings;
};

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 6;

// Full-screen pan/zoom lightbox for a rendered mermaid SVG — diagrams like the
// architecture graph are unreadable at inline width, so clicking one reopens
// it here where scroll-to-zoom and drag-to-pan reveal the detail.
const MermaidZoomModal: React.FC<{ svgHtml: string; onClose: () => void }> = ({ svgHtml, onClose }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; originX: number; originY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const clampScale = (next: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));

  const zoomBy = (factor: number) => setScale((prev) => clampScale(prev * factor));
  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') zoomBy(1.2);
      if (e.key === '-' || e.key === '_') zoomBy(1 / 1.2);
      if (e.key === '0') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y };
    setIsDragging(true);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({ x: dragState.current.originX + dx, y: dragState.current.originY + dy });
  };
  const stopDrag = () => {
    dragState.current.dragging = false;
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
        <span className="text-xs font-medium text-slate-300">Scroll or drag to explore • Esc to close</span>
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg p-1">
          <button
            onClick={() => zoomBy(1 / 1.3)}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-12 text-center select-none">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => zoomBy(1.3)}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={reset}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Reset (0)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-red-500/80 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pan/zoom surface */}
      <div
        className="flex-1 overflow-hidden select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onDoubleClick={reset}
      >
        <div
          className="w-full h-full flex items-center justify-center [&_svg]:max-w-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      </div>
    </div>
  );
};

// Isolated behind React.memo so it never re-renders when unrelated DocsView state
// changes (e.g. opening the zoom modal). Mermaid mutates this subtree's DOM directly,
// outside React's knowledge — any re-render of this node would reset dangerouslySetInnerHTML
// back to the raw pre-mermaid markup and wipe out every rendered diagram on the page.
const MarkdownBody = React.memo<{ html: string }>(({ html }) => (
  <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-10" dangerouslySetInnerHTML={{ __html: html }} />
));

export const DocsView: React.FC = () => {
  const [activeDocId, setActiveDocId] = useState<DocEntry['id']>('readme');
  const [zoomedSvg, setZoomedSvg] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const activeDoc = DOCS.find((d) => d.id === activeDocId)!;

  const html = useMemo(() => marked.parse(activeDoc.source) as string, [activeDoc]);
  const headings = useMemo(() => extractHeadings(activeDoc.source), [activeDoc]);

  useEffect(() => {
    // 'loose' (not 'strict'): these diagrams come only from our own README/PROJECT_CONCEPT
    // sources, never user input. 'strict' runs the rendered SVG through DOMPurify, which
    // strips the <marker> defs mermaid uses for arrowheads — the edges/links between nodes
    // render invisibly in the browser (though editors like VS Code's mermaid preview don't
    // apply that sanitization, so it looks fine there).
    mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose', fontFamily: 'inherit' });
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.scrollTop = 0;
    const nodes = contentRef.current.querySelectorAll('.mermaid');
    if (nodes.length > 0) {
      mermaid.run({ nodes: nodes as unknown as HTMLElement[] }).catch(() => {
        /* malformed diagram source — leave raw text visible */
      });
    }
  }, [html]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const diagram = (e.target as HTMLElement).closest('.mermaid');
    if (diagram && diagram.querySelector('svg')) {
      setZoomedSvg(diagram.innerHTML);
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Documentation</h1>
            <p className="text-xs text-slate-600">Live-rendered from the project's README.md and PROJECT_CONCEPT.md</p>
          </div>
        </div>
      </div>

      {/* Doc Tabs */}
      <div className="px-8 border-b border-slate-200 bg-white flex-shrink-0 flex items-center gap-1">
        {DOCS.map((doc) => {
          const Icon = doc.icon;
          const isActive = doc.id === activeDocId;
          return (
            <button
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {doc.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Outline */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50/60 overflow-y-auto px-4 py-5 hidden lg:block">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3 px-2">
            <List className="w-3.5 h-3.5" />
            On this page
          </div>
          <nav className="space-y-0.5">
            {headings.map((h, idx) => (
              <a
                key={idx}
                href={`#${h.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  contentRef.current?.querySelector(`#${CSS.escape(h.slug)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`block truncate rounded-md px-2 py-1.5 text-[13px] text-slate-600 hover:text-indigo-700 hover:bg-white transition-colors ${
                  h.depth === 1 ? 'font-semibold text-slate-800' : ''
                }`}
                style={{ paddingLeft: `${8 + (h.depth - 1) * 12}px` }}
              >
                {h.text}
              </a>
            ))}
          </nav>
          <button
            onClick={() => {
              const blob = new Blob([activeDoc.source], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank', 'noopener,noreferrer');
              setTimeout(() => URL.revokeObjectURL(url), 30000);
            }}
            className="mt-6 flex items-center gap-1.5 px-2 text-[12px] font-medium text-slate-500 hover:text-indigo-600 cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            View raw markdown
          </button>
        </aside>

        {/* Markdown content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto" onClick={handleContentClick}>
          <div className="max-w-4xl mx-auto px-10 py-10">
            <MarkdownBody html={html} />
          </div>
        </div>
      </div>

      {zoomedSvg && <MermaidZoomModal svgHtml={zoomedSvg} onClose={() => setZoomedSvg(null)} />}
    </div>
  );
};
