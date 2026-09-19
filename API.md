# API.md

Backend APIs needed for the "Register Application" wizard. Scope is kept minimal — start here, add more later.

**Base URL:** all endpoints below are relative to `VITE_API_BASE_URL` (defaults to `http://127.0.0.1:8008` — see `src/utils/apiConfig.ts`). Set `VITE_API_BASE_URL` in a `.env` file to point the app at a different host. On `/demo`, no backend calls are made at all — the wizard uses static canned data.

Everything before **Generate MCP Server** (app details, spec analysis, API selection, AI context) is handled in memory on the client. Nothing is written to the database or vector DB until the user clicks **Generate MCP Server**.

---

## 1. Analyze API Specification

Used in the wizard's "API Specification" step. Fetches the given OpenAPI/Swagger URL(s), parses them, and returns the discovered endpoints for the user to pick from. Does not persist anything.

**POST** `/api/app-registration/analyze-spec`

**Tables touched:** none (read-only, nothing persisted).

**Input**
```json
{
  "swaggerUrls": ["https://api.internal.aexp.com/v2/customer-transactions/openapi.json"],
  "authConfig": {
    "type": "authblue",
    "authBlue": {
      "tokenUrl": "https://authbluetokens-dev.aexp.com/v1/app2app/tokens",
      "serviceId": "svc-ctp-core",
      "servicePassword": "••••••••",
      "scopeGroups": ["CTP_READ", "CTP_TXN_READ"]
    }
  }
}
```

**Output**
```json
{
  "specVersion": "OpenAPI 3.1.0",
  "baseUrl": "https://api.internal.aexp.com",
  "totalApisDiscovered": 42,
  "tagGroups": ["Transactions", "Profile", "Status", "Directory", "Statements"],
  "apis": [
    {
      "id": "1",
      "endpoint": "/customers/{customerId}/transactions",
      "method": "GET",
      "summary": "Get Customer Transactions",
      "description": "Fetches chronological transaction records for a customer with optional date range filters.",
      "tag": "Transactions",
      "suggestedToolName": "getCustomerTransactions",
      "parameters": [
        { "name": "customerId", "location": "path", "type": "string", "required": true, "description": "Customer ID", "exampleValue": "C12345" },
        { "name": "fromDate", "location": "query", "type": "string", "required": false, "description": "Start date (YYYY-MM-DD)", "exampleValue": "2026-06-01" }
      ]
    },
    {
      "id": "2",
      "endpoint": "/customers/{customerId}",
      "method": "GET",
      "summary": "Get Customer Profile",
      "description": "Fetches core profile details for a customer.",
      "tag": "Profile",
      "suggestedToolName": "getCustomer",
      "parameters": [
        { "name": "customerId", "location": "path", "type": "string", "required": true, "description": "Customer ID", "exampleValue": "C12345" }
      ]
    }
  ]
}
```

**Notes on the request**
- `swaggerUrls` is required (at least one URL). Every spec is downloaded, and the discovered endpoints from all specs are returned as one flat list. `id` is a sequential string ("1", "2", ...) across the whole list, so it is only stable while the spec content is unchanged.
- `authConfig` is optional. Only `type: "authblue"` with an `authBlue` block is used today: the server fetches a token from `tokenUrl` and sends it as `Authorization: Bearer <token>` when downloading the spec. Any other `authConfig` content (for example `idaas` or `oauth` blocks) is accepted but ignored.

**Notes on the response**
- `specVersion` and `baseUrl` come from the first spec. `baseUrl` is the resolved server URL (see "Application and API rows" in section 2).
- `suggestedToolName` is the operation's `operationId`, or a generated camelCase name when the spec has none.
- On failure (spec unreachable, timeout, non-2xx, unparseable) the response is `400` with `{ "error": "<message>" }`. An invalid request body returns `400` with DRF field errors.

