import {
  Application,
  McpServer,
  McpTool,
  AccessRequest,
  KnowledgeSource,
  AuditEvent,
  AiWorkflow,
  ConversationSession,
  UserAccessRecord,
} from '../types';
import { isDemoMode } from '../utils/demoMode';
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
} from './initialData';

export interface AppDataBundle {
  applications: Application[];
  mcpServers: McpServer[];
  mcpTools: McpTool[];
  accessRequests: AccessRequest[];
  knowledgeSources: KnowledgeSource[];
  auditEvents: AuditEvent[];
  aiWorkflows: AiWorkflow[];
  conversations: ConversationSession[];
  usersAccess: UserAccessRecord[];
}

// ---------------------------------------------------------------------------
// Live fetchers — one per resource, so API integration lands as a one-line
// swap in each function body instead of a rewrite of App.tsx.
//
// TODO(api-integration): replace each body below with the real call, e.g.
//   const res = await fetch('/api/applications');
//   return res.json();
// Until then they fall back to the same static fixtures /demo uses, so the
// regular app keeps working exactly as it does today.
// ---------------------------------------------------------------------------

async function fetchLiveApplications(): Promise<Application[]> {
  return INITIAL_APPLICATIONS;
}

async function fetchLiveMcpServers(): Promise<McpServer[]> {
  return INITIAL_MCP_SERVERS;
}

async function fetchLiveMcpTools(): Promise<McpTool[]> {
  return INITIAL_MCP_TOOLS;
}

async function fetchLiveAccessRequests(): Promise<AccessRequest[]> {
  return INITIAL_ACCESS_REQUESTS;
}

async function fetchLiveKnowledgeSources(): Promise<KnowledgeSource[]> {
  return INITIAL_KNOWLEDGE_SOURCES;
}

async function fetchLiveAuditEvents(): Promise<AuditEvent[]> {
  return INITIAL_AUDIT_EVENTS;
}

async function fetchLiveAiWorkflows(): Promise<AiWorkflow[]> {
  return INITIAL_AI_WORKFLOWS;
}

async function fetchLiveConversations(): Promise<ConversationSession[]> {
  return INITIAL_CONVERSATIONS;
}

async function fetchLiveUsersAccess(): Promise<UserAccessRecord[]> {
  return INITIAL_USERS_ACCESS;
}

// The only place that decides demo vs. live. Everything above/below stays
// agnostic to which mode is active.
export async function loadAppData(): Promise<AppDataBundle> {
  const demo = isDemoMode();

  const [
    applications,
    mcpServers,
    mcpTools,
    accessRequests,
    knowledgeSources,
    auditEvents,
    aiWorkflows,
    conversations,
    usersAccess,
  ] = await Promise.all([
    demo ? Promise.resolve(INITIAL_APPLICATIONS) : fetchLiveApplications(),
    demo ? Promise.resolve(INITIAL_MCP_SERVERS) : fetchLiveMcpServers(),
    demo ? Promise.resolve(INITIAL_MCP_TOOLS) : fetchLiveMcpTools(),
    demo ? Promise.resolve(INITIAL_ACCESS_REQUESTS) : fetchLiveAccessRequests(),
    demo ? Promise.resolve(INITIAL_KNOWLEDGE_SOURCES) : fetchLiveKnowledgeSources(),
    demo ? Promise.resolve(INITIAL_AUDIT_EVENTS) : fetchLiveAuditEvents(),
    demo ? Promise.resolve(INITIAL_AI_WORKFLOWS) : fetchLiveAiWorkflows(),
    demo ? Promise.resolve(INITIAL_CONVERSATIONS) : fetchLiveConversations(),
    demo ? Promise.resolve(INITIAL_USERS_ACCESS) : fetchLiveUsersAccess(),
  ]);

  return {
    applications,
    mcpServers,
    mcpTools,
    accessRequests,
    knowledgeSources,
    auditEvents,
    aiWorkflows,
    conversations,
    usersAccess,
  };
}
