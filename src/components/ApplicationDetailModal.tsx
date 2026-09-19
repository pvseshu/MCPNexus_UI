import React, { useState, useEffect } from 'react';
import {
  X,
  AppWindow,
  Server,
  Wrench,
  Sparkles,
  ArrowRight,
  Code2,
  BookOpen,
  CheckCircle2,
  Lock,
  Layers,
  FileText,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  Pencil,
  Save,
  XCircle,
  Power,
  AlertTriangle,
} from 'lucide-react';
import { EnterpriseApplication, ApiAuthConfig, ApplicationAiSummaryConfig, ApplicationAiContext } from '../types';
import { ApiAuthConfigEditor, SwaggerUrlListEditor } from './ApiAuthConfigEditor';
import { PersonTypeahead } from './PersonTypeahead';

interface ApplicationDetailModalProps {
  application: EnterpriseApplication | null;
  onClose: () => void;
  onViewMcpServer: (serverId: string) => void;
  onConfigureTool: (toolName: string) => void;
  // Resolves to false when saving failed, so the editor stays open with the user's edits.
  onUpdateApplication?: (updated: EnterpriseApplication) => void | boolean | Promise<void | boolean>;
  onToggleActive?: (application: EnterpriseApplication) => void | Promise<void>;
}

// The AI Summary is project-level, so restricting it to specific tools is hidden for now.
// Flip to true to bring back the tool picker (and the "Referenced APIs / Tools" list);
// existing `includedApiIds` values are kept either way.
const SHOW_SUMMARY_TOOL_PICKER = false;

const STATUS_BADGE_STYLE: Record<EnterpriseApplication['status'], string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Maintenance: 'bg-blue-50 text-blue-700 border-blue-200',
  Disabled: 'bg-slate-200 text-slate-600 border-slate-300',
};

