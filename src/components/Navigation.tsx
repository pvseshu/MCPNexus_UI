import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  Server,
  Wrench,
  Compass,
  BookOpen,
  KeyRound,
  Bot,
  GitFork,
  MessageSquare,
  Database,
  Search,
  Users,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { NavSection } from '../types';

interface NavigationProps {
  currentSection: NavSection;
  onNavigate?: (section: NavSection) => void;
  onSelectSection?: (section: NavSection) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  pendingRequestsCount?: number;
  pendingAccessRequestsCount?: number;
  mcpServersCount?: number;
  mcpToolsCount?: number;
  apiDiscoveryCount?: number;
  mcpCatalogCount?: number;
}

const DEFAULT_SIDEBAR_WIDTH = 290;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 520;
const COLLAPSED_SIDEBAR_WIDTH = 76;

export const Navigation: React.FC<NavigationProps> = ({
  currentSection,
  onNavigate,
  onSelectSection,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse: controlledOnToggleCollapse,
  pendingRequestsCount = 0,
  pendingAccessRequestsCount,
  mcpServersCount,
  mcpToolsCount,
  apiDiscoveryCount,
  mcpCatalogCount,
}) => {
  // Local collapsed state fallback if not controlled from parent
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mcp_nexus_nav_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (controlledOnToggleCollapse) {
      controlledOnToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('mcp_nexus_nav_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  // Resizable width state
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mcp_nexus_nav_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const dragStartXRef = useRef<number>(0);
  const dragStartWidthRef = useRef<number>(DEFAULT_SIDEBAR_WIDTH);

  // Handle Splitter Dragging (Mouse & Touch)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCollapsed) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isCollapsed) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartXRef.current = e.touches[0].clientX;
      dragStartWidthRef.current = sidebarWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
  };

  const handleDoubleClickReset = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    try {
      localStorage.setItem('mcp_nexus_nav_width', String(DEFAULT_SIDEBAR_WIDTH));
    } catch {}
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartXRef.current;
      const newWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, dragStartWidthRef.current + deltaX)
      );
      setSidebarWidth(newWidth);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - dragStartXRef.current;
        const newWidth = Math.min(
          MAX_SIDEBAR_WIDTH,
          Math.max(MIN_SIDEBAR_WIDTH, dragStartWidthRef.current + deltaX)
        );
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        localStorage.setItem('mcp_nexus_nav_width', String(sidebarWidth));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, sidebarWidth]);

  const effectivePendingCount =
    pendingAccessRequestsCount !== undefined ? pendingAccessRequestsCount : pendingRequestsCount;

  const handleNavigate = (section: NavSection) => {
    if (onNavigate) {
      onNavigate(section);
    } else if (onSelectSection) {
      onSelectSection(section);
    }
  };

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'MCP Platform',
      items: [
        { id: 'mcp-servers' as NavSection, label: 'MCP Servers', icon: Server, badge: mcpServersCount !== undefined ? `${mcpServersCount}` : undefined },
        { id: 'mcp-tools' as NavSection, label: 'MCP Tools', icon: Wrench, badge: mcpToolsCount !== undefined ? `${mcpToolsCount}` : undefined },
        { id: 'api-discovery' as NavSection, label: 'API Discovery', icon: Compass, badge: apiDiscoveryCount !== undefined ? `${apiDiscoveryCount}` : undefined },
        { id: 'mcp-catalog' as NavSection, label: 'MCP Catalog', icon: Layers, badge: mcpCatalogCount !== undefined ? `${mcpCatalogCount}` : undefined },
        {
          id: 'access-requests' as NavSection,
          label: 'Access Requests',
          icon: KeyRound,
          badge: effectivePendingCount > 0 ? `${effectivePendingCount}` : undefined,
          badgeColor: 'amber',
        },
      ],
    },
    {
      label: 'AI & Orchestration',
      items: [
        { id: 'ai-chat' as NavSection, label: 'AI Chat', icon: Bot, isHighlighted: true },
        { id: 'ai-workflows' as NavSection, label: 'AI Workflows', icon: GitFork },
        { id: 'conversations' as NavSection, label: 'Conversations', icon: MessageSquare },
      ],
    },
    {
      label: 'Knowledge',
      items: [
        { id: 'knowledge-hub' as NavSection, label: 'Knowledge Hub', icon: Database, badge: '1.2k' },
        { id: 'knowledge-search' as NavSection, label: 'Knowledge Search', icon: Search },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'users-access' as NavSection, label: 'Users & Access', icon: Users },
        { id: 'audit' as NavSection, label: 'Audit & Governance', icon: ShieldCheck },
        { id: 'documentation' as NavSection, label: 'Documentation', icon: BookOpen },
        { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
      ],
    },
  ];

  const currentWidth = isCollapsed ? COLLAPSED_SIDEBAR_WIDTH : sidebarWidth;

  return (
    <aside
      ref={asideRef}
      id="left-navigation"
      style={{
        width: `${currentWidth}px`,
        minWidth: `${currentWidth}px`,
        maxWidth: `${currentWidth}px`,
      }}
      className={`h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col z-30 select-none relative ${
        isDragging ? '' : 'transition-[width] duration-150 ease-out'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-3.5 border-b border-slate-200 flex items-center justify-between gap-2 overflow-hidden flex-shrink-0 bg-white">
        <div
          className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1 min-w-0"
          onClick={() => handleNavigate('dashboard')}
          id="nav-brand-logo"
          title="MCP Nexus Enterprise - Connect, Govern, Orchestrate"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-100 flex-shrink-0 text-white">
            <Cpu className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-base text-slate-900 tracking-tight whitespace-nowrap">
                  MCP Nexus
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium truncate">
                Connect. Govern. Orchestrate.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleToggleCollapse}
          id="toggle-nav-collapse-btn"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
          title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3.5 space-y-5 scrollbar-thin overflow-x-hidden">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {group.label}
              </h3>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive
                          ? 'text-indigo-600'
                          : item.isHighlighted
                          ? 'text-indigo-500'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left whitespace-nowrap">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-1 ${
                          item.badgeColor === 'amber'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isCollapsed && item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 flex-shrink-0">
        <div
          className={`flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
          onClick={() => handleNavigate('settings')}
          id="nav-user-profile"
          title="Account Settings"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
            PS
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">pvseshu@aexp.com</p>
              <p className="text-[11px] text-slate-600 truncate">Enterprise Admin • American Express</p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Draggable Splitter (Right Edge) */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={handleDoubleClickReset}
          id="sidebar-resizable-splitter"
          title={`Drag to resize sidebar (${sidebarWidth}px). Double-click to reset.`}
          className={`absolute top-0 right-0 w-3 -mr-1.5 h-full cursor-col-resize z-40 flex items-center justify-center transition-colors group ${
            isDragging ? 'bg-indigo-500/20' : 'hover:bg-indigo-500/10'
          }`}
        >
          {/* Subtle Visual Splitter Line */}
          <div
            className={`w-[3px] h-full transition-colors ${
              isDragging
                ? 'bg-indigo-600'
                : 'bg-transparent group-hover:bg-indigo-400'
            }`}
          />

          {/* Centered Grab Handle Indicator */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -right-[1px] w-3.5 h-8 rounded-full flex items-center justify-center shadow-sm border transition-all pointer-events-none ${
              isDragging
                ? 'bg-indigo-600 border-indigo-700 text-white opacity-100 scale-110'
                : 'bg-white border-slate-300 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-300 opacity-0 group-hover:opacity-100'
            }`}
          >
            <GripVertical className="w-2.5 h-2.5" />
          </div>

          {/* Floating Width Indicator during drag */}
          {isDragging && (
            <div className="absolute top-10 left-4 bg-slate-900 text-white text-xs font-mono font-semibold px-2.5 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-50 flex items-center gap-1.5">
              <span>{sidebarWidth}px</span>
              <span className="text-[10px] text-slate-400 font-sans">(drag to adjust)</span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

