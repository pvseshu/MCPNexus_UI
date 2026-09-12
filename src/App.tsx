import React, { useState, useRef, Suspense, lazy } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import {
  INITIAL_APPLICATIONS,
  INITIAL_MCP_SERVERS,
  INITIAL_MCP_TOOLS,
  INITIAL_ACCESS_REQUESTS,
  INITIAL_KNOWLEDGE_SOURCES,
  INITIAL_AUDIT_EVENTS,
  INITIAL_AI_WORKFLOWS,
  INITIAL_CONVERSATIONS,
  INITIAL_USERS_ACCESS,
} from './data/initialData';
import {
  NavSection,
  Application,
  McpServer,
  McpTool,
  AccessRequest,
  KnowledgeSource,
  AuditEvent,
  AiWorkflow,
  ConversationSession,
  UserAccessRecord,
  SampleExample,
} from './types';

// Components
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ApplicationDetailModal } from './components/ApplicationDetailModal';
import { RegisterAppWizard } from './components/RegisterAppWizard';
import { McpServersView } from './components/McpServersView';
import { McpToolsView } from './components/McpToolsView';
import { McpToolConfigModal } from './components/McpToolConfigModal';
import { ToolTesterModal } from './components/ToolTesterModal';
import { McpCatalogView } from './components/McpCatalogView';
import { McpOrchestratorView } from './components/McpOrchestratorView';
import { AccessRequestsView } from './components/AccessRequestsView';
import { AiChatView } from './components/AiChatView';
import { KnowledgeHubView } from './components/KnowledgeHubView';
import { AiWorkflowsView } from './components/AiWorkflowsView';
import { AuditView } from './components/AuditView';
import { SettingsView } from './components/SettingsView';
import { ApiDiscoveryView } from './components/ApiDiscoveryView';
import { ConversationsView } from './components/ConversationsView';
import { KnowledgeSearchView } from './components/KnowledgeSearchView';
import { UsersAccessView } from './components/UsersAccessView';
import { EmbedWidgetModal } from './components/EmbedWidgetModal';
import { AppEmbedPreviewModal } from './components/AppEmbedPreviewModal';
import { ThemeSwitcherModal } from './components/ThemeSwitcherModal';
// Lazy-loaded: pulls in `marked` + `mermaid` (large), only needed on the Documentation page.
const DocsView = lazy(() => import('./components/DocsView').then((m) => ({ default: m.DocsView })));

