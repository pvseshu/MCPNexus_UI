import React from 'react';
import {
  Search,
  Bell,
  Plus,
  Shield,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Code2,
  Palette,
} from 'lucide-react';
import { NavSection } from '../types';
import { ThemeSwitcherControl } from './ThemeSwitcherControl';
import { isDemoMode } from '../utils/demoMode';

interface HeaderProps {
  currentSection: NavSection;
  onNavigate?: (section: NavSection) => void;
  onRegisterAppClick?: () => void;
  onOpenRegisterWizard?: () => void;
  onOpenAddKnowledge?: () => void;
  onOpenAiChat?: () => void;
  onOpenEmbedModal?: () => void;
  onOpenThemeModal?: () => void;
  activeServersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onNavigate,
  onRegisterAppClick,
  onOpenRegisterWizard,
  onOpenAddKnowledge,
  onOpenAiChat,
  onOpenEmbedModal,
  onOpenThemeModal,
  activeServersCount,
}) => {
  const handleNavigate = (section: NavSection) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  const handleRegisterApp = () => {
    if (onOpenRegisterWizard) {
      onOpenRegisterWizard();
    } else if (onRegisterAppClick) {
      onRegisterAppClick();
    } else if (onNavigate) {
      onNavigate('mcp-servers');
    }
  };

  const handleAddKnowledge = () => {
    if (onOpenAddKnowledge) {
      onOpenAddKnowledge();
    } else if (onNavigate) {
      onNavigate('knowledge-hub');
    }
  };

  const handleOpenAiChat = () => {
    if (onOpenAiChat) {
      onOpenAiChat();
    } else if (onNavigate) {
      onNavigate('ai-chat');
    }
  };
  const getSectionTitle = (section: NavSection): { title: string; subtitle: string; category: string } => {
    switch (section) {
      case 'dashboard':
        return {
          title: 'Enterprise MCP Dashboard',
          subtitle: 'Connect enterprise applications, APIs, AI and knowledge through a governed MCP ecosystem.',
          category: 'Overview',
        };
      case 'mcp-servers':
        return {
          title: 'MCP Servers',
          subtitle: 'Register applications and manage their application-specific Model Context Protocol servers.',
          category: 'MCP Platform',
        };
      case 'mcp-tools':
        return {
          title: 'MCP Tools',
          subtitle: 'Individual AI-ready capabilities exposed by application MCP servers.',
          category: 'MCP Platform',
        };
      case 'api-discovery':
        return {
          title: 'API Discovery & Analysis',
          subtitle: 'Inspect Swagger/OpenAPI specifications and convert endpoints into governed MCP tools.',
          category: 'MCP Platform',
        };
      case 'mcp-catalog':
        return {
          title: 'MCP Catalog',
          subtitle: 'Discover reusable capabilities across enterprise applications.',
          category: 'MCP Platform',
        };
      case 'access-requests':
        return {
          title: 'MCP Access Requests',
          subtitle: 'App-to-App and User entitlement approvals with fine-grained RBAC governance.',
          category: 'MCP Platform',
        };
      case 'ai-chat':
        return {
          title: 'MCP Nexus AI Assistant',
          subtitle: 'Unified enterprise conversational interface orchestrating MCP Tools and Knowledge.',
          category: 'AI & Orchestration',
        };
      case 'ai-workflows':
        return {
          title: 'AI Workflows & Pipelines',
          subtitle: 'Multi-step autonomous agent workflows across connected enterprise MCP servers.',
          category: 'AI & Orchestration',
        };
      case 'knowledge-hub':
        return {
          title: 'Enterprise Knowledge Hub',
          subtitle: 'Search and manage enterprise knowledge from one place.',
          category: 'Knowledge',
        };
      case 'knowledge-search':
        return {
          title: 'Knowledge Search',
          subtitle: 'AI-grounded semantic search across indexed PDFs, docs, wikis, and SOPs.',
          category: 'Knowledge',
        };
      case 'audit':
        return {
          title: 'Audit & Governance',
          subtitle: 'Real-time telemetry, tool invocation logs, and authorization compliance.',
          category: 'Administration',
        };
      case 'users-access':
        return {
          title: 'Users & Entitlements',
          subtitle: 'Manage IAM security groups, developer tokens, and operator clearance.',
          category: 'Administration',
        };
      case 'settings':
      default:
        return {
          title: 'System Settings',
          subtitle: 'MCP transport protocols, environment variables, and enterprise configuration.',
          category: 'Administration',
        };
    }
  };

  const currentMeta = getSectionTitle(currentSection);
  const demoMode = isDemoMode();

  return (
    <header
      id="top-header"
      className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between shadow-2xs"
    >
      {/* Left Breadcrumbs & Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center text-xs text-slate-600 font-medium space-x-1.5">
          <span>{currentMeta.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{currentMeta.title}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Orchestrator Online • {activeServersCount ?? 0} Servers Active</span>
        </div>

        {demoMode && (
          <div
            id="demo-mode-badge"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold"
            title="Showing static demo data — changes are not persisted"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Demo Mode</span>
          </div>
        )}
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Global Quick Action Buttons */}
        {onOpenEmbedModal && (
          <button
            id="header-embed-app-btn"
            onClick={onOpenEmbedModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
            title="Integrate MCP Chat in your own application"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Embed in App</span>
          </button>
        )}

        <button
          id="header-open-chat-btn"
          onClick={handleOpenAiChat}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Launch AI Chat</span>
        </button>

        <button
          id="header-add-knowledge-btn"
          onClick={handleAddKnowledge}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold border border-teal-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-teal-600" />
          <span>Add Knowledge</span>
        </button>

        <button
          id="header-register-app-btn"
          onClick={handleRegisterApp}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-200 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Application</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Theme Switcher */}
        <ThemeSwitcherControl onOpenFullModal={onOpenThemeModal} />

        {/* Notification Bell */}
        <button
          id="header-notifications-btn"
          onClick={() => handleNavigate('access-requests')}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative transition-colors cursor-pointer"
          title="Pending Access Requests"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};
