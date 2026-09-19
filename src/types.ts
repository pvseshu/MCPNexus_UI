export type NavSection =
  | 'dashboard'
  | 'mcp-servers'
  | 'mcp-tools'
  | 'api-discovery'
  | 'mcp-catalog'
  | 'mcp-orchestrator'
  | 'access-requests'
  | 'ai-chat'
  | 'ai-workflows'
  | 'conversations'
  | 'knowledge-hub'
  | 'knowledge-search'
  | 'users-access'
  | 'audit'
  | 'settings'
  | 'documentation';

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  allowedValues?: string[];
  exampleValue?: string;
  defaultValue?: string;
}

export interface SampleExample {
  id: string;
  name: string;
  description: string;
  payload: Record<string, any>;
  type?: 'success' | 'empty' | 'validation_error' | 'auth_error' | 'business_error';
}

export interface McpTool {
  id: string;
  name: string;
  displayName: string;
  sourceEndpoint: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  serverId: string;
  serverName: string;
  applicationId: string;
  applicationName: string;
  description: string;
  whenToUse: string;
  whenNotToUse: string;
  callSequence?: string;
  inputs: ApiParameter[];
  outputSchemaDescription: string;
  sampleInputs: SampleExample[];
  sampleOutputs: SampleExample[];
  requiredPermission: string;
  status: 'Active' | 'Disabled' | 'Needs Configuration';
  isAiReady: boolean;
  aiReadinessScore: number; // 0 - 100
  lastUsed: string;
  callCount: number;
}

export interface DiscoveredApi {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  tag: string;
  suggestedToolName: string;
  enabledForMcp: boolean;
  configStatus: 'configured' | 'pending' | 'ready';
  parameters: ApiParameter[];
}

export interface ApplicationAiContext {
  businessPurpose: string;
  businessDomain: string;
  keyUseCases: string[];
  commonWorkflows: string[];
  importantTerminology: { term: string; definition: string }[];
  intendedConsumers: string[];
  usageGuidelines: string;
  restrictions: string;
  aiGuidance: string;
}

export interface ApplicationAiSummaryConfig {
  enabled: boolean;
  title: string;
  instructions: string;
  includedApiIds: string[];
  sampleOutput: string;
}

export type ApiAuthType = 'authblue' | 'idaas' | 'oauth';

export interface AuthBlueConfig {
  tokenUrl: string;
  serviceId: string;
  servicePassword: string;
  scopeGroups: string[];
}

export interface IdaasConfig {
  tokenUrl: string;
  appId: string;
  version: string;
  secret: string;
  scope: string[];
}

export type OAuthCredentialStyle = 'basic_auth' | 'json_body';

export interface GenericOAuthConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  credentialStyle: OAuthCredentialStyle;
  requestBodyTemplate: string;
}

export interface ApiAuthConfig {
  type: ApiAuthType;
  authBlue: AuthBlueConfig;
  idaas: IdaasConfig;
  oauth: GenericOAuthConfig;
}

export function createDefaultAuthConfig(type: ApiAuthType = 'authblue'): ApiAuthConfig {
  return {
    type,
    authBlue: {
      tokenUrl: 'https://authbluetokens-dev.aexp.com/v1/app2app/tokens',
      serviceId: '',
      servicePassword: '',
      scopeGroups: [''],
    },
    idaas: {
      tokenUrl: 'https://oneidentityapi.aexp.com/security/digital/v1/application/token',
      appId: '',
      version: '2',
      secret: '',
      scope: [''],
    },
    oauth: {
      tokenUrl: '',
      clientId: '',
      clientSecret: '',
      credentialStyle: 'basic_auth',
      requestBodyTemplate: '{\n  "client_id": "{{clientId}}",\n  "client_secret": "{{clientSecret}}",\n  "grant_type": "client_credentials"\n}',
    },
  };
}

export interface DirectoryPerson {
  id: string;
  name: string;
  email: string;
  title: string;
  team: string;
}

export interface EnterpriseApplication {
  id: string;
  // Stable external identifier from the API (e.g. app-ctp-core-k3x9qa); `id` is the internal database id.
  publicId?: string;
  name: string;
  appCode: string;
  carId: string;
  description: string;
  owner: string;
  ownerEmail: string;
  supportDL: string;
  department: string;
  apiCount: number;
  mcpServerId: string;
  mcpServerName: string;
  mcpToolsCount: number;
  status: 'Active' | 'Pending' | 'Maintenance' | 'Disabled';
  isAiReady: boolean;
  lastUpdated: string;
  swaggerUrls: string[];
  authConfig: ApiAuthConfig;
  aiContext: ApplicationAiContext;
  aiSummaryConfig?: ApplicationAiSummaryConfig;
  apis: DiscoveredApi[];
}

export type Application = EnterpriseApplication;

export interface ApplicationTransformation {
  applicationId: string;
  applicationName: string;
  apisTransformedCount: number;
  mcpServerName: string;
  tools: McpTool[];
}

