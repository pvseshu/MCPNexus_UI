import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Play,
  Sparkles,
  Layers,
  ShieldCheck,
  Globe,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Terminal,
  FileCode,
  Laptop,
} from 'lucide-react';
import { EnterpriseApplication, McpServer, createDefaultAuthConfig } from '../types';

interface EmbedWidgetModalProps {
  applications?: EnterpriseApplication[];
  mcpServers?: McpServer[];
  onClose: () => void;
  onLaunchLivePreview: (app: EnterpriseApplication, color: string, title: string) => void;
}

const fallbackApp: EnterpriseApplication = {
  id: 'app-cust-tx',
  name: 'Customer Transaction Portal',
  appCode: 'CTP-PROD',
  description: 'Enterprise API for retrieving customer profile data and retail card transactions.',
  department: 'Digital Banking',
  owner: 'Sarah Jenkins',
  ownerEmail: 'sarah.jenkins@aexp.com',
  supportDL: 'ctp-support-dl@aexp.com',
  apiCount: 4,
  mcpServerId: 'mcp-cust-tx',
  mcpServerName: 'Customer Transaction Portal MCP',
  mcpToolsCount: 4,
  status: 'Active',
  isAiReady: true,
  lastUpdated: '10 mins ago',
  swaggerUrls: ['https://api.internal.aexp.com/spec/customer-transactions.json'],
  authConfig: createDefaultAuthConfig('authblue'),
  aiContext: {
    businessPurpose: 'Customer Transactions Servicing',
    businessDomain: 'Retail Banking',
    keyUseCases: ['Customer lookups', 'Transaction audits'],
    commonWorkflows: ['Lookup -> Verify'],
    importantTerminology: [],
    intendedConsumers: ['Agent Portal'],
    usageGuidelines: 'Ensure customerId is provided',
    restrictions: 'Requires GROUP_TRANSACTION_VIEW',
    aiGuidance: 'Prefer getCustomerTransactions for transactions query',
  },
  apis: [],
};

const fallbackServer: McpServer = {
  id: 'mcp-cust-tx',
  name: 'Customer Transaction Portal MCP',
  version: '1.4.0',
  applicationId: 'app-cust-tx',
  applicationName: 'Customer Transaction Portal',
  owner: 'Sarah Jenkins',
  toolsCount: 7,
  status: 'Active',
  usedByApps: [],
  dependsOnServers: [],
  endpointUrl: 'https://mcp.mcpnexus.internal/customer-transaction-portal/mcp',
  transportType: 'Streamable HTTP',
  lastDeployed: '10 mins ago',
  healthStatus: 'Healthy',
  isPublishedToCatalog: true,
};

