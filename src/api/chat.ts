import { apiUrl } from '../utils/apiConfig';
import { McpServer } from '../types';

// Matches API_chat.md — "1. Send Chat Message"
export const CHAT_TIMEOUT_MS = 2 * 60 * 1000;
export const CHAT_ERROR_MESSAGE = "Sorry, I couldn't get a response. Please try again.";

export interface ChatSendResponse {
  reply: string;
}

export async function sendChatMessage(message: string, server: McpServer): Promise<ChatSendResponse> {
  const app = server.application;
  const body = {
    message,
    mcpServer: { id: server.id, name: server.name },
    application: {
      ...(app?.publicId ? { publicId: app.publicId } : {}),
      name: app?.name ?? server.applicationName,
      ...(app?.appCode ? { appCode: app.appCode } : {}),
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  try {
    const res = await fetch(apiUrl('/api/chat/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Chat send failed (${res.status} ${res.statusText})`);
    }
    // Response shape is still evolving, so show it as-is: a `reply` string if present,
    // otherwise the raw text (or JSON) that came back.
    const raw = await res.text();
    let reply = raw;
    try {
      const data = JSON.parse(raw);
      reply = typeof data === 'string' ? data : typeof data?.reply === 'string' ? data.reply : JSON.stringify(data, null, 2);
    } catch {
      // not JSON — keep the raw text
    }
    if (!reply.trim()) throw new Error('Chat send failed (empty response)');
    return { reply };
  } finally {
    clearTimeout(timer);
  }
}
