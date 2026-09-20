# API_chat.md

Backend APIs for **Launch AI Chat**. Scope is kept minimal — start here, add more later.

**Base URL:** same as `API.md` — relative to `VITE_API_BASE_URL` (defaults to `http://127.0.0.1:8008`, see `src/utils/apiConfig.ts`). On `/demo`, no backend calls are made — the chat uses the scripted demo scenarios.

The chat page has an MCP server picker. The user must pick one before typing, and every message is sent for that server's application only.

---

## 1. Send Chat Message

Called when the user presses Send. The UI shows a loading indicator until the response arrives. If there is no response within **2 minutes** the client aborts the request and shows a default error message ("Sorry, I couldn't get a response. Please try again.") in the chat. Any non-2xx response or network failure shows the same message.

**POST** `/api/chat/send`

**Input**
```json
{
  "message": "Show me John's recent transactions.",
  "mcpServer": {
    "id": "srv-ctp",
    "name": "Customer Transaction Portal MCP"
  },
  "application": {
    "publicId": "b7e1c3a2-5d0f-4c1e-9a55-3f6d1e2a7c10",
    "name": "Customer Transaction Portal",
    "appCode": "CTP"
  }
}
```

**Output**
```json
{
  "reply": "I've retrieved John Smith's recent transaction records."
}
```

**Notes**
- `message` is required and is the text the user typed (trimmed, non-empty).
- `mcpServer` and `application` describe the server selected in the picker. The application is identified by `publicId` (its internal `id` is not sent); `publicId` and `appCode` are only included when known.
- For now the client displays the response directly: `reply` if it is a string, otherwise the raw response body (JSON is pretty-printed). An empty response shows the default error message.
- `reply` is plain text shown as the AI message. The response shape is basic for now and will be extended (structured data, tools called, sources, etc.).
- Errors: `400` with `{ "error": "<message>" }` for an invalid body. The client does not show the server error text; it always shows the default error message, styled as an error (red).

## Summary

| # | Method | Path | Used by |
|---|---|---|---|
| 1 | POST | `/api/chat/send` | Launch AI Chat: Send button |