**Notes on `parameters`**
- `location` is where the value goes in the HTTP call: `path`, `query`, `header` or `cookie`. It comes from the spec's `in` field.
- Parameters defined by reference (`$ref: '#/components/parameters/...'`) and parameters declared at path level (shared by every method on that path) are resolved and included. Parameters with no name are skipped, and a duplicate `(name, location)` is listed once, with the operation-level definition winning.
- This list contains **inputs only** (path/query/header/cookie). The request body and the response schema are not returned here; they are read from the spec again and saved by **Generate MCP Server** (section 2).

> The "API Selection" step (choosing which discovered APIs become MCP tools) is just checkbox state on the client over this response — no separate API call.

---

## 2. Generate MCP Server

Used in the wizard's final "Generate MCP Server" step. This is the **only** step that persists data — it saves the application, its AI context, and the selected APIs as MCP tools to the database, and indexes the AI context / tool descriptions into the vector DB.

**POST** `/api/app-registration/generate`

**Tables touched:** `projects_project` (application + AI context + MCP server fields), `api_registry_api` (one row per swagger URL), `tools_tool` and `tools_toolparameter` (one row per selected API / its params). All database writes happen in one transaction: if anything fails, nothing is saved.

**Vector DB (best effort):** after the database writes, the project text (name, description, AI context) and each tool's text (name, display name, summary, description) are embedded through Ollama and upserted into Qdrant, into the `QDRANT_PROJECTS_COLLECTION` (default `mcp_projects`) and `QDRANT_TOOLS_COLLECTION` (default `mcp_tools`) collections. The point id is the database id of the project / tool. If Ollama or Qdrant is unreachable, indexing is skipped with a warning and the request still succeeds, so the app is saved but not yet searchable.

**Input**
```json
{
  "application": {
    "name": "Customer Transaction Portal",
    "appCode": "CTP-CORE",
    "carId": "600123456",
    "description": "Provides customer transaction history, transaction search, customer profile information, transaction status, and related customer servicing capabilities. It is primarily used by customer support and case management applications for investigating customer issues.",
    "owner": "Priya Nair",
    "ownerEmail": "priya.nair@aexp.com",
    "supportDL": "ctp-support-dl@aexp.com",
    "department": "Digital Banking",
    "swaggerUrls": ["https://api.internal.aexp.com/v2/customer-transactions/openapi.json"],
    "authConfig": {
      "type": "authblue",
      "authBlue": {
        "tokenUrl": "https://authbluetokens-dev.aexp.com/v1/app2app/tokens",
        "serviceId": "svc-ctp-core",
        "servicePassword": "••••••••",
        "scopeGroups": ["CTP_READ", "CTP_TXN_READ"]
      }
    },
    "aiContext": {
      "businessPurpose": "Provide unified transaction search and ledger transparency for frontline customer service agents and dispute management pipelines.",
      "businessDomain": "Customer Servicing & Payment Transactions",
      "keyUseCases": ["Transaction discrepancy investigation", "Monthly statement audit", "Disputed charge verification"],
      "commonWorkflows": ["Search customer -> Fetch 30-day transactions -> Verify cleared settlement status"],
      "importantTerminology": [
        { "term": "Settled", "definition": "Cleared funds on permanent ledger" },
        { "term": "Pending Hold", "definition": "Pre-authorization hold" }
      ],
      "intendedConsumers": ["Case Management Platform", "Customer Support Chatbot"],
      "usageGuidelines": "Ensure customerId is resolved prior to invoking transaction queries.",
      "restrictions": "Sensitive VIP accounts require elevated clearance.",
      "aiGuidance": "Prefer getCustomerTransactions for recent payment questions. Call searchCustomer first if only a name/phone is given. Never return full card PANs — mask to last 4 digits."
    }
  },
  "selectedApis": [
    { "id": "1", "endpoint": "/customers/{customerId}/transactions", "method": "GET", "toolName": "getCustomerTransactions" },
    { "id": "2", "endpoint": "/customers/{customerId}", "method": "GET", "toolName": "getCustomer" }
  ]
}
```