export const EmbedWidgetModal: React.FC<EmbedWidgetModalProps> = ({
  applications = [],
  mcpServers = [],
  onClose,
  onLaunchLivePreview,
}) => {
  const [selectedAppId, setSelectedAppId] = useState(applications?.[0]?.id || 'app-cust-tx');
  const [selectedTab, setSelectedTab] = useState<'react' | 'mcpclient' | 'slack' | 'rest' | 'query' | 'nodejs'>('react');
  const [themeColor, setThemeColor] = useState('#4f46e5');
  const [widgetTitle, setWidgetTitle] = useState('Customer Servicing AI Assistant');
  const [position, setPosition] = useState<'bottom-right' | 'embedded'>('bottom-right');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const currentApp = applications?.find((a) => a.id === selectedAppId) || applications?.[0] || fallbackApp;
  const currentServer =
    mcpServers?.find((s) => s.id === currentApp.mcpServerId) || fallbackServer;

  const handleCopyCode = (code: string, tabName: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 1500);
  };

  const reactSnippet = `// 1. Install MCP Nexus React Embed SDK
// npm install @mcp-nexus/react

import React from 'react';
import { McpChatWidget } from '@mcp-nexus/react';
import '@mcp-nexus/react/dist/index.css';

export function MyEnterpriseApp() {
  return (
    <div className="min-h-screen bg-white">
      {/* Your Host Application UI (Customer Portal, CRM, Ledger) */}
      <h1 className="text-2xl font-bold">Welcome to Customer Hub</h1>

      {/* Embed Governed AI Chat Widget */}
      <McpChatWidget
        appId="${currentApp.id}"
        mcpServer="${currentApp.mcpServerName}"
        apiKey={process.env.MCP_NEXUS_API_KEY}
        endpoint="https://api.mcpnexus.internal/v1/chat"
        title="${widgetTitle}"
        primaryColor="${themeColor}"
        position="${position}"
        enableZeroTrustAuth={true}
        onToolExecution={(event) => {
          console.log('MCP Tool Dispatched:', event.toolName, event.parameters);
        }}
      />
    </div>
  );
}`;

  const mcpConfigKey = currentApp.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const mcpClientSnippet =
    currentServer.transportType === 'stdio'
      ? `// Codex CLI / GitHub Copilot — connect directly over MCP.
// No chat UI, no Nexus reasoning step: your MCP client calls "${currentServer.name}"'s
// ${currentServer.toolsCount} tools directly, governed by the same RBAC groups as
// every other consumer (AI Chat, Autonomous Agents, AI Summary).
//
// 1. Copy this block into your client's MCP config file:
//    - Codex CLI:      ~/.codex/config.toml (under [mcp_servers])
//    - GitHub Copilot: .vscode/mcp.json
// 2. Restart the client — it discovers all ${currentServer.toolsCount} tools automatically.

{
  "mcpServers": {
    "${mcpConfigKey}": {
      "command": "npx",
      "args": ["-y", "@mcp-nexus/stdio-bridge", "--server", "${currentServer.id}"],
      "env": {
        "MCP_NEXUS_API_KEY": "mcp_live_sec_9941a8"
      }
    }
  }
}

// Every tool call is still checked against this API key's security groups
// (e.g. GROUP_TRANSACTION_VIEW) before it reaches the upstream enterprise API.`
      : `// Claude Desktop / Claude Code / Cursor / Codex / GitHub Copilot — connect directly over MCP.
// No chat UI, no Nexus reasoning step: your MCP client calls "${currentServer.name}"'s
// ${currentServer.toolsCount} tools directly, governed by the same RBAC groups as
// every other consumer (AI Chat, Autonomous Agents, AI Summary).
//
// 1. Copy this block into your client's MCP config file:
//    - Claude Desktop: claude_desktop_config.json
//    - Claude Code:    .mcp.json (project) or ~/.claude.json (user)
//    - Cursor:         .cursor/mcp.json
//    - Codex CLI:      ~/.codex/config.toml (under [mcp_servers])
//    - GitHub Copilot: .vscode/mcp.json
// 2. Restart the client — it discovers all ${currentServer.toolsCount} tools automatically.

{
  "mcpServers": {
    "${mcpConfigKey}": {
      "url": "${currentServer.endpointUrl}",
      "transport": "${currentServer.transportType === 'Streamable HTTP' ? 'http' : currentServer.transportType.toLowerCase()}",
      "headers": {
        "Authorization": "Bearer \${MCP_NEXUS_API_KEY}"
      }
    }
  }
}

// Every tool call is still checked against this API key's security groups
// (e.g. GROUP_TRANSACTION_VIEW) before it reaches the upstream enterprise API —
// direct MCP access does not bypass Zero-Trust governance, only the chat layer.`;

  const slackSnippet = `// Slack App Integration — Slack Bolt for JavaScript
// npm install @slack/bolt @mcp-nexus/sdk
//
// 1. Create a Slack app at api.slack.com/apps, add the "/nexus-ask"
//    slash command, and enable bot token scopes: commands, chat:write.
// 2. Install the app to your workspace and copy the Bot Token + Signing Secret.

import { App } from '@slack/bolt';
import { McpNexusClient } from '@mcp-nexus/sdk';

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const nexus = new McpNexusClient({
  apiKey: process.env.MCP_NEXUS_API_KEY,
  endpoint: 'https://api.mcpnexus.internal/v1',
});

// Usage in Slack: /nexus-ask Show transactions for customer C12345
slackApp.command('/nexus-ask', async ({ command, ack, respond }) => {
  await ack();

  const result = await nexus.orchestrator.chat({
    applicationId: '${currentApp.id}',
    prompt: command.text,
    userContext: {
      userId: command.user_id,
      groups: ['GROUP_TRANSACTION_VIEW'],
    },
  });

  await respond({
    response_type: 'in_channel', // visible to the whole channel, not just the requester
    text: result.content,
  });
});

await slackApp.start(process.env.PORT || 3000);`;

  const curlSnippet = `# Call MCP Nexus Orchestrator API directly from backend
curl -X POST https://api.mcpnexus.internal/v1/orchestrator/chat \\
  -H "Authorization: Bearer mcp_live_sec_9941a8" \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicationId": "${currentApp.id}",
    "mcpServer": "${currentApp.mcpServerName}",
    "userPrompt": "Show transactions for customer C12345 in August 2026",
    "userContext": {
      "userId": "user-881",
      "securityGroups": ["GROUP_TRANSACTION_VIEW"]
    },
    "allowedTools": ["searchCustomer", "getCustomerTransactions"]
  }'`;

  const querySnippet = `# Query API — pass a target MCP server & a natural language question,
# get back governed tool results + citations instead of a pre-written chat
# reply, so YOUR application can generate its own AI summary on top.
curl -X POST https://api.mcpnexus.internal/v1/query \\
  -H "Authorization: Bearer mcp_live_sec_9941a8" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mcpServer": "${currentApp.mcpServerName}",
    "question": "Show transactions for customer C12345 in August 2026",
    "userContext": {
      "userId": "user-881",
      "securityGroups": ["GROUP_TRANSACTION_VIEW"]
    },
    "responseMode": "structured"
  }'

# Response — raw tool outputs + citations, no forced summary:
# {
#   "toolsInvoked": [
#     { "name": "searchCustomer", "durationMs": 41, "status": "SUCCESS" },
#     { "name": "getCustomerTransactions", "durationMs": 84, "status": "SUCCESS" }
#   ],
#   "results": [
#     { "tool": "getCustomerTransactions", "data": [ /* raw JSON records */ ] }
#   ],
#   "citations": [
#     { "source": "Customer Transaction Portal MCP", "toolName": "getCustomerTransactions" }
#   ],
#   "nexusSuggestedSummary": "Customer C12345 had 3 settled transactions in August 2026...",
#   "auditEventId": "EVT-19042"
# }
#
# Use "results" + "citations" to build your own summary, or just take
# "nexusSuggestedSummary" if Nexus's own synthesis is good enough.`;

  const nodeSnippet = `// Node.js / Express Backend SDK
import { McpNexusClient } from '@mcp-nexus/sdk';

const client = new McpNexusClient({
  apiKey: process.env.MCP_NEXUS_API_KEY,
  endpoint: 'https://api.mcpnexus.internal/v1',
});

async function runAssistant(userQuery: string) {
  const result = await client.orchestrator.chat({
    applicationId: '${currentApp.id}',
    prompt: userQuery,
    userContext: {
      userId: 'agent-102',
      groups: ['GROUP_TRANSACTION_VIEW'],
    },
  });

  return result;
}`;

  const getActiveCode = () => {
    switch (selectedTab) {
      case 'react':
        return reactSnippet;
      case 'mcpclient':
        return mcpClientSnippet;
      case 'slack':
        return slackSnippet;
      case 'rest':
        return curlSnippet;
      case 'query':
        return querySnippet;
      case 'nodejs':
        return nodeSnippet;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="embed-widget-modal">
      <div className="bg-white rounded-3xl max-w-6xl w-full p-8 shadow-2xl space-y-6 max-h-[94vh] overflow-y-auto animate-scaleUp border border-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Integrate MCP Chat in Your Own Application</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Embed SDK
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Easily embed this enterprise-governed AI chat into your React portal, a Slack workspace, or a custom Node.js backend —
              connect <span className="font-semibold text-slate-700">Codex or Copilot directly over the MCP protocol</span> with no chat layer in between —
              or call the <span className="font-semibold text-slate-700">Query API</span> to get governed tool results + citations back
              as structured JSON and build your own AI summary on top.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          {/* Target App Picker */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Application Scope</label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.mcpToolsCount} tools)
                </option>
              ))}
            </select>
          </div>

          {/* Widget Title */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Widget Header Title</label>
            <input
              type="text"
              value={widgetTitle}
              onChange={(e) => setWidgetTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Color & Position */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="font-semibold text-slate-700 block mb-1">Brand Theme Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-[11px] text-slate-600">{themeColor}</span>
              </div>
            </div>

            <div className="flex-1">
              <label className="font-semibold text-slate-700 block mb-1">Display Mode</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="bottom-right">Floating Bubble</option>
                <option value="embedded">Embedded Div</option>
              </select>
            </div>
          </div>
        </div>

        {/* Big Highlight: Full White Background Host Application Preview Button */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Laptop className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold">Experience Live in Host Application (Full White Background)</h4>
            </div>
            <p className="text-xs text-slate-300">
              Launch a full realistic Banking & CRM host portal on a clean white background to test the widget in production context.
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onLaunchLivePreview(currentApp, themeColor, widgetTitle);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Live Host App Preview</span>
          </button>
        </div>

        {/* Code Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTab('react')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTab === 'react'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                React Component
              </button>
              <button
                onClick={() => setSelectedTab('mcpclient')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTab === 'mcpclient'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Codex / Copilot (MCP Config)
              </button>
              <button
                onClick={() => setSelectedTab('slack')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTab === 'slack'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Slack App
              </button>
              <button
                onClick={() => setSelectedTab('rest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTab === 'rest'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                cURL / REST API
              </button>
              <button
                onClick={() => setSelectedTab('query')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTab === 'query'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Query API (Build Your Own Summary)
              </button>
              <button
                onClick={() => setSelectedTab('nodejs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTab === 'nodejs'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Node.js SDK
              </button>
            </div>

            <button
              onClick={() => handleCopyCode(getActiveCode(), selectedTab)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedTab === selectedTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Viewer */}
          <pre className="p-5 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-auto leading-relaxed border border-slate-800 shadow-inner h-[30rem]">
            <code>{getActiveCode()}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero-Trust Enterprise Auth & Token Rotation Built-In</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
