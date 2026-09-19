import { ApiAuthConfig } from '../types';
import { apiUrl } from '../utils/apiConfig';

// Matches API.md — "1. Analyze API Specification"

export interface DiscoveredApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  exampleValue: string;
}

export interface DiscoveredApi {
  id: string;
  endpoint: string;
  method: string;
  summary: string;
  description: string;
  tag: string;
  suggestedToolName: string;
  parameters: DiscoveredApiParameter[];
}

export interface AnalyzeSpecRequest {
  swaggerUrls: string[];
  authConfig: ApiAuthConfig;
}

export interface AnalyzeSpecResponse {
  specVersion: string;
  baseUrl: string;
  totalApisDiscovered: number;
  tagGroups: string[];
  apis: DiscoveredApi[];
}

export async function analyzeApiSpec(request: AnalyzeSpecRequest): Promise<AnalyzeSpecResponse> {
  let res: Response;
  try {
    res = await fetch(apiUrl('/api/app-registration/analyze-spec'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(`Could not reach the API server at ${apiUrl('/api/app-registration/analyze-spec')}. Is it running?`);
  }

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Analyze spec'));
  }

  return res.json();
}

// Matches API.md — "2. Generate MCP Server"

export interface GenerateMcpRequest {
  application: {
    name: string;
    appCode: string;
    carId: string;
    description: string;
    owner: string;
    ownerEmail: string;
    supportDL: string;
    department: string;
    swaggerUrls: string[];
    authConfig: ApiAuthConfig;
    aiContext: {
      businessPurpose: string;
      businessDomain: string;
      keyUseCases: string[];
      commonWorkflows: string[];
      importantTerminology: { term: string; definition: string }[];
      intendedConsumers: string[];
      usageGuidelines: string;
      restrictions: string;
      aiGuidance: string;
    };
  };
  selectedApis: { id: string; endpoint: string; method: string; toolName: string }[];
}

export interface GenerateMcpResponse {
  application: {
    id: string;
    name: string;
    appCode: string;
    carId: string;
    status: string;
    isAiReady: boolean;
    lastUpdated: string;
  };
  mcpServer: {
    id: string;
    name: string;
    version: string;
    endpointUrl: string;
    transportType: string;
    healthStatus: string;
  };
  mcpTools: {
    id: string;
    name: string;
    displayName: string;
    sourceEndpoint: string;
    httpMethod: string;
    requiredPermission: string;
    status: string;
  }[];
}

export async function generateMcpServer(request: GenerateMcpRequest): Promise<GenerateMcpResponse> {
  const url = apiUrl('/api/app-registration/generate');
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(`Could not reach the API server at ${url}. Is it running?`);
  }

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Generate MCP server'));
  }

  return res.json();
}

// Backends commonly return { "error": "..." } or { "detail": "..." } (FastAPI) on failure.
// Fall back to the raw response text, then to the HTTP status, so something readable
// always makes it to the user regardless of the error shape.
async function extractErrorMessage(res: Response, action: string): Promise<string> {
  const fallback = `${action} failed (${res.status} ${res.statusText})`;
  const text = await res.text().catch(() => '');
  if (!text) return fallback;

  try {
    const body = JSON.parse(text);
    const message = body?.error || body?.detail || body?.message;
    if (typeof message === 'string' && message.trim()) return message;

    // DRF-style (possibly nested) field validation errors, e.g.
    // { "authConfig": { "authBlue": { "serviceId": ["This field may not be blank."] } } }
    if (body && typeof body === 'object') {
      const fieldMessages = flattenFieldErrors(body).join('; ');
      if (fieldMessages) return fieldMessages;
    }
  } catch {
    // Not JSON — use the raw text if it looks like a short, human-readable message.
    if (text.length < 300) return text;
  }

  return fallback;
}

function flattenFieldErrors(value: unknown, path: string[] = []): string[] {
  if (Array.isArray(value)) {
    const text = value.filter((v) => typeof v === 'string').join(' ');
    return text ? [`${path.join('.')}: ${text}`] : [];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, v]) => flattenFieldErrors(v, [...path, key]));
  }
  if (typeof value === 'string' && path.length) {
    return [`${path.join('.')}: ${value}`];
  }
  return [];
}