**Output**
```json
{
  "application": {
    "id": 1,
    "publicId": "app-ctp-core-k3x9qa",
    "name": "Customer Transaction Portal",
    "appCode": "CTP-CORE",
    "carId": "600123456",
    "status": "Active",
    "isAiReady": true,
    "lastUpdated": "2026-09-15T10:32:00Z"
  },
  "mcpServer": {
    "id": "mcp-1",
    "name": "Customer Transaction Portal MCP",
    "version": "1.0.0",
    "endpointUrl": "https://mcp.internal.aexp.com/ctp-core",
    "transportType": "Streamable HTTP",
    "healthStatus": "Healthy"
  },
  "mcpTools": [
    {
      "id": "tool-1",
      "name": "getCustomerTransactions",
      "displayName": "Get Customer Transactions",
      "sourceEndpoint": "/customers/{customerId}/transactions",
      "httpMethod": "GET",
      "requiredPermission": "MCP_GETCUSTOMERTRANSACTIONS",
      "status": "Active"
    },
    {
      "id": "tool-2",
      "name": "getCustomer",
      "displayName": "Get Customer Profile",
      "sourceEndpoint": "/customers/{customerId}",
      "httpMethod": "GET",
      "requiredPermission": "MCP_GETCUSTOMER",
      "status": "Active"
    }
  ]
}
```

**Validation and errors**
- Required: `application.name`, `application.appCode`, `application.swaggerUrls` (at least one URL) and a **non-empty** `selectedApis`. Each `selectedApis` item needs `id`, `endpoint`, `method` and `toolName`. Everything else in `application` is optional, including every `aiContext` field (`intendedConsumers`, `usageGuidelines` and `restrictions` are new; a missing one is stored as empty). `ownerEmail` and `supportDL` must be valid emails when not blank.
- `selectedApis: []` (or a missing list) fails with `400` and `{ "selectedApis": { "non_field_errors": ["This list may not be empty."] } }`.
- Because the spec is downloaded again, a selected API is matched by `id` first, then by `endpoint` + `method`. If it no longer exists, the response is `400` with `{ "error": "Selected API GET /x was not found when re-analyzing the spec." }`. A spec that cannot be downloaded also returns `400` with `{ "error": "..." }`.
- `application.authConfig`: as in section 1, only the `authBlue` block is used and stored. **`servicePassword` is never saved** (stored as an empty string). `idaas` / `oauth` blocks are ignored.

**What is stored for each tool**

The server re-reads the swagger spec(s) when generating, so the client only needs to send `id` / `endpoint` / `method` / `toolName` for each selected API.

| Table / column | Content |
|---|---|
| `tools_tool` | `name` (= `toolName`), `display_name`, `description`, `summary`, `http_method`, `path`, `operation_id`, `tags`, `status` |
| `tools_tool.required_permission` | Generated, not read from the spec: `MCP_` + `toolName` upper-cased (e.g. `get-an-album` → `MCP_GET-AN-ALBUM`). This is the value the governance layer checks. |
| `tools_tool.request_schema` | The request body: `{ "required": bool, "contentType": "application/json", "schema": {...} }`. `{}` when the operation has no body (typical for GET/DELETE). |
| `tools_tool.response_schema` | The first 2xx response (else `default`): `{ "status": "200", "description": "...", "contentType": "application/json", "schema": {...} }`. |
| `tools_toolparameter` | **Inputs only.** One row per path / query / header / cookie parameter (`location` = where it goes), plus one row per top-level field of the request body with `location = "body"`. Columns: `name`, `location`, `data_type`, `required`, `description`, `default_value`, `enum_values`. |

- **Inputs vs outputs:** input = `tools_toolparameter` rows (and the full body shape in `request_schema`); output = `tools_tool.response_schema`. Outputs are not stored as parameter rows.
- If the request body is not an object (e.g. an array), it is stored as a single `body` parameter.
- `$ref`s in the body and response schemas are inlined so each stored schema is self-contained. Nesting is expanded to 5 levels; circular references and anything deeper are replaced by a stub such as `{ "type": "object", "description": "(reference to Track not expanded)" }`.
- Swagger 2 specs are handled too: an `in: body` parameter becomes `request_schema`, and a response `schema` becomes `response_schema`.
- Re-running generate for the same `appCode` updates the existing project, and for the same `toolName` updates the existing tool and replaces that tool's parameter rows. Tools saved by an earlier run that are **not** in the new `selectedApis` are left as they are; they are not deleted.
- `mcpServer.endpointUrl` is `MCP_SERVER_BASE_URL` (server setting) + `/` + the lower-cased `appCode`.

