import { apiUrl } from '../utils/apiConfig';
import { McpServer } from '../types';

// Matches API_chat.md — "1. Send Chat Message"
export const CHAT_TIMEOUT_MS = 10 * 60 * 1000;
export const CHAT_ERROR_MESSAGE = "Sorry, I couldn't get a response. Please try again.";

export interface ChatSendResponse {
  sessionId: string;
  status: 'success' | 'error';
  message: string;
  list: string[];
}

// `sessionId` is empty on the first message of a chat window; the backend creates one and returns it,
// and the same id is sent with every later message until the chat is cleared.
export async function sendChatMessage(message: string, server: McpServer, sessionId = ''): Promise<ChatSendResponse> {
  const app = server.application;
  const body = {
    message,
    ...(sessionId ? { sessionId } : {}),
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
    const data = await res.json();
    if (typeof data?.message !== 'string' || !data.message.trim()) {
      throw new Error('Chat send failed (missing message)');
    }
    return {
      sessionId: typeof data.sessionId === 'string' ? data.sessionId : sessionId,
      status: data.status === 'error' ? 'error' : 'success',
      message: data.message,
      list: Array.isArray(data.list) ? data.list.map(String) : [],
    };
  } finally {
    clearTimeout(timer);
  }
}