export default function App() {
  // Navigation State
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');

  // Core Data Collections
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [mcpServers, setMcpServers] = useState<McpServer[]>(INITIAL_MCP_SERVERS);
  const [mcpTools, setMcpTools] = useState<McpTool[]>(INITIAL_MCP_TOOLS);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(INITIAL_ACCESS_REQUESTS);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(INITIAL_KNOWLEDGE_SOURCES);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(INITIAL_AUDIT_EVENTS);
  const [aiWorkflows, setAiWorkflows] = useState<AiWorkflow[]>(INITIAL_AI_WORKFLOWS);
  const [conversations, setConversations] = useState<ConversationSession[]>(INITIAL_CONVERSATIONS);
  const [usersAccess, setUsersAccess] = useState<UserAccessRecord[]>(INITIAL_USERS_ACCESS);

  // Modal & Detail States
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<Application | null>(null);
  const [showRegisterWizard, setShowRegisterWizard] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [configuringTool, setConfiguringTool] = useState<McpTool | null>(null);
  const [testingTool, setTestingTool] = useState<McpTool | null>(null);
  const [toolsServerFilter, setToolsServerFilter] = useState<string | undefined>(undefined);
  const [showDirectKnowledgeModal, setShowDirectKnowledgeModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [livePreviewApp, setLivePreviewApp] = useState<Application | null>(null);
  const [livePreviewColor, setLivePreviewColor] = useState('#4f46e5');
  const [livePreviewTitle, setLivePreviewTitle] = useState('Customer Servicing AI Assistant');

  // Window-level success toast (e.g. access request confirmations) — anchored near the
  // sidebar's Enterprise Admin footer, independent of whichever view is currently open.
  const [globalToast, setGlobalToast] = useState<{ title: string; message: string } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showGlobalToast = (title: string, message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setGlobalToast({ title, message });
    toastTimeoutRef.current = setTimeout(() => setGlobalToast(null), 10000);
  };

  // Helper to add audit event
  const logAuditEvent = (action: string, targetResource: string, details: string, status: 'SUCCESS' | 'DENIED' = 'SUCCESS') => {
    const newEvent: AuditEvent = {
      id: `EVT-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      actor: 'Current Administrator',
      action,
      targetResource,
      status,
      durationMs: Math.floor(Math.random() * 80) + 40,
      details,
    };
    setAuditEvents((prev) => [newEvent, ...prev]);
  };

  const handleUpdateApplication = (updated: Application) => {
    setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
    setSelectedAppForDetail(updated);
    logAuditEvent(
      'CONFIG_UPDATE',
      updated.name,
      `Updated Swagger/OpenAPI spec URL(s) and authentication configuration.`
    );
  };

  // Immediate app-level kill switch: stopping an app also stops its generated MCP
  // server, so every tool call against it is rejected until it's reactivated here.
  const handleToggleAppActive = (app: Application) => {
    const nextStatus: Application['status'] = app.status === 'Active' ? 'Disabled' : 'Active';
    setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: nextStatus } : a)));
    setMcpServers((prev) =>
      prev.map((s) =>
        s.id === app.mcpServerId
          ? {
              ...s,
              status: nextStatus === 'Active' ? 'Active' : 'Disabled',
              // healthStatus reflects live reachability, not the admin on/off switch —
              // but a stopped server can't be "Healthy", so force it Offline while
              // disabled and restore Healthy on reactivation.
              healthStatus: nextStatus === 'Active' ? 'Healthy' : 'Offline',
            }
          : s
      )
    );
    setSelectedAppForDetail((prev) => (prev && prev.id === app.id ? { ...prev, status: nextStatus } : prev));
    logAuditEvent(
      'APP_STATUS_CHANGE',
      app.name,
      nextStatus === 'Active'
        ? `Reactivated ${app.name} — its MCP server is serving requests again.`
        : `Stopped ${app.name} — its MCP server and all tools now reject calls until reactivated.`
    );
    showGlobalToast(
      nextStatus === 'Active' ? 'Application Reactivated' : 'Application Stopped',
      nextStatus === 'Active'
        ? `${app.name} and its MCP server are active again.`
        : `${app.name} and "${app.mcpServerName}" are now stopped — no tool calls will be served until you reactivate it.`
    );
  };

  const handleToggleCatalogVisibility = (serverId: string) => {
    setMcpServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, isPublishedToCatalog: !s.isPublishedToCatalog } : s))
    );
    const server = mcpServers.find((s) => s.id === serverId);
    if (server) {
      logAuditEvent(
        'CONFIG_UPDATED',
        server.name,
        server.isPublishedToCatalog
          ? `Removed ${server.name} from the MCP Catalog (made private).`
          : `Published ${server.name} to the MCP Catalog for discovery and access requests.`
      );
    }
  };

  // Handlers for Registration Wizard completion
  const handleCompleteRegisterApp = (newApp: Application, generatedServer: McpServer, generatedTools: McpTool[]) => {
    setApplications((prev) => [newApp, ...prev]);
    setMcpServers((prev) => [generatedServer, ...prev]);
    setMcpTools((prev) => [...generatedTools, ...prev]);
    setShowRegisterWizard(false);

    logAuditEvent(
      'REGISTER_APPLICATION',
      newApp.name,
      `Generated MCP server "${generatedServer.name}" with ${generatedTools.length} AI-ready tools.`
    );
  };

  // Handlers for Tool Configuration updates
  const handleSaveToolConfig = (updatedTool: McpTool) => {
    setMcpTools((prev) => prev.map((t) => (t.id === updatedTool.id ? updatedTool : t)));
    setConfiguringTool(null);

    logAuditEvent(
      'UPDATE_MCP_TOOL_CONFIG',
      updatedTool.name,
      `Updated AI descriptions and sample I/O schemas for ${updatedTool.name}.`
    );
  };

  // Handlers for Tool Tester saving samples
  const handleSaveSampleInputFromTester = (toolId: string, sample: SampleExample) => {
    setMcpTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, sampleInputs: [...t.sampleInputs, sample] } : t))
    );
    logAuditEvent('ADD_SAMPLE_INPUT', toolId, `Saved input sample "${sample.name}" from live tester.`);
  };

  const handleSaveSampleOutputFromTester = (toolId: string, sample: SampleExample) => {
    setMcpTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, sampleOutputs: [...t.sampleOutputs, sample] } : t))
    );
    logAuditEvent('ADD_SAMPLE_OUTPUT', toolId, `Saved output sample "${sample.name}" from live tester.`);
  };

  // Handlers for Access Requests
  const handleApproveRequest = (id: string) => {
    setAccessRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Approved', approvedBy: 'Administrator' } : r))
    );
    logAuditEvent('APPROVE_ACCESS_REQUEST', id, `Approved entitlement access for request ${id}.`);
  };

  const handleRejectRequest = (id: string) => {
    setAccessRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Rejected', approvedBy: 'Administrator' } : r))
    );
    logAuditEvent('REJECT_ACCESS_REQUEST', id, `Rejected entitlement access for request ${id}.`, 'DENIED');
  };

  // Handlers for Knowledge Source creation
  const handleAddKnowledgeSource = (newSource: KnowledgeSource) => {
    setKnowledgeSources((prev) => [newSource, ...prev]);
    setShowDirectKnowledgeModal(false);
    logAuditEvent(
      'INDEX_KNOWLEDGE_SOURCE',
      newSource.title,
      `Indexed ${newSource.indexedItemsCount} document chunks for AI grounding.`
    );
  };

  // Handlers for Workflow Trigger
  const handleTriggerWorkflow = (workflowId: string) => {
    setAiWorkflows((prev) =>
      prev.map((w) => (w.id === workflowId ? { ...w, invocationsCount: w.invocationsCount + 1 } : w))
    );
    logAuditEvent('TRIGGER_AI_WORKFLOW', workflowId, `Executed multi-step automated AI workflow.`);
  };

  // Handler for navigation with filter
  const handleNavigateToToolsWithFilter = (serverId?: string) => {
    setToolsServerFilter(serverId);
    setCurrentSection('mcp-tools');
  };

  // Create a pending access request from the MCP Catalog — stays on the Catalog page,
  // does NOT grant access or navigate away. Only an administrator can approve it later
  // from Access Requests, so the requester never has the power to self-approve.
  const handleRequestAccessFromCatalog = (server: McpServer, requestingAppName: string, reason: string) => {
    const newReq: AccessRequest = {
      id: `AR-${Math.floor(Math.random() * 90000) + 10000}`,
      requestingApp: requestingAppName,
      requestingUser: 'current.user@aexp.com',
      targetMcpServer: server.name,
      targetToolName: 'All Tools',
      requestedPermission: `GROUP_${server.name.split(' ')[0].toUpperCase()}_ACCESS`,
      reason,
      status: 'Pending',
      timestamp: 'Just now',
    };
    setAccessRequests((prev) => [newReq, ...prev]);
    logAuditEvent('CREATE_ACCESS_REQUEST', newReq.id, `${requestingAppName} requested access to ${server.name} via MCP Catalog.`);
    showGlobalToast(
      'Access Requested',
      `${requestingAppName} requested access to "${server.name}". An administrator will review and approve it from Access Requests.`
    );
  };

  const pendingRequestsCount = accessRequests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased" id="mcp-nexus-app">
      {/* Sidebar Navigation */}
      <Navigation
        currentSection={currentSection}
        onNavigate={(sec) => {
          setToolsServerFilter(undefined);
          setCurrentSection(sec);
        }}
        onSelectSection={(sec) => {
          setToolsServerFilter(undefined);
          setCurrentSection(sec);
        }}
        pendingAccessRequestsCount={pendingRequestsCount}
        pendingRequestsCount={pendingRequestsCount}
        mcpServersCount={mcpServers.length}
        mcpToolsCount={mcpTools.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          onNavigate={(sec) => {
            setToolsServerFilter(undefined);
            setCurrentSection(sec);
          }}
          onRegisterAppClick={() => setShowRegisterWizard(true)}
          onOpenRegisterWizard={() => setShowRegisterWizard(true)}
          onOpenAddKnowledge={() => {
            setShowDirectKnowledgeModal(true);
            setCurrentSection('knowledge-hub');
          }}
          onOpenAiChat={() => setCurrentSection('ai-chat')}
          onOpenEmbedModal={() => setShowEmbedModal(true)}
          onOpenThemeModal={() => setShowThemeModal(true)}
          activeServersCount={mcpServers.length}
        />

        {/* Dynamic View Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          {currentSection === 'dashboard' && (
            <Dashboard
              applications={applications}
              mcpServers={mcpServers}
              mcpTools={mcpTools}
              accessRequests={accessRequests}
              recentAuditEvents={auditEvents}
              pendingRequestsCount={pendingRequestsCount}
              onNavigate={(sec) => setCurrentSection(sec)}
              onOpenRegisterWizard={() => setShowRegisterWizard(true)}
              onRegisterAppClick={() => setShowRegisterWizard(true)}
              onOpenAddKnowledge={() => {
                setShowDirectKnowledgeModal(true);
                setCurrentSection('knowledge-hub');
              }}
              onOpenAiChat={() => setCurrentSection('ai-chat')}
              onOpenTransformation={() => {
                // Open Customer Portal detail directly to show transform
                const custApp = applications.find((a) => a.id === 'app-cust-tx') || applications[0];
                setSelectedAppForDetail(custApp);
              }}
            />
          )}

          {currentSection === 'api-discovery' && (
            <ApiDiscoveryView
              applications={applications}
              onTransformApp={(app) => setSelectedAppForDetail(app)}
              onRegisterNew={() => setShowRegisterWizard(true)}
            />
          )}

          {currentSection === 'mcp-servers' && (
            <McpServersView
              servers={mcpServers}
              applications={applications}
              onNavigateToTools={(serverId) => handleNavigateToToolsWithFilter(serverId)}
              onToggleCatalogVisibility={handleToggleCatalogVisibility}
              onOpenDetails={(server) => {
                const app = applications.find((a) => a.mcpServerId === server.id);
                if (app) setSelectedAppForDetail(app);
              }}
              onOpenRegisterWizard={() => setShowRegisterWizard(true)}
            />
          )}

          {currentSection === 'mcp-tools' && (
            <McpToolsView
              tools={mcpTools}
              initialServerFilter={toolsServerFilter}
              onConfigureTool={(tool) => setConfiguringTool(tool)}
              onLaunchTester={(tool) => setTestingTool(tool)}
            />
          )}

          {currentSection === 'mcp-catalog' && (
            <McpCatalogView
              servers={mcpServers}
              applications={applications}
              pendingRequestServerNames={accessRequests.filter((r) => r.status === 'Pending').map((r) => r.targetMcpServer)}
              onViewTools={(serverId) => handleNavigateToToolsWithFilter(serverId)}
              onRequestAccess={handleRequestAccessFromCatalog}
            />
          )}

          {currentSection === 'mcp-orchestrator' && (
            <McpOrchestratorView
              onOpenAiChat={() => setCurrentSection('ai-chat')}
              onOpenEmbedModal={() => setShowEmbedModal(true)}
              mcpServersCount={mcpServers.length}
              mcpToolsCount={mcpTools.length}
            />
          )}

          {currentSection === 'access-requests' && (
            <AccessRequestsView
              requests={accessRequests}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
            />
          )}

          {currentSection === 'users-access' && (
            <UsersAccessView users={usersAccess} />
          )}

          {currentSection === 'ai-chat' && (
            <AiChatView
              onOpenAccessRequests={() => setCurrentSection('access-requests')}
              onOpenEmbedModal={() => setShowEmbedModal(true)}
              applications={applications}
            />
          )}

          {currentSection === 'conversations' && (
            <ConversationsView
              conversations={conversations}
              onOpenAiChat={() => setCurrentSection('ai-chat')}
              onResumeSession={(s) => setCurrentSection('ai-chat')}
            />
          )}

          {currentSection === 'knowledge-hub' && (
            <KnowledgeHubView
              sources={knowledgeSources}
              onAddSource={handleAddKnowledgeSource}
              showAddModalDirectly={showDirectKnowledgeModal}
              onCloseAddModalDirectly={() => setShowDirectKnowledgeModal(false)}
            />
          )}

          {currentSection === 'knowledge-search' && (
            <KnowledgeSearchView
              sources={knowledgeSources}
              onOpenAiChat={() => setCurrentSection('ai-chat')}
            />
          )}

          {currentSection === 'ai-workflows' && (
            <AiWorkflowsView
              workflows={aiWorkflows}
              onTriggerWorkflow={handleTriggerWorkflow}
              onOpenAiChat={() => setCurrentSection('ai-chat')}
            />
          )}

          {currentSection === 'audit' && <AuditView events={auditEvents} />}

          {currentSection === 'settings' && <SettingsView />}

          {currentSection === 'documentation' && (
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center text-sm text-slate-500">Loading documentation…</div>
              }
            >
              <DocsView />
            </Suspense>
          )}
        </main>
      </div>

      {/* Application Detail & Transformation Modal */}
      {selectedAppForDetail && (
        <ApplicationDetailModal
          application={selectedAppForDetail}
          onClose={() => setSelectedAppForDetail(null)}
          onViewMcpServer={(serverId) => handleNavigateToToolsWithFilter(serverId)}
          onConfigureTool={(toolName) => {
            setSelectedAppForDetail(null);
            const tool = mcpTools.find((t) => t.name === toolName);
            if (tool) setConfiguringTool(tool);
          }}
          onUpdateApplication={handleUpdateApplication}
          onToggleActive={handleToggleAppActive}
        />
      )}

      {/* Register New Application Wizard */}
      {showRegisterWizard && (
        <RegisterAppWizard
          onClose={() => setShowRegisterWizard(false)}
          onComplete={handleCompleteRegisterApp}
        />
      )}

      {/* MCP Tool Configuration Modal (Descriptions, I/O Schemas, Sample I/O) */}
      {configuringTool && (
        <McpToolConfigModal
          tool={configuringTool}
          onClose={() => setConfiguringTool(null)}
          onSaveTool={handleSaveToolConfig}
          onLaunchTester={(tool) => {
            setConfiguringTool(null);
            setTestingTool(tool);
          }}
        />
      )}

      {/* Interactive Tool Execution Sandbox */}
      {testingTool && (
        <ToolTesterModal
          tool={testingTool}
          onClose={() => setTestingTool(null)}
          onSaveAsSampleInput={handleSaveSampleInputFromTester}
          onSaveAsSampleOutput={handleSaveSampleOutputFromTester}
        />
      )}

      {/* Embed Code Configurator Modal */}
      {showEmbedModal && (
        <EmbedWidgetModal
          applications={applications}
          mcpServers={mcpServers}
          onClose={() => setShowEmbedModal(false)}
          onLaunchLivePreview={(app, color, title) => {
            setLivePreviewApp(app);
            setLivePreviewColor(color);
            setLivePreviewTitle(title);
          }}
        />
      )}

      {/* Full White Background Host Application Preview Modal */}
      {livePreviewApp && (
        <AppEmbedPreviewModal
          application={livePreviewApp}
          primaryColor={livePreviewColor}
          widgetTitle={livePreviewTitle}
          onClose={() => setLivePreviewApp(null)}
        />
      )}

      {/* Global Theme Switcher Modal */}
      {showThemeModal && (
        <ThemeSwitcherModal onClose={() => setShowThemeModal(false)} />
      )}

      {/* Window-level success toast — anchored bottom-left near the sidebar's Enterprise Admin footer */}
      {globalToast && (
        <div className="fixed bottom-24 left-5 z-50 w-[480px] max-w-[calc(100vw-2.5rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 flex items-start gap-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-4 ring-emerald-50 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-base font-bold text-slate-900">{globalToast.title}</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">{globalToast.message}</p>
          </div>
          <button
            onClick={() => {
              if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
              setGlobalToast(null);
            }}
            className="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