**Application identifiers**
- `application.id` is the internal database id (1, 2, 3, ...). Use it only for internal references.
- `application.publicId` is the identifier to use outside the backend, such as in the React embed and other systems. Format: `app-<appCode slug>-<6 random characters>`, e.g. `app-ctp-core-k3x9qa`.
- `publicId` is generated **once**, when the application is first registered, and stored in `projects_project.public_id` (unique). Re-running generate for the same `appCode`, or renaming the application, never changes it.
- It is random, so the same app has a **different** `publicId` in each environment (dev, test, prod). Do not treat it as a secret; access control must still come from authentication.

**Application and API rows** (nothing extra is entered in the UI; all of this is read from the spec)

| Table / column | Content |
|---|---|
| `projects_project.openapi_url` | The first swagger URL from the request |
| `projects_project.base_url` | Server the endpoints are called on, from the first spec (e.g. `https://api.spotify.com/v1`). A runtime calls a tool at `base_url + tool.path`. |
| `api_registry_api` | One row per swagger URL, unique per `(project, spec_url)` |
| `api_registry_api.spec_url` | The swagger URL as entered |
| `api_registry_api.base_url` | That spec's server URL |
| `api_registry_api.name` | The spec's `info.title` (e.g. `Spotify Web API`); the URL is appended only if two specs in the project share a title |
| `api_registry_api.version` / `openapi_version` | `info.version` and the `openapi` / `swagger` version |
| `tools_tool.api_id` | The `api_registry_api` row of the spec the tool came from |

`base_url` is taken from OpenAPI 3 `servers[0].url` (a relative URL such as `/v1` is resolved against the spec URL, and `{variable}` placeholders use their defaults) or, for Swagger 2, `schemes` + `host` + `basePath`. It is empty if the spec declares no server.

**Client behaviour**
- Called once, when the user clicks **Generate MCP Server** (wizard step 4). Only the APIs still ticked in the selection step are sent in `selectedApis`.
- The UI should not allow Generate with nothing selected; the server rejects an empty `selectedApis` (see "Validation and errors").
- On success (`201`) the client uses the returned `application.id`, `mcpServer` (`id`, `name`, `version`, `endpointUrl`) and each `mcpTools[].id` (matched to the request by `name` == `toolName`). Any missing field falls back to a locally generated value.
- On failure the wizard shows the error message on step 5 with a **Back & Retry** button. The message is read from `error`, `detail` or `message` in the JSON body, else from DRF-style field errors (e.g. `{ "application": { "name": ["This field may not be blank."] } }`), else from the raw response text.
- On `/demo` this endpoint is never called.

---

# MCP Servers page

Four endpoints cover the whole MCP Servers page (cards, search/filter, detail modal, catalog toggle, edits). Search and the department filter run on the client over the list response. The "Manifest" copy button is built on the client from the list data. **Register Application** reuses sections 1 and 2 above.

An application and its MCP server are one entity (`projects_project`), so the page reads and edits them together, keyed by the **MCP server id** (`mcpServer.id`).

## 3. List MCP Servers

Feeds the card grid, the header counts ("N Active Servers", "Explore All N Tools") and the department dropdown.

**GET** `/api/mcp-servers`

**Tables touched:** read-only: `projects_project`, `tools_tool` (counts), plus the consumer / dependency links.

**Output**
```json
{
  "servers": [
    {
      "id": "mcp-1",
      "name": "Customer Transaction Portal MCP",
      "version": "1.0.0",
      "status": "Active",
      "healthStatus": "Healthy",
      "endpointUrl": "https://mcp.internal.aexp.com/ctp-core",
      "transportType": "Streamable HTTP",
      "toolsCount": 2,
      "isPublishedToCatalog": true,
      "lastDeployed": "2026-09-15T10:32:00Z",
      "usedByApps": ["Case Management"],
      "dependsOnServers": ["Customer Profile MCP"],
      "application": {
        "id": "1",
        "publicId": "app-ctp-core-k3x9qa",
        "name": "Customer Transaction Portal",
        "appCode": "CTP-CORE",
        "owner": "Priya Nair",
        "ownerEmail": "priya.nair@aexp.com",
        "department": "Digital Banking",
        "isAiReady": true
      }
    }
  ]
}
```

