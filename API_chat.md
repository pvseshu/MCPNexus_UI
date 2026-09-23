# API_chat.md

Backend APIs for **Launch AI Chat**. Scope is kept minimal — start here, add more later.

**Base URL:** same as `API.md` — relative to `VITE_API_BASE_URL` (defaults to `http://127.0.0.1:8008`, see `src/utils/apiConfig.ts`). On `/demo`, no backend calls are made — the chat uses the scripted demo scenarios.

The chat page has an MCP server picker. The user must pick one before typing, and every message is sent for that server's application only.

---

## 1. Send Chat Message

Called when the user presses Send. The UI shows a loading indicator until the response arrives. If there is no response within **10 minutes** the client aborts the request and shows a default error message ("Sorry, I couldn't get a response. Please try again.") in the chat. Any non-2xx response or network failure shows the same message.

**POST** `/api/chat/send`

**Input**
```json
{
  "message": "Show me John's recent transactions.",
  "sessionId": "on2OxghJii",
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
  "sessionId": "on2OxghJii",
  "status": "success",
  "message": "Here is what I found. Would you like to see the details of one of them?",
  "list": ["name1", "name2"]
}
```

| Field | Type | Meaning |
|---|---|---|
| `sessionId` | string | Random 10-character id of this chat window (e.g. `on2OxghJii`), created by the backend. Always present in the response. |
| `status` | `"success"` \| `"error"` | `success` for every normal reply, including greetings, small talk and "I couldn't find anything, please refine your request". `error` when the AI could not produce an answer (the application's API call failed, or the AI service failed); `message` then explains what went wrong. |
| `message` | string | Plain text shown as the AI message. When `list` is not empty it is a short generic sentence and a suggested follow-up question. |
| `list` | string[] | Items to show as a list under the message, e.g. `["name1", "name2"]`. Always present; `[]` when the answer has no list. |

**Notes**
- `message` (request) is required and is the text the user typed (trimmed, non-empty).
- `sessionId` (request) is optional. Leave it out (or send an empty string) on the first message of a chat window; the backend creates one and returns it. Send the returned `sessionId` unchanged with every later message of the same chat window, and drop it when the user starts a new chat. All messages with the same `sessionId` are saved together in the backend.
- Every message is saved in the backend with its `sessionId`, the application, the question and the answer, whether an application API was called, which tool and parameters were used, and the API result. This history is not yet used to answer later questions.
- `mcpServer` and `application` describe the server selected in the picker. The application is identified by `publicId` (its internal `id` is not sent), and the backend looks the application up by it. `publicId` is required by the backend; `appCode` is only included when known.
- The backend answers in steps: it checks that the message is about the application (otherwise it replies conversationally), finds the matching MCP tool, calls the application's API with parameters taken from the question, and has the AI turn the API response into the answer.
- Application failures are still HTTP `200` with `status: "error"`, so the client checks `status`, not just the HTTP code.
- Errors: `400` with `{ "error": ... }` for an invalid body or an unknown `publicId`. The client does not show the server error text; it always shows the default error message, styled as an error (red).

## Summary

| # | Method | Path | Used by |
|---|---|---|---|
| 1 | POST | `/api/chat/send` | Launch AI Chat: Send button |
