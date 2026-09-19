import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Server,
  Wrench,
  Compass,
  FileCode,
  Check,
  Zap,
  Globe,
  Sliders,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCw,
} from 'lucide-react';
import { EnterpriseApplication, McpServer, McpTool, DirectoryPerson, ApiAuthConfig, createDefaultAuthConfig } from '../types';
import { PersonTypeahead } from './PersonTypeahead';
import { ApiAuthConfigEditor, SwaggerUrlListEditor } from './ApiAuthConfigEditor';
import { isDemoMode } from '../utils/demoMode';
import { analyzeApiSpec, generateMcpServer, DiscoveredApi, GenerateMcpResponse } from '../api/appRegistration';

interface RegisterAppWizardProps {
  onClose: () => void;
  onComplete: (newApp: EnterpriseApplication, generatedServer: McpServer, generatedTools: McpTool[]) => void;
}

// Required text fields stay red-bordered until a value is entered.
function requiredFieldBorder(value: string): string {
  return value.trim() ? 'border-slate-200 focus:ring-indigo-500' : 'border-red-400 focus:ring-red-500';
}

const SWAGGER_URL_CONVENTIONS: { framework: string; path: string }[] = [
  { framework: 'OpenAPI 3.x (generic)', path: '/openapi.json' },
  { framework: 'Swagger 2.0 (generic)', path: '/v2/swagger.json' },
  { framework: 'Springdoc / Springfox (Java)', path: '/v3/api-docs (or /v2/api-docs)' },
  { framework: 'FastAPI (Python)', path: '/openapi.json' },
  { framework: 'NestJS / swagger-ui-express', path: '/api-docs-json' },
  { framework: 'ASP.NET (Swashbuckle)', path: '/swagger/v1/swagger.json' },
];

const InfoTooltip: React.FC<{ label: string }> = ({ label }) => (
  <span className="relative inline-flex group ml-1.5 align-middle">
    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 cursor-help" tabIndex={0} aria-label={label} />
    <span
      role="tooltip"
      className="pointer-events-none absolute z-20 left-0 top-full mt-2 w-72 max-w-[80vw] opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 transition-all duration-150 origin-top-left"
    >
      <span className="absolute left-1.5 -top-1.5 w-2.5 h-2.5 bg-slate-900 rotate-45" />
      <span className="block bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl p-3 space-y-2">
        <span className="block font-semibold text-indigo-300">Where to find this URL</span>
        <span className="block text-slate-200">
          There's no single universal path — it depends on the framework the API was built with. Common conventions:
        </span>
        <span className="block space-y-1">
          {SWAGGER_URL_CONVENTIONS.map((c) => (
            <span key={c.framework} className="flex justify-between gap-2">
              <span className="text-slate-300">{c.framework}</span>
              <span className="font-mono text-emerald-300 whitespace-nowrap">{c.path}</span>
            </span>
          ))}
        </span>
        <span className="block text-slate-200 pt-1 border-t border-slate-700">
          Fastest way: open the Swagger UI page in a browser, open DevTools → Network, reload, and look for the
          .json (or /api-docs) request — that's the spec URL Swagger UI itself fetched.
        </span>
      </span>
    </span>
  </span>
);