export interface McpServer {
  id: string;
  name: string;
  version: string;
  applicationId: string;
  applicationName: string;
  owner: string;
  toolsCount: number;
  status: 'Active' | 'Maintenance' | 'Disabled';
  usedByApps: string[];
  dependsOnServers: string[];
  endpointUrl: string;
  transportType: 'SSE' | 'Streamable HTTP' | 'stdio' | 'WebSocket';
  lastDeployed: string;
  healthStatus: 'Healthy' | 'Degraded' | 'Offline';
  isPublishedToCatalog: boolean;
  // Application summary embedded by GET /api/mcp-servers (see API.md section 3).
  // Absent for the static fixtures, which are matched to applications by mcpServerId instead.
  application?: McpServerApplicationSummary;
}

export interface McpServerApplicationSummary {
  id: string;
  publicId?: string;
  name: string;
  appCode: string;
  owner: string;
  ownerEmail: string;
  department: string;
  isAiReady: boolean;
}

export interface AccessRequest {
  id: string;
  requestingApp: string;
  requestingUser: string;
  targetMcpServer: string;
  targetToolName: string;
  reason: string;
  requestedPermission: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
  approvedBy?: string;
  approvalDate?: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  type: 'PDF' | 'Web' | 'Document' | 'Article';
  category: string;
  owner: string;
  accessLevel: 'Internal' | 'Confidential' | 'Public' | 'Restricted';
  tags: string[];
  lastUpdated: string;
  urlOrFilename: string;
  summary: string;
  indexedItemsCount: number;
  relevanceScore?: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userOrApp?: string;
  actor: string;
  action: string;
  mcpServer?: string;
  targetResource: string;
  toolName?: string;
  status: 'SUCCESS' | 'DENIED' | 'PENDING' | 'CONFIG_UPDATED';
  authorization?: string;
  durationMs?: number;
  details: string;
}

export interface AiWorkflowStep {
  order?: number;
  stepNumber?: number;
  name: string;
  action?: string;
  mcpServer?: string;
  targetServer?: string;
  tool?: string;
  status: 'completed' | 'running' | 'pending' | 'failed';
  outputPreview?: string;
}

export interface AiWorkflow {
  id: string;
  name: string;
  title?: string;
  trigger?: string;
  triggerType?: string;
  description: string;
  status: 'Active' | 'Draft' | 'Paused';
  mcpServersUsed?: string[];
  toolsUsed?: string[];
  steps: AiWorkflowStep[];
  executionCount?: number;
  invocationsCount: number;
  lastRun?: string;
  avgDuration?: string;
  avgExecutionTime: string;
}

export type DemoScenarioId =
  | 'scenario-1-success'
  | 'scenario-2-permission-denied'
  | 'scenario-3-multi-orchestration'
  | 'scenario-4-knowledge-search'
  | 'scenario-5-not-integrated'
  | 'scenario-6-combined-knowledge-mcp';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionsTaken?: {
    identifiedCustomer?: string;
    mcpServer?: string;
    toolsCalled?: string[];
    authStatus?: 'verified' | 'denied';
    knowledgeSearched?: string[];
  };
  structuredData?: {
    type: 'transactions' | 'permission_denied' | 'multi_orchestration' | 'knowledge_result' | 'not_integrated' | 'combined';
    data: any;
  };
  sourcesAndActions?: {
    mcpServer: string;
    tools: string[];
  }[];
  knowledgeSources?: {
    title: string;
    type: string;
    date: string;
  }[];
  technicalDetails?: Record<string, any>;
}

export interface ConversationSession {
  id: string;
  title: string;
  user: string;
  userEmail: string;
  applicationName: string;
  applicationId: string;
  mcpServerUsed: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  toolsInvoked: string[];
  status: 'Completed' | 'Active' | 'Pending Resolution';
  summary: string;
  tokensUsed: number;
  messages: ChatMessage[];
  tags: string[];
}

export interface UserAccessRecord {
  id: string;
  name: string;
  email: string;
  role: 'Super Administrator' | 'MCP Architect' | 'App Developer' | 'Compliance Officer' | 'AI Operator';
  department: string;
  mcpServersGranted: string[];
  securityGroups: string[];
  status: 'Active' | 'Suspended' | 'Pending Review';
  lastActive: string;
  apiKeyId: string;
  totalCallsToday: number;
}

export interface EmbedConfig {
  appScopeId: string;
  appScopeName: string;
  allowedServers: string[];
  allowedTools: string[];
  theme: 'clean-light' | 'modern-indigo' | 'slate-dark';
  position: 'bottom-right' | 'embedded' | 'fullscreen-modal';
  primaryColor: string;
  widgetTitle: string;
  greetingMessage: string;
  enableKnowledgeSearch: boolean;
  enableZeroTrustAuth: boolean;
  apiKey: string;
  endpointUrl: string;
}