- No pagination or server-side filtering for now (the page filters in memory). Add `?search=&department=` later if the list grows large.
- `usedByApps` and `dependsOnServers` are not implemented on the backend yet. They may be omitted or `[]`; the client treats both as "none".
- `status`: `Active` | `Maintenance` | `Disabled`. `healthStatus`: `Healthy` | `Degraded` | `Offline`.

## 4. Get MCP Server Detail

Used when a card is clicked (application detail popup). Returns the full application record; the heavy fields (AI context, auth, APIs) are not in the list. One call fills the whole popup:

| Popup part | Filled from |
|---|---|
| Header (name, app code, CAR ID, status, description) | `application` |
| **API ➔ MCP Tool Transformation (N)** tab | `apis` (N = `apis.length`; "X of Y MCP Tools Active" = `enabledForMcp` count of `mcpToolsCount`) |
| **Application AI Context & Skill Definition** tab | `application.aiContext` |
| **AI Summary Instructions** tab ("Not Configured" when `aiSummaryConfig` is `null` or not `enabled`) | `application.aiSummaryConfig` |
| **OpenAPI Spec & Metadata** tab (spec URLs, auth type, CAR ID, owner, support DL, MCP server name/version/status, last synchronized) | `application.swaggerUrls`, `authConfig`, `carId`, `owner*`, `supportDL`, `department`, `lastUpdated`, and `server` |
| Stop / Activate Application, edits and saves inside the popup | section 5 |

**GET** `/api/mcp-servers/{id}`

**Tables touched:** read-only: `projects_project`, `api_registry_api`, `tools_tool`.

**Output**
```json
{
  "server": { "...same shape as one item in section 3..." },
  "application": {
    "id": "1",
    "publicId": "app-ctp-core-k3x9qa",
    "name": "Customer Transaction Portal",
    "appCode": "CTP-CORE",
    "carId": "600123456",
    "description": "Provides customer transaction history ...",
    "owner": "Priya Nair",
    "ownerEmail": "priya.nair@aexp.com",
    "supportDL": "ctp-support-dl@aexp.com",
    "department": "Digital Banking",
    "status": "Active",
    "isAiReady": true,
    "lastUpdated": "2026-09-15T10:32:00Z",
    "mcpToolsCount": 2,
    "swaggerUrls": ["https://api.internal.aexp.com/v2/customer-transactions/openapi.json"],
    "authConfig": {
      "type": "authblue",
      "authBlue": {
        "tokenUrl": "https://authbluetokens-dev.aexp.com/v1/app2app/tokens",
        "serviceId": "svc-ctp-core",
        "servicePassword": "",
        "scopeGroups": ["CTP_READ", "CTP_TXN_READ"]
      }
    },
    "aiContext": {
      "businessPurpose": "...",
      "businessDomain": "...",
      "keyUseCases": ["..."],
      "commonWorkflows": ["..."],
      "importantTerminology": [{ "term": "Settled", "definition": "Cleared funds on permanent ledger" }],
      "intendedConsumers": ["..."],
      "usageGuidelines": "...",
      "restrictions": "...",
      "aiGuidance": "..."
    },
    "aiSummaryConfig": {
      "enabled": true,
      "title": "Transaction Summary",
      "instructions": "...",
      "includedApiIds": ["1"],
      "sampleOutput": "..."
    }
  },
  "apis": [
    {
      "id": "1",
      "endpoint": "/customers/{customerId}/transactions",
      "method": "GET",
      "summary": "Get Customer Transactions",
      "description": "...",
      "tag": "Transactions",
      "suggestedToolName": "getCustomerTransactions",
      "enabledForMcp": true,
      "parameters": [
        { "name": "customerId", "location": "path", "type": "string", "required": true, "description": "Customer ID", "exampleValue": "C12345" }
      ]
    }
  ]
}
```