export const RegisterAppWizard: React.FC<RegisterAppWizardProps> = ({
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GenerateMcpResponse | null>(null);

  // /demo pre-fills every field with the same sample application so the wizard
  // demos well without typing. The regular app starts every field blank
  // (placeholders still show the expected format) so nothing gets registered
  // with leftover sample text by accident.
  const demo = isDemoMode();

  // Form states
  const [appName, setAppName] = useState(demo ? 'Customer Transaction Portal' : '');
  const [appCode, setAppCode] = useState(demo ? 'CTP-CORE' : '');
  const [carId, setCarId] = useState('');
  const [owner, setOwner] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [supportDL, setSupportDL] = useState('');
  const [department, setDepartment] = useState(demo ? 'Retail Banking' : '');

  const handleSelectOwner = (person: DirectoryPerson) => {
    setOwner(person.name);
    setOwnerEmail(person.email);
  };
  const [appDescription, setAppDescription] = useState(
    demo
      ? 'Provides customer transaction history, transaction search, customer profile information, transaction status, and related customer servicing capabilities. It is primarily used by customer support and case management applications for investigating customer issues.'
      : ''
  );

  // AI Context structured states
  const [businessPurpose, setBusinessPurpose] = useState(
    demo ? 'Provide unified transaction search and ledger transparency for frontline customer service agents and dispute management pipelines.' : ''
  );
  const [businessDomain, setBusinessDomain] = useState(demo ? 'Customer Servicing & Payment Transactions' : '');
  const [keyUseCases, setKeyUseCases] = useState(
    demo ? 'Transaction discrepancy investigation\nMonthly statement audit\nDisputed charge verification' : ''
  );
  const [commonWorkflows, setCommonWorkflows] = useState(
    demo ? 'Search customer -> Fetch 30-day transactions -> Verify cleared settlement status' : ''
  );
  const [terminology, setTerminology] = useState(
    demo ? 'Settled: Cleared funds on permanent ledger\nPending Hold: Pre-authorization hold\nInterchange Ref: Visa/MC network settlement key' : ''
  );
  const [aiGuidance, setAiGuidance] = useState(
    demo
      ? 'Tool selection: Prefer getCustomerTransactions when the user asks about recent payments, charges, or purchases. Call searchCustomer first if only a name or phone number is given, and resolve customerId before calling any transaction-level tool.\n' +
        'Sequencing: Never call refund or write-actions without first confirming the transaction status via getTransactionDetails.\n' +
        'Data handling: Never return full 16-digit card PANs, SSNs, or raw auth tokens in responses — mask to last 4 digits.\n' +
        'VIP/Restricted accounts: Transactions involving Restricted Wealth/VIP accounts require elevated clearance (GROUP_TRANSACTION_VIEW) — never pass or return card numbers, balances, or transaction details for these accounts without it.\n' +
        'Escalation: If the customer account is flagged VIP/Restricted, do not proceed automatically — surface a warning and require human confirmation.\n' +
        'Ambiguity: If a required parameter (e.g. customerId, date range) is missing or ambiguous, ask a clarifying question instead of guessing a default.\n' +
        'Rate/Scope limits: Do not fetch more than 90 days of transaction history in a single call; page or split larger ranges.'
      : ''
  );

  // Step 2 Spec state
  const [swaggerUrls, setSwaggerUrls] = useState<string[]>(
    demo ? ['https://api.internal.aexp.com/v2/customer-transactions/openapi.json'] : ['']
  );
  const [authConfig, setAuthConfig] = useState<ApiAuthConfig>(createDefaultAuthConfig('authblue'));
  const [specAnalyzed, setSpecAnalyzed] = useState(demo);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [specMeta, setSpecMeta] = useState({
    specVersion: 'OpenAPI 3.1.0',
    baseUrl: 'https://api.internal.aexp.com',
    totalApisDiscovered: 42,
    tagGroups: ['Transactions', 'Profile', 'Status', 'Directory', 'Statements'],
  });

  // Step 3 APIs selection state — demo pre-populates a sample discovery result;
  // the regular app starts empty until "Analyze API Specification(s)" runs.
  const DEMO_API_LIST = [
    { id: '1', endpoint: '/customers/{customerId}/transactions', method: 'GET', name: 'Get Customer Transactions', toolName: 'getCustomerTransactions', enabled: true, tag: 'Transactions' },
    { id: '2', endpoint: '/customers/{customerId}', method: 'GET', name: 'Get Customer Profile', toolName: 'getCustomer', enabled: true, tag: 'Profile' },
    { id: '3', endpoint: '/customers/{customerId}/status', method: 'GET', name: 'Get Customer Status', toolName: 'getCustomerStatus', enabled: true, tag: 'Status' },
    { id: '4', endpoint: '/customers/search', method: 'GET', name: 'Search Customer Directory', toolName: 'searchCustomer', enabled: true, tag: 'Directory' },
    { id: '5', endpoint: '/customers/{customerId}/statements', method: 'GET', name: 'Get Statements List', toolName: 'getCustomerStatements', enabled: true, tag: 'Statements' },
    { id: '6', endpoint: '/transactions/{transactionId}', method: 'GET', name: 'Get Transaction by ID', toolName: 'getTransactionDetails', enabled: true, tag: 'Transactions' },
    { id: '7', endpoint: '/transactions/refund', method: 'POST', name: 'Initiate Customer Refund', toolName: 'initiateRefund', enabled: false, tag: 'Admin Action' },
    { id: '8', endpoint: '/customers/{customerId}/cards', method: 'GET', name: 'Get Active Cards', toolName: 'getCustomerCards', enabled: true, tag: 'Cards' },
  ];
  const [apiList, setApiList] = useState(demo ? DEMO_API_LIST : []);

  const handleAnalyzeSpec = async () => {
    setIsAnalyzing(true);
    setAnalyzeError(null);

    // /demo always shows the same canned discovery result — never calls the backend.
    if (isDemoMode()) {
      setTimeout(() => {
        setIsAnalyzing(false);
        setSpecAnalyzed(true);
      }, 1200);
      return;
    }

    try {
      const result = await analyzeApiSpec({ swaggerUrls: swaggerUrls.filter(Boolean), authConfig });
      setApiList(
        result.apis.map((api: DiscoveredApi) => ({
          id: api.id,
          endpoint: api.endpoint,
          method: api.method,
          name: api.summary,
          toolName: api.suggestedToolName,
          enabled: true,
          tag: api.tag,
        }))
      );
      setSpecMeta({
        specVersion: result.specVersion,
        baseUrl: result.baseUrl,
        totalApisDiscovered: result.totalApisDiscovered,
        tagGroups: result.tagGroups,
      });
      setSpecAnalyzed(true);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Failed to analyze API specification.');
      setSpecAnalyzed(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleApi = (id: string) => {
    setApiList((prev) =>
      prev.map((api) => (api.id === id ? { ...api, enabled: !api.enabled } : api))
    );
  };

  const handleStartGeneration = async () => {
    setStep(5);
    setIsGenerating(true);
    setGenerateError(null);
    setGenerationProgress(10);

    // Animate progress up to 90% while the request is in flight; 100% on success.
    const interval = setInterval(() => {
      setGenerationProgress((p) => Math.min(p + 10, 90));
    }, 450);

    // /demo never calls the backend.
    if (isDemoMode()) {
      setTimeout(() => {
        clearInterval(interval);
        setGenerationProgress(100);
        setIsGenerating(false);
      }, 2200);
      return;
    }

    try {
      const result = await generateMcpServer({
        application: {
          name: appName,
          appCode,
          carId,
          description: appDescription,
          owner,
          ownerEmail,
          supportDL,
          department,
          swaggerUrls: swaggerUrls.filter(Boolean),
          authConfig,
          aiContext: {
            businessPurpose,
            businessDomain,
            keyUseCases: keyUseCases.split('\n').filter(Boolean),
            commonWorkflows: commonWorkflows.split('\n').filter(Boolean),
            importantTerminology: terminology
              .split('\n')
              .filter(Boolean)
              .map((l) => {
                const [term, ...def] = l.split(':');
                return { term: term.trim(), definition: def.join(':').trim() };
              }),
            aiGuidance,
          },
        },
        selectedApis: apiList
          .filter((api) => api.enabled)
          .map((api) => ({ id: api.id, endpoint: api.endpoint, method: api.method, toolName: api.toolName })),
      });
      setGenerated(result);
      setGenerationProgress(100);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate MCP server.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    const newApp: EnterpriseApplication = {
      id: generated?.application.id ?? `app-${Date.now()}`,
      name: appName,
      appCode: appCode || 'NEW-APP',
      carId,
      description: appDescription,
      owner: owner,
      ownerEmail: ownerEmail,
      supportDL: supportDL,
      department: department,
      apiCount: 42,
      mcpServerId: generated?.mcpServer.id ?? `mcp-${Date.now()}`,
      mcpServerName: generated?.mcpServer.name ?? `${appName} MCP`,
      mcpToolsCount: apiList.filter((a) => a.enabled).length,
      status: 'Active',
      isAiReady: true,
      lastUpdated: 'Just now',
      swaggerUrls: swaggerUrls.filter(Boolean),
      authConfig,
      aiContext: {
        businessPurpose,
        businessDomain,
        keyUseCases: keyUseCases.split('\n').filter(Boolean),
        commonWorkflows: commonWorkflows.split('\n').filter(Boolean),
        importantTerminology: terminology.split('\n').map((l) => {
          const [term, ...def] = l.split(':');
          return { term: term?.trim() || 'Term', definition: def.join(':').trim() || '' };
        }),
        intendedConsumers: ['Case Management Platform', 'Customer Support Chatbot', 'AI Agent Orchestrator'],
        usageGuidelines: 'Ensure customerId is resolved prior to invoking transaction queries.',
        restrictions: 'Sensitive VIP accounts require elevated clearance.',
        aiGuidance,
      },
      apis: [
        {
          id: 'gen-1',
          endpoint: '/customers/{customerId}/transactions',
          method: 'GET',
          summary: 'Retrieve customer transaction history with date filters',
          description: 'Fetches chronological transaction records.',
          tag: 'Transactions',
          suggestedToolName: 'getCustomerTransactions',
          enabledForMcp: true,
          configStatus: 'configured',
          parameters: [
            { name: 'customerId', type: 'string', required: true, description: 'Customer ID', exampleValue: 'C12345' },
          ],
        },
      ],
    };

    const generatedServer: McpServer = {
      id: newApp.mcpServerId,
      name: newApp.mcpServerName,
      version: generated?.mcpServer.version ?? '1.0.0',
      applicationId: newApp.id,
      applicationName: newApp.name,
      owner: newApp.owner,
      toolsCount: newApp.mcpToolsCount,
      status: 'Active',
      usedByApps: [],
      dependsOnServers: ['IAM & Access Governance MCP'],
      endpointUrl: generated?.mcpServer.endpointUrl ?? `https://mcp.internal.aexp.com/${appCode.toLowerCase()}`,
      transportType: 'Streamable HTTP',
      lastDeployed: 'Just now',
      healthStatus: 'Healthy',
      isPublishedToCatalog: false,
    };

    const generatedTools: McpTool[] = apiList
      .filter((api) => api.enabled)
      .map((api) => ({
        id: generated?.mcpTools.find((t) => t.name === api.toolName)?.id ?? `tool-${api.id}-${Date.now()}`,
        name: api.toolName,
        displayName: api.name,
        sourceEndpoint: api.endpoint,
        httpMethod: api.method as McpTool['httpMethod'],
        serverId: newApp.mcpServerId,
        serverName: newApp.mcpServerName,
        applicationId: newApp.id,
        applicationName: newApp.name,
        description: `${api.name} (${api.tag})`,
        whenToUse: aiGuidance,
        whenNotToUse: 'Avoid using outside the intended workflow context.',
        inputs: [],
        outputSchemaDescription: 'Structured JSON response from the source API.',
        sampleInputs: [],
        sampleOutputs: [],
        requiredPermission: `MCP_${api.toolName.toUpperCase()}`,
        status: 'Active',
        isAiReady: true,
        aiReadinessScore: 90,
        lastUsed: 'Never',
        callCount: 0,
      }));

    onComplete(newApp, generatedServer, generatedTools);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      id="register-app-wizard-modal"
    >
      <div className="bg-white rounded-2xl w-[92vw] sm:w-[85vw] lg:w-[70vw] xl:w-[60vw] max-w-6xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Wizard Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {step}
              </span>
              <h2 className="text-lg font-bold text-slate-900">Register Enterprise Application & Generate MCP</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Transform OpenAPI specifications into governed, application-specific MCP servers with AI context.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Steps Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs font-medium">
          {[
            { num: 1, label: 'App Details & AI Context' },
            { num: 2, label: 'API Specification' },
            { num: 3, label: 'API Selection' },
            { num: 4, label: 'AI Context Preview' },
            { num: 5, label: 'Generate MCP' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 ${
                step === s.num
                  ? 'text-indigo-700 font-bold'
                  : step > s.num
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-600'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === s.num
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Wizard Body by Step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Application Details & AI Context */}
          {step === 1 && (
            <div className="space-y-6" id="wizard-step-1">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-indigo-950">
                  <span className="font-bold">Project / Application AI Context Layer: </span>
                  The details and context you provide here act as an intelligence layer. AI agents use this domain knowledge to select the right MCP tools, formulate valid inputs, and avoid unintended actions.
                </div>
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Name *</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-lg border text-xs font-semibold focus:outline-hidden focus:ring-2 ${requiredFieldBorder(appName)}`}
                    placeholder="e.g. Customer Transaction Portal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Code / ID *</label>
                  <input
                    type="text"
                    value={appCode}
                    onChange={(e) => setAppCode(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-lg border text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 ${requiredFieldBorder(appCode)}`}
                    placeholder="e.g. CTP-PROD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CAR ID *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={carId}
                    onChange={(e) => setCarId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className={`w-full px-3.5 py-2 rounded-lg border text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 ${requiredFieldBorder(carId.length === 9 ? carId : '')}`}
                    placeholder="e.g. 600123456"
                    maxLength={9}
                  />
                  <p className={`text-[11px] mt-1 ${carId && carId.length !== 9 ? 'text-red-600' : 'text-slate-500'}`}>
                    {carId && carId.length !== 9
                      ? 'CAR ID must be exactly 9 digits.'
                      : "Organization's 9-digit Application CAR ID."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Owner *</label>
                  <PersonTypeahead
                    value={owner}
                    onSelect={handleSelectOwner}
                    placeholder="Search for a person..."
                    invalid={!owner}
                  />
                  {ownerEmail && (
                    <p className="text-[11px] text-slate-500 mt-1">Owner email: <span className="font-semibold text-slate-700">{ownerEmail}</span></p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Department *</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-lg border text-xs font-semibold focus:outline-hidden focus:ring-2 ${requiredFieldBorder(department)}`}
                    placeholder="e.g. Retail Banking Operations"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Support DL *</label>
                  <input
                    type="email"
                    value={supportDL}
                    onChange={(e) => setSupportDL(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-lg border text-xs font-semibold focus:outline-hidden focus:ring-2 ${requiredFieldBorder(supportDL)}`}
                    placeholder="e.g. ctp-support-dl@aexp.com"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Distribution list used for application support, incident, and disruption notifications.
                  </p>
                </div>
              </div>

              {/* Dedicated AI Context Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-900">
                    Project / Application Description & AI Context *
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">Powers AI Skill Understanding</span>
                </div>
                <textarea
                  rows={6}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-lg border text-xs text-slate-800 focus:outline-hidden focus:ring-2 leading-relaxed ${requiredFieldBorder(appDescription)}`}
                  placeholder="Provide detailed information about this application, its purpose, business domain, key workflows, terminology, and how its APIs should be used..."
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Helper: Helps the AI understand the application as a skill when selecting and using MCP Tools.
                </p>
              </div>

              {/* Structured AI Context Fields */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Structured Domain & Workflow Definitions (Optional Enrichment)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Business Purpose</label>
                    <input
                      type="text"
                      value={businessPurpose}
                      onChange={(e) => setBusinessPurpose(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white"
                      placeholder="e.g. Provide unified transaction search and ledger transparency for frontline customer service agents."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Business Domain</label>
                    <input
                      type="text"
                      value={businessDomain}
                      onChange={(e) => setBusinessDomain(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white"
                      placeholder="e.g. Customer Servicing & Payment Transactions"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Key Use Cases (one per line)</label>
                    <textarea
                      rows={5}
                      value={keyUseCases}
                      onChange={(e) => setKeyUseCases(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white"
                      placeholder={'Transaction discrepancy investigation\nMonthly statement audit\nDisputed charge verification'}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Common Workflows (cross-API, optional)</label>
                    </div>
                    <textarea
                      rows={5}
                      value={commonWorkflows}
                      onChange={(e) => setCommonWorkflows(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white"
                      placeholder="e.g. Search customer -> Fetch 30-day transactions -> Verify cleared settlement status"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Only capture the 2-3 flagship journeys that chain multiple APIs together (e.g. search → fetch → verify). Guidance specific to a single API belongs on that tool's "When to Use" field in its own MCP Tool config, not here.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">AI Usage Guidance & Guardrails</label>
                    <textarea
                      rows={8}
                      value={aiGuidance}
                      onChange={(e) => setAiGuidance(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white font-mono leading-relaxed"
                      placeholder={'Tool selection: Prefer toolX when the user asks about... Call searchCustomer first if only a name or phone number is given.\nSequencing: Never call refund or write-actions without first confirming status.\nData handling: Never return full card PANs, SSNs, or raw auth tokens — mask to last 4 digits.\nEscalation: If the account is flagged VIP/Restricted, surface a warning and require human confirmation.\nAmbiguity: If a required parameter is missing, ask a clarifying question instead of guessing.'}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      The more specific this is, the more weight the AI gives it when choosing and sequencing tools. Cover: tool selection rules, call sequencing/prerequisites, sensitive-data handling, escalation conditions, and any rate or scope limits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: API Specification */}
          {step === 2 && (
            <div className="space-y-6" id="wizard-step-2">
              <div className="space-y-2">
                <label className="flex items-center text-xs font-bold text-slate-900">
                  Swagger / OpenAPI 3.0+ Specification URL(s)
                  <InfoTooltip label="How to find your API's Swagger/OpenAPI spec URL" />
                </label>
                <SwaggerUrlListEditor urls={swaggerUrls} onChange={setSwaggerUrls} />
                <button
                  onClick={handleAnalyzeSpec}
                  disabled={isAnalyzing}
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isAnalyzing ? <RotateCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze API Specification(s)'}</span>
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-900">
                  How does MCP Nexus authenticate to fetch the spec and call these APIs?
                </label>
                <p className="text-[11px] text-slate-500">
                  These APIs sit behind an auth gate — pick the one mechanism this application uses. The resulting bearer token is used both to fetch the spec above and for every generated MCP tool call.
                </p>
                <ApiAuthConfigEditor value={authConfig} onChange={setAuthConfig} />
              </div>

              {analyzeError && (
                <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-2 text-red-800 text-xs animate-fadeIn">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{analyzeError}</span>
                </div>
              )}

              {specAnalyzed && (
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-5 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Specification Analyzed Successfully — {specMeta.totalApisDiscovered} APIs Discovered</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                      {specMeta.specVersion}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 font-medium">Discovered Endpoints</span>
                      <div className="text-lg font-bold text-slate-900 mt-0.5">{specMeta.totalApisDiscovered} APIs</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 font-medium">Base URL</span>
                      <div className="text-xs font-mono font-bold text-slate-900 mt-0.5 truncate">
                        {specMeta.baseUrl}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 font-medium">Authentication</span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">Bearer OAuth2 (JWT)</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 font-medium">Tag Groups</span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">{specMeta.tagGroups.length} Resource Tags</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: API Selection */}
          {step === 3 && (
            <div className="space-y-4" id="wizard-step-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Select APIs to Convert into Governed MCP Tools</h3>
                  <p className="text-xs text-slate-500">
                    {apiList.filter((a) => a.enabled).length} of {apiList.length} APIs selected for MCP Generation
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setApiList((p) => p.map((a) => ({ ...a, enabled: true })))}
                    className="px-2.5 py-1 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 rounded"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setApiList((p) => p.map((a) => ({ ...a, enabled: false })))}
                    className="px-2.5 py-1 text-xs text-slate-500 font-semibold hover:bg-slate-100 rounded"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* API Selection Cards */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {apiList.map((api) => (
                  <div
                    key={api.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      api.enabled
                        ? 'border-indigo-200 bg-indigo-50/30'
                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={api.enabled}
                        onChange={() => handleToggleApi(api.id)}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                              api.method === 'GET'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {api.method}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 truncate">{api.endpoint}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
                            {api.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-indigo-900">➔ MCP Tool: {api.toolName}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        api.enabled ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {api.enabled ? 'MCP Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: AI Tool Knowledge Preview */}
          {step === 4 && (
            <div className="space-y-6" id="wizard-step-4">
              <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Context & Knowledge Pipeline</span>
                </div>
                <h3 className="text-base font-bold">
                  Ready to compile {appName} into an Enterprise MCP Server
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  MCP Nexus will bind your application context, schemas, default sample inputs/outputs, and RBAC authorization guardrails into a standalone Model Context Protocol server.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-400 font-semibold">Target Server Name</span>
                  <div className="font-bold text-indigo-700 text-sm mt-1">{appName} MCP</div>
                  <div className="text-[11px] text-slate-500">v1.0.0 (Isolated)</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-400 font-semibold">Selected MCP Tools</span>
                  <div className="font-bold text-slate-900 text-sm mt-1">
                    {apiList.filter((a) => a.enabled).length} Tools Enabled
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium">Type-safe JSON Schema</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-400 font-semibold">AI Skill Context</span>
                  <div className="font-bold text-slate-900 text-sm mt-1">Attached</div>
                  <div className="text-[11px] text-slate-500">Domain & Workflows linked</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Generate MCP Screen & Progress */}
          {step === 5 && (
            <div className="space-y-6 py-6 text-center" id="wizard-step-5">
              {isGenerating ? (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-200 animate-pulse">
                    <Layers className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Generating Enterprise MCP Server...</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Compiling OpenAPI endpoints, attaching AI context layers, and configuring transport bindings.
                    </p>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-blue-600 h-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>

                  <div className="text-xs font-mono text-slate-500">
                    {generationProgress < 40 && 'Analyzing OpenAPI Schemas...'}
                    {generationProgress >= 40 && generationProgress < 80 && 'Generating MCP Tool Definitions & AI Context...'}
                    {generationProgress >= 80 && 'Binding Orchestrator RBAC Policies...'}
                  </div>
                </div>
              ) : generateError ? (
                <div className="space-y-4 max-w-md mx-auto animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto ring-8 ring-red-50">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">MCP Generation Failed</h3>
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-left">{generateError}</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-lg mx-auto animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">MCP Generated Successfully!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Your application is now AI-ready and governed under MCP Nexus.
                    </p>
                  </div>

                  {/* Result Summary Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Application:</span>
                      <span className="font-bold text-slate-900">{appName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Generated MCP Server:</span>
                      <span className="font-bold text-indigo-700">{appName} MCP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Active MCP Tools:</span>
                      <span className="font-bold text-purple-700">{apiList.filter((a) => a.enabled).length} Tools</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Status:</span>
                      <span className="font-bold text-emerald-600">Active (AI Ready)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Buttons */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step > 1 && step < 5 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step < 4 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 2 && !specAnalyzed}
                title={step === 2 && !specAnalyzed ? 'Analyze the API specification first' : undefined}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:hover:bg-slate-300 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleStartGeneration}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Generate MCP Server</span>
              </button>
            )}

            {step === 5 && !isGenerating && generateError && (
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Back & Retry
              </button>
            )}

            {step === 5 && !isGenerating && !generateError && (
              <button
                onClick={handleFinish}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Done & View Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