const AUTH_TYPE_LABEL: Record<ApiAuthConfig['type'], string> = {
  authblue: 'AuthBlue',
  idaas: 'IDaaS (One Identity)',
  oauth: 'Generic OAuth / Bearer',
};

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  onViewMcpServer,
  onConfigureTool,
  onUpdateApplication,
  onToggleActive,
}) => {
  const [activeTab, setActiveTab] = useState<'transformation' | 'ai-context' | 'ai-summary' | 'specs'>('transformation');
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [draftUrls, setDraftUrls] = useState<string[]>(application?.swaggerUrls || ['']);
  const [draftAuthConfig, setDraftAuthConfig] = useState<ApiAuthConfig | null>(application?.authConfig || null);
  const [confirmingStop, setConfirmingStop] = useState(false);

  const emptyAiSummaryConfig: ApplicationAiSummaryConfig = {
    enabled: false,
    title: 'AI Summary',
    instructions: '',
    includedApiIds: [],
    sampleOutput: '',
  };
  // AI context is edited as plain text (one item per line) and parsed back on save.
  const aiContextToDraft = (ctx: ApplicationAiContext) => ({
    businessPurpose: ctx.businessPurpose,
    businessDomain: ctx.businessDomain,
    keyUseCases: ctx.keyUseCases.join('\n'),
    commonWorkflows: ctx.commonWorkflows.join('\n'),
    importantTerminology: ctx.importantTerminology.map((t) => `${t.term}: ${t.definition}`).join('\n'),
    intendedConsumers: ctx.intendedConsumers.join('\n'),
    usageGuidelines: ctx.usageGuidelines,
    restrictions: ctx.restrictions,
    aiGuidance: ctx.aiGuidance,
  });
  // Application details (name, description, owner, support DL, department). App code and CAR ID stay read-only.
  const detailsToDraft = (app: EnterpriseApplication) => ({
    name: app.name,
    description: app.description,
    owner: app.owner,
    ownerEmail: app.ownerEmail,
    supportDL: app.supportDL,
    department: app.department,
  });
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [draftDetails, setDraftDetails] = useState(() => (application ? detailsToDraft(application) : null));
  const [isEditingAiContext, setIsEditingAiContext] = useState(false);
  const [draftAiContext, setDraftAiContext] = useState(() =>
    application ? aiContextToDraft(application.aiContext) : null
  );
  const [isEditingAiSummary, setIsEditingAiSummary] = useState(false);
  const [draftAiSummary, setDraftAiSummary] = useState<ApplicationAiSummaryConfig>(
    application?.aiSummaryConfig || emptyAiSummaryConfig
  );

  useEffect(() => {
    if (application) {
      setDraftUrls(application.swaggerUrls);
      setDraftAuthConfig(application.authConfig);
      setIsEditingSpecs(false);
      setConfirmingStop(false);
      setDraftAiSummary(application.aiSummaryConfig || emptyAiSummaryConfig);
      setIsEditingAiSummary(false);
      setDraftAiContext(aiContextToDraft(application.aiContext));
      setIsEditingAiContext(false);
      setDraftDetails(detailsToDraft(application));
      setIsEditingDetails(false);
    }
  }, [application]);

  if (!application) return null;

  const handleSaveSpecs = async () => {
    if (!draftAuthConfig) return;
    const saved = await onUpdateApplication?.({
      ...application,
      swaggerUrls: draftUrls.filter(Boolean),
      authConfig: draftAuthConfig,
    });
    if (saved !== false) setIsEditingSpecs(false);
  };

  const handleCancelEditSpecs = () => {
    setDraftUrls(application.swaggerUrls);
    setDraftAuthConfig(application.authConfig);
    setIsEditingSpecs(false);
  };

  const splitLines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

  const detailsError = draftDetails
    ? !draftDetails.name.trim()
      ? 'Application name is required.'
      : !draftDetails.owner.trim()
      ? 'Application owner is required.'
      : draftDetails.supportDL.trim() && !/^\S+@\S+\.\S+$/.test(draftDetails.supportDL.trim())
      ? 'Support DL must be a valid email address.'
      : ''
    : '';

  const handleSaveDetails = async () => {
    if (!draftDetails || detailsError) return;
    const saved = await onUpdateApplication?.({
      ...application,
      name: draftDetails.name.trim(),
      description: draftDetails.description.trim(),
      owner: draftDetails.owner.trim(),
      ownerEmail: draftDetails.ownerEmail.trim(),
      supportDL: draftDetails.supportDL.trim(),
      department: draftDetails.department.trim(),
    });
    if (saved !== false) setIsEditingDetails(false);
  };

  const handleCancelEditDetails = () => {
    setDraftDetails(detailsToDraft(application));
    setIsEditingDetails(false);
  };

  const handleSaveAiContext = async () => {
    if (!draftAiContext) return;
    const saved = await onUpdateApplication?.({
      ...application,
      aiContext: {
        businessPurpose: draftAiContext.businessPurpose,
        businessDomain: draftAiContext.businessDomain,
        keyUseCases: splitLines(draftAiContext.keyUseCases),
        commonWorkflows: splitLines(draftAiContext.commonWorkflows),
        importantTerminology: splitLines(draftAiContext.importantTerminology).map((l) => {
          const [term, ...def] = l.split(':');
          return { term: term.trim(), definition: def.join(':').trim() };
        }),
        intendedConsumers: splitLines(draftAiContext.intendedConsumers),
        usageGuidelines: draftAiContext.usageGuidelines,
        restrictions: draftAiContext.restrictions,
        aiGuidance: draftAiContext.aiGuidance,
      },
    });
    if (saved !== false) setIsEditingAiContext(false);
  };

  const handleCancelEditAiContext = () => {
    setDraftAiContext(aiContextToDraft(application.aiContext));
    setIsEditingAiContext(false);
  };

  const handleSaveAiSummary = async () => {
    const saved = await onUpdateApplication?.({
      ...application,
      aiSummaryConfig: { ...draftAiSummary, enabled: true },
    });
    if (saved !== false) setIsEditingAiSummary(false);
  };

  const handleCancelEditAiSummary = () => {
    setDraftAiSummary(application.aiSummaryConfig || emptyAiSummaryConfig);
    setIsEditingAiSummary(false);
  };

  const toggleIncludedApi = (apiId: string) => {
    setDraftAiSummary((prev) => ({
      ...prev,
      includedApiIds: prev.includedApiIds.includes(apiId)
        ? prev.includedApiIds.filter((id) => id !== apiId)
        : [...prev.includedApiIds, apiId],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      id="application-detail-modal"
    >
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-100 flex-shrink-0">
              <AppWindow className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">{application.name}</h2>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-semibold">
                  {application.appCode}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 font-mono text-xs font-semibold"
                  title="Organization CAR ID"
                >
                  CAR ID: {application.carId}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE_STYLE[application.status]}`}>
                  {application.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 text-justify" title={application.description}>
                {application.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onToggleActive && (
              confirmingStop ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-red-800">Stop this app now?</span>
                  <button
                    onClick={() => {
                      onToggleActive(application);
                      setConfirmingStop(false);
                    }}
                    className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Yes, Stop
                  </button>
                  <button
                    onClick={() => setConfirmingStop(false)}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : application.status === 'Active' ? (
                <button
                  onClick={() => setConfirmingStop(true)}
                  title="Immediately stop this application and its MCP server — all tool calls will be rejected until reactivated"
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-50 text-red-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Stop Application</span>
                </button>
              ) : (
                <button
                  onClick={() => onToggleActive(application)}
                  title="Reactivate this application and its MCP server"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Activate Application</span>
                </button>
              )
            )}

            <button
              onClick={() => {
                onClose();
                onViewMcpServer(application.mcpServerId);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>View Generated MCP Server</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-6 bg-white overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('transformation')}
            className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'transformation'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>API ➔ MCP Tool Transformation ({application.apis.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-context')}
            className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ai-context'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Application AI Context & Skill Definition</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-summary')}
            className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ai-summary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span>AI Summary Instructions{application.aiSummaryConfig?.enabled ? '' : ' (Not Configured)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>OpenAPI Spec & Metadata</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'transformation' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">
                    Direct Visual Mapping: Existing Enterprise APIs ➔ Governed MCP Tools
                  </h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Each REST endpoint is mapped to a type-safe MCP Tool with parameter schemas, usage guidance, and authorization rules.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-white text-indigo-700 border border-indigo-200">
                  {application.apis.filter((a) => a.enabledForMcp).length} of {application.mcpToolsCount} MCP Tools Active
                </span>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 w-1/2 bg-blue-50/40 text-blue-900">Existing Enterprise API</th>
                      <th className="py-3 px-4 w-1/2 bg-purple-50/40 text-purple-900">Generated MCP Tool (AI-Ready)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {application.apis.map((api) => (
                      <tr key={api.id} className={`hover:bg-slate-50/60 transition-colors ${!api.enabledForMcp ? 'opacity-60' : ''}`}>
                        {/* Existing API Side */}
                        <td className="py-3.5 px-4 border-r border-slate-200 bg-white">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                api.method === 'GET'
                                  ? 'bg-blue-100 text-blue-800'
                                  : api.method === 'POST'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {api.method}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">{api.endpoint}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{api.summary}</p>
                        </td>

                        {/* Generated MCP Tool Side */}
                        <td className="py-3.5 px-4 bg-purple-50/15">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-3.5 h-3.5 text-purple-600" />
                              <span className="font-mono font-bold text-xs text-purple-900">
                                {api.suggestedToolName}
                              </span>
                            </div>
                            {api.enabledForMcp ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                AI Context Configured
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold">
                                Not Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 text-justify">{api.description}</p>
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                            <span>Inputs: {api.parameters.length} params</span>
                            <span>•</span>
                            <button
                              onClick={() => {
                                onClose();
                                onConfigureTool(api.suggestedToolName);
                              }}
                              className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              {api.enabledForMcp ? 'Configure AI Tool Context' : 'Review & Enable Tool'} <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ai-context' && (
            <div className="space-y-6" id="ai-context-panel">
              {/* Architecture Context Banner */}
              <div className="bg-indigo-900 text-white rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Application AI Context ➔ Skill Layer</span>
                  </div>
                  <h4 className="text-sm font-bold">
                    This context is injected into AI Agent reasoning for tool selection & safety.
                  </h4>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="px-3 py-1 rounded bg-indigo-800/80 border border-indigo-700 text-xs font-mono text-indigo-200">
                    Skill Context Level: 1
                  </div>
                  {!isEditingAiContext && onUpdateApplication && (
                    <button
                      onClick={() => setIsEditingAiContext(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-800/80 border border-indigo-700 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>

              {isEditingAiContext && draftAiContext ? (
                <div className="space-y-4">
                  {([
                    ['businessPurpose', 'Business Purpose', 2, false],
                    ['businessDomain', 'Business Domain', 1, false],
                    ['keyUseCases', 'Key Use Cases (one per line)', 4, false],
                    ['commonWorkflows', 'Common Workflows (one per line)', 4, false],
                    ['importantTerminology', 'Important Terminology (one per line, Term: definition)', 4, false],
                    ['intendedConsumers', 'Intended Consumers (one per line)', 3, false],
                    ['usageGuidelines', 'Usage Guidelines', 3, false],
                    ['restrictions', 'Security Restrictions', 3, false],
                    ['aiGuidance', 'AI Usage Guidance & Guardrails', 6, true],
                  ] as const).map(([field, label, rows, mono]) => (
                    <div key={field} className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">{label}</label>
                      <textarea
                        value={draftAiContext[field]}
                        onChange={(e) => setDraftAiContext((prev) => (prev ? { ...prev, [field]: e.target.value } : prev))}
                        rows={rows}
                        className={`w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 ${
                          mono ? 'font-mono' : ''
                        }`}
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={handleCancelEditAiContext}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveAiContext}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save AI Context</span>
                    </button>
                  </div>
                </div>
              ) : (
              <>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Project / Application Description
                  </span>
                  <span className="text-[11px] text-indigo-600 font-semibold">Powers AI Skill Understanding</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed text-justify">{application.description || '—'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Business Purpose & Domain */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Business Purpose</span>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">{application.aiContext.businessPurpose}</p>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Business Domain</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{application.aiContext.businessDomain}</p>
                  </div>
                </div>

                {/* Key Use Cases */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Key Use Cases</span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {application.aiContext.keyUseCases.map((uc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                        <span>{uc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Common Workflows */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Common Workflows</span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {application.aiContext.commonWorkflows.map((cw, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 flex-shrink-0" />
                        <span>{cw}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Important Terminology */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Important Terminology</span>
                  <div className="space-y-1.5">
                    {application.aiContext.importantTerminology.map((term, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-bold text-slate-900">{term.term}: </span>
                        <span className="text-slate-600">{term.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Guidance & Guardrails */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">AI Guidance & Restrictions</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-emerald-800 block mb-1">AI Usage Guidance & Guardrails:</span>
                    <p className="text-slate-700 leading-relaxed text-justify">{application.aiContext.aiGuidance}</p>
                  </div>
                  <div>
                    <span className="font-bold text-amber-800 block mb-1">Security Restrictions:</span>
                    <p className="text-slate-700 leading-relaxed text-justify">{application.aiContext.restrictions}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Usage Guidelines:</span>
                    <p className="text-slate-700 leading-relaxed text-justify">{application.aiContext.usageGuidelines || '—'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Intended Consumers:</span>
                    <p className="text-slate-700 leading-relaxed text-justify">
                      {application.aiContext.intendedConsumers.length > 0
                        ? application.aiContext.intendedConsumers.join(', ')
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
          )}

          {activeTab === 'ai-summary' && (
            <div className="space-y-6" id="ai-summary-panel">
              {/* Context Banner */}
              <div className="bg-purple-900 text-white rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                    <BookOpen className="w-4 h-4 text-purple-300" />
                    <span>AI Summary Instructions ➔ Persona Report Generator</span>
                  </div>
                  <h4 className="text-sm font-bold">
                    High-level instructions the AI follows to compose a rich, narrative summary — beyond a single tool call.
                  </h4>
                </div>
                {!isEditingAiSummary && onUpdateApplication && (
                  <button
                    onClick={() => setIsEditingAiSummary(true)}
                    className="px-3 py-1.5 rounded-lg bg-purple-800/80 border border-purple-700 hover:bg-purple-700 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{application.aiSummaryConfig ? 'Edit' : 'Configure'}</span>
                  </button>
                )}
              </div>

              {isEditingAiSummary ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Summary Title</label>
                    <input
                      type="text"
                      value={draftAiSummary.title}
                      onChange={(e) => setDraftAiSummary((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Identity & Access 360° Summary"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      Detailed AI Instructions
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Describe, in plain language, exactly what the AI should look up and report — e.g. which identity
                      fields, which related records (direct reports, renewals, certifications), and how to prioritize
                      overdue vs. upcoming items.
                    </p>
                    <textarea
                      value={draftAiSummary.instructions}
                      onChange={(e) => setDraftAiSummary((prev) => ({ ...prev, instructions: e.target.value }))}
                      rows={8}
                      placeholder="Use the identity info to get their complete details including pending approvals/requests. If they are a leader, review direct reports for low-affinity memberships, required service ID renewals, and any pending IAM certifications..."
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  {SHOW_SUMMARY_TOOL_PICKER && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      APIs / Tools This Summary May Use (optional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {application.apis.map((api) => (
                        <label
                          key={api.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs cursor-pointer hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={draftAiSummary.includedApiIds.includes(api.id)}
                            onChange={() => toggleIncludedApi(api.id)}
                            className="cursor-pointer"
                          />
                          <span className="font-mono font-semibold text-slate-800">{api.suggestedToolName}</span>
                          <span className="text-slate-400 truncate">{api.endpoint}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      Sample Output (shown in AI Chat as a demo preview)
                    </label>
                    <textarea
                      value={draftAiSummary.sampleOutput}
                      onChange={(e) => setDraftAiSummary((prev) => ({ ...prev, sampleOutput: e.target.value }))}
                      rows={6}
                      placeholder="Paste an example of the narrative summary this instruction set should produce..."
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={handleCancelEditAiSummary}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveAiSummary}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save AI Summary Instructions</span>
                    </button>
                  </div>
                </div>
              ) : application.aiSummaryConfig ? (
                <div className="space-y-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      {application.aiSummaryConfig.title}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed text-justify whitespace-pre-wrap">
                      {application.aiSummaryConfig.instructions}
                    </p>
                  </div>

                  {SHOW_SUMMARY_TOOL_PICKER && application.aiSummaryConfig.includedApiIds.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                      <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                        Referenced APIs / Tools
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {application.aiSummaryConfig.includedApiIds.map((apiId) => {
                          const api = application.apis.find((a) => a.id === apiId);
                          return api ? (
                            <span
                              key={apiId}
                              className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-mono font-medium border border-purple-100"
                            >
                              {api.suggestedToolName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      Sample Output Preview
                    </span>
                    <pre className="text-[11px] text-emerald-300 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                      {application.aiSummaryConfig.sampleOutput || 'No sample output configured yet.'}
                    </pre>
                    <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                      This exact preview is what's shown behind the "AI Summary" button on the AI Chat page.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-2">
                  <BookOpen className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">
                    No AI Summary instructions configured for this application yet. Click "Configure" above to define
                    how the AI should compose a narrative summary for this domain.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Swagger / OpenAPI Specification URL{application.swaggerUrls.length > 1 ? 's' : ''} & Authentication
                  </span>
                  {!isEditingSpecs && onUpdateApplication && (
                    <button
                      onClick={() => setIsEditingSpecs(true)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingSpecs && draftAuthConfig ? (
                  <div className="space-y-4">
                    <SwaggerUrlListEditor urls={draftUrls} onChange={setDraftUrls} />
                    <div className="pt-2 border-t border-slate-200">
                      <ApiAuthConfigEditor value={draftAuthConfig} onChange={setDraftAuthConfig} />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={handleCancelEditSpecs}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSaveSpecs}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      {application.swaggerUrls.map((url) => (
                        <div key={url} className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                          <span className="font-mono text-xs font-bold text-slate-900 truncate">{url}</span>
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 flex-shrink-0"
                          >
                            <span>Raw Spec</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Lock className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span className="text-slate-600">Authentication:</span>
                      <span className="font-bold text-indigo-700">{AUTH_TYPE_LABEL[application.authConfig.type]}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Application Details</span>
                {!isEditingDetails && onUpdateApplication && (
                  <button
                    onClick={() => setIsEditingDetails(true)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditingDetails && draftDetails ? (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Application Name *</label>
                      <input
                        type="text"
                        value={draftDetails.name}
                        onChange={(e) => setDraftDetails((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Business Department</label>
                      <input
                        type="text"
                        value={draftDetails.department}
                        onChange={(e) => setDraftDetails((prev) => (prev ? { ...prev, department: e.target.value } : prev))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Application Owner *</label>
                      <PersonTypeahead
                        value={draftDetails.owner}
                        onSelect={(person) =>
                          setDraftDetails((prev) => (prev ? { ...prev, owner: person.name, ownerEmail: person.email } : prev))
                        }
                        placeholder="Search for a person..."
                        invalid={!draftDetails.owner}
                      />
                      {draftDetails.ownerEmail && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Owner email: <span className="font-semibold text-slate-700">{draftDetails.ownerEmail}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Application Support DL</label>
                      <input
                        type="email"
                        value={draftDetails.supportDL}
                        onChange={(e) => setDraftDetails((prev) => (prev ? { ...prev, supportDL: e.target.value } : prev))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. ctp-support-dl@aexp.com"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Project / Application Description</label>
                      <textarea
                        rows={4}
                        value={draftDetails.description}
                        onChange={(e) => setDraftDetails((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    App code ({application.appCode}) and CAR ID ({application.carId}) are fixed at registration and can't be changed.
                  </p>
                  {detailsError && <p className="text-[11px] font-semibold text-red-600">{detailsError}</p>}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={handleCancelEditDetails}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveDetails}
                      disabled={!!detailsError}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Details</span>
                    </button>
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">CAR ID</span>
                  <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{application.carId}</div>
                  <div className="text-xs text-slate-500">Organization Application CAR ID</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Application Owner</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">{application.owner}</div>
                  <div className="text-xs text-slate-500">{application.ownerEmail}</div>
                  <div className="text-xs text-slate-500">{application.department}</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Application Support DL</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">{application.supportDL}</div>
                  <div className="text-xs text-slate-500">Support & disruption notifications</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Associated MCP Server</span>
                  <div className="text-sm font-bold text-indigo-700 mt-1">{application.mcpServerName}</div>
                  <div className="text-xs text-slate-500">v1.4.2 (Active)</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Last Synchronized</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">{application.lastUpdated}</div>
                  <div className="text-xs text-emerald-600 font-medium">Auto-sync enabled</div>
                </div>
              </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500">
            Application ID: <span className="font-mono font-semibold text-slate-700">{application.publicId ?? application.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