- `servicePassword` is **never returned** (always `""`), since it is not stored. To change it the client sends a new one in section 5.
- `application.status`: `Active` | `Pending` | `Maintenance` | `Disabled`. `mcpToolsCount` is the number of saved tools.
- `apis` are the tools already saved in `tools_tool` (with their `tools_toolparameter` rows), not a fresh spec download. Each item has the same shape as an item from section 1, plus `enabledForMcp` (the tool's status is `Active`; `false` shows as "Not Active" in the popup). `id` is the saved tool's database id (as a string), not the sequential id from the discovery step, because those are not stored. `aiSummaryConfig.includedApiIds` refer to these ids.
- `aiSummaryConfig` is `null` when never configured.
- `404` with `{ "error": "MCP server not found." }` for an unknown id.

## 5. Update MCP Server

One partial-update endpoint for every edit on the page. Send only the fields being changed; omitted fields are left as they are.

**PATCH** `/api/mcp-servers/{id}`

**Tables touched:** `projects_project` (all fields below; the AI context columns for `aiContext`), `api_registry_api` (when `swaggerUrls` changes).

**Input** (any subset)
```json
{
  "name": "Customer Transaction Portal",
  "description": "Provides customer transaction history ...",
  "owner": "Priya Nair",
  "ownerEmail": "priya.nair@aexp.com",
  "supportDL": "ctp-support-dl@aexp.com",
  "department": "Digital Banking",
  "status": "Maintenance",
  "swaggerUrls": ["https://api.internal.aexp.com/v2/customer-transactions/openapi.json"],
  "authConfig": {
    "type": "authblue",
    "authBlue": {
      "tokenUrl": "https://authbluetokens-dev.aexp.com/v1/app2app/tokens",
      "serviceId": "svc-ctp-core",
      "servicePassword": "••••••••",
      "scopeGroups": ["CTP_READ"]
    }
  },
  "aiContext": {
    "businessPurpose": "...",
    "businessDomain": "...",
    "keyUseCases": ["..."],
    "commonWorkflows": ["..."],
    "importantTerminology": [{ "term": "Settled", "definition": "Cleared funds on permanent ledger" }],
    "intendedConsumers": ["..."],
    "usageGuidelines": "...",
    "restrictions": "...",
    "aiGuidance": "..."
  },
  "aiSummaryConfig": {
    "enabled": true,
    "title": "Transaction Summary",
    "instructions": "...",
    "includedApiIds": ["1"],
    "sampleOutput": "..."
  }
}
```

| Field | UI action |
|---|---|
| `name`, `description`, `owner`, `ownerEmail`, `supportDL`, `department` | "Edit" under Application Details on the OpenAPI Spec & Metadata tab. `appCode` and `carId` are fixed at registration and are **not** accepted here (sending them returns `400`). |
| `status` | **Stop Application** (`Disabled`) and **Activate Application** (`Active`) in the popup header (`Maintenance` is also allowed) |
| `swaggerUrls`, `authConfig` | "Edit" on the API Specification section of the detail modal. Same rules as section 2: only `authBlue` is stored, `servicePassword` is not saved. |
| `aiContext` | "Edit" on the Application AI Context & Skill Definition tab |
| `aiSummaryConfig` | "Edit / Configure" on the AI Summary section |

**Output:** `200` with the updated `{ "server": {...}, "application": {...} }` in the same shape as section 4, so the client can replace its local copy.

- **Stop / Activate:** `status` is the application's status and its MCP server follows it. `Disabled` stops the MCP server: every tool call against it should be rejected (the API only records the status; the check belongs in the service that serves tool calls) and `server.healthStatus` becomes `Offline` until it is set back to `Active` (then `Healthy`). The response carries the new `server` and `application`, so the client updates both the card and the popup from it.
- **Application details:** `name` and `ownerEmail` / `supportDL` (when not blank) are validated as in section 2; `name` and `owner` cannot be blank. Changing `name` or `description` also re-embeds the project text into the vector DB (best effort). `publicId` never changes, and neither does the MCP server `endpointUrl` (it is built from `appCode`). The response `server` shows the new `applicationName` / owner.
- **AI context:** send the whole `aiContext` object (all nine fields); it replaces the stored one, so a field left out is cleared. After saving, the project text is re-embedded into the vector DB (best effort, same as section 2), otherwise search keeps using the old text.
- **AI Summary:** saving sends the whole `aiSummaryConfig` object (the client always sets `enabled: true` on save).
- Changing `swaggerUrls` / `authConfig` only saves the new values on the project (`swagger_urls`, `openapi_url` = first URL); `api_registry_api` rows are left as they are. It does not re-generate tools; the tool list changes only by running **Generate MCP Server** again (section 2).
- Errors: `404` unknown id; `400` with `{ "error": "..." }` or DRF field errors (same shapes as sections 1 and 2); an empty `swaggerUrls` list is rejected.

## 6. Set Catalog Visibility

Used by the "Listed in MCP Catalog" / "Not enabled for Catalog (Private)" button on each MCP server card. It publishes the server to the MCP Catalog (so others can discover it and request access) or makes it private again.

**PUT** `/api/mcp-servers/{id}/catalog-visibility`

**Tables touched:** `projects_project` (`is_published_to_catalog`).

**Input**
```json
{ "isPublishedToCatalog": true }
```

**Output** `200`
```json
{ "id": "mcp-1", "isPublishedToCatalog": true }
```

- The client sends the value it wants (the opposite of what the card shows now), not a "flip". Sending the same value twice is safe, so a double click or a retry cannot undo itself.
- The card updates from the returned `isPublishedToCatalog`. If the call fails, the card keeps its old state and shows the error.
- `isPublishedToCatalog` is required and must be a boolean, otherwise `400` with `{ "error": "..." }`. Unknown id returns `404` with `{ "error": "MCP server not found." }`.
- Making a server private only hides it from the Catalog. Existing access that was already approved is not removed.
- The current value is returned as `isPublishedToCatalog` in sections 3 and 4.
- On `/demo` this endpoint is never called; the card toggles local state only.

---

# Menu badge counts

## 7. Get Navigation Counts

The side menu shows a badge next to some items (MCP Servers, MCP Tools, Access Requests). One lightweight endpoint returns all of them, so the menu needs one call on load instead of one per item, and it does not have to load the full lists just to count them.

**GET** `/api/navigation/counts`

**Tables touched:** read-only; `COUNT(*)` queries only (`projects_project`, `tools_tool`, access requests).

**Output**
```json
{
  "mcpServers": 5,
  "mcpTools": 42,
  "pendingAccessRequests": 3
}
```

- Keys are the menu item ids in camelCase. To add a badge for another menu item later, add a key here; no new endpoint.
- `mcpServers` is all registered servers (same number as `servers.length` from section 3). `mcpTools` is all tools across servers. `pendingAccessRequests` counts requests waiting for a decision.
- A missing key means the client shows no badge for that item.
- Refresh after Generate MCP Server (section 2), an access request decision, or on a timer if the menu should stay current. The client can also bump the local number after its own actions without calling again.
- Not covered: the static "1.2k" badge on Knowledge Hub is hard-coded in the UI today. Add e.g. `knowledgeDocuments` here when that page gets real data.
- On `/demo` this endpoint is never called; the counts come from the static data.

## Summary

| # | Method | Path | Used by |
|---|---|---|---|
| 1 | POST | `/api/app-registration/analyze-spec` | Wizard: API Specification step |
| 2 | POST | `/api/app-registration/generate` | Wizard: Generate MCP Server |
| 3 | GET | `/api/mcp-servers` | MCP Servers page: cards |
| 4 | GET | `/api/mcp-servers/{id}` | MCP Servers page: detail modal |
| 5 | PATCH | `/api/mcp-servers/{id}` | MCP Servers page: status, spec/auth edit, AI summary edit |
| 6 | PUT | `/api/mcp-servers/{id}/catalog-visibility` | MCP Servers page: catalog toggle on the card |
| 7 | GET | `/api/navigation/counts` | Side menu badges |
