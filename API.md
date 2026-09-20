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
- `authConfig` is optional. `type: "authblue"` (`authBlue` block) and `type: "oauth"` (`oauth` block) are used: the server fetches a token from `tokenUrl` and sends it as `Authorization: Bearer <token>` when downloading the spec. Only the block of the selected `type` has to be filled in (`tokenUrl` + `serviceId` for authblue, `tokenUrl` + `clientId` for oauth); other blocks are accepted as blank defaults. `idaas` is accepted but not used yet.

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

**Tables touched:** `projects_project` (application + AI context + MCP server fields), `api_registry_api` (one row per swagger URL), `tools_tool` and `tools_toolparameter` (one row per discovered API / its params: the selected ones with status `active`, all the others with status `disabled`). All database writes happen in one transaction: if anything fails, nothing is saved.

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
- `application.authConfig`: as in section 1. **Secrets are saved** on the application in the database (encrypted at rest): `authBlue.servicePassword`, `oauth.clientSecret`, `idaas.secret`. The server uses them to fetch tokens for that application later, for example in section 9. They are never returned by any endpoint (returned as `""`). Sending a blank secret on a later save or `PATCH` keeps the stored one.

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
- Re-running generate for the same `appCode` updates the existing project, and for the same `toolName` updates the existing tool and replaces that tool's parameter rows. Tools saved by an earlier run that are **not** in the new `selectedApis` are left as they are; they are not deleted. Every discovered API that is not selected is also saved, as a `disabled` tool named after its `suggestedToolName` (a `_2`, `_3` suffix is added on a name clash), so API Discovery can list all of them and a user can enable one later without re-analyzing the spec. An endpoint (method + path) that is already saved is never touched by this, so a re-run cannot disable something that was enabled since. Only the active tools are indexed for search.
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

- `servicePassword` is **never returned** (always `""`), even though it is stored (section 2). To change it the client sends a new one in section 5; leaving it out or sending `""` keeps the stored one.
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
| `swaggerUrls`, `authConfig` | "Edit" on the API Specification section of the detail modal. Same rules as section 2: only `authBlue` is stored, and a new `servicePassword` replaces the saved one (blank keeps it). |
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

The side menu shows a badge next to some items (MCP Servers, MCP Tools, API Discovery, MCP Catalog, Access Requests). One lightweight endpoint returns all of them, so the menu needs one call on load instead of one per item, and it does not have to load the full lists just to count them.

**GET** `/api/navigation/counts`

**Tables touched:** read-only; `COUNT(*)` queries only: `projects_project` (`mcpServers`, `apiDiscovery`, and `mcpCatalog` via `is_published_to_catalog = true`), `tools_tool` (`mcpTools` = `status = 'active'`, `apiDiscovery` = all rows), `auth_governance_accessrequest` (`pendingAccessRequests`, `status = 'pending'`).

**Output**
```json
{
  "mcpServers": 5,
  "mcpTools": 42,
  "apiDiscovery": 5,
  "mcpCatalog": 3,
  "pendingAccessRequests": 3
}
```

- Keys are the menu item ids in camelCase. To add a badge for another menu item later, add a key here; no new endpoint.
- `mcpServers` is all registered servers (same number as `servers.length` from section 3). `mcpTools` is the number of enabled tools across servers (`status = 'active'`). `apiDiscovery` is every stored endpoint, enabled or not (`tools_tool` row count). `mcpCatalog` is the number of servers published to the catalog (`isPublishedToCatalog = true`, section 6). `pendingAccessRequests` counts requests waiting for a decision.
- A missing key means the client shows no badge for that item.
- Refresh after Generate MCP Server (section 2), a catalog visibility change (section 6), an access request decision, or on a timer if the menu should stay current. The client can also bump the local number after its own actions without calling again.
- Not covered: the static "1.2k" badge on Knowledge Hub is hard-coded in the UI today. Add e.g. `knowledgeDocuments` here when that page gets real data.
- On `/demo` this endpoint is never called; the counts come from the static data.

---

# MCP Tools page

## 8. List MCP Tools

Feeds the tool card grid on the MCP Tools page, the header counts ("N Governed Capabilities", "N Active", "N Inactive") and the MCP Server / Status dropdowns. It is also what "View N Tools" on an MCP server card opens, pre-filtered to that server.

**GET** `/api/mcp-tools`

**Tables touched:** read-only: `tools_tool`, `tools_toolparameter` (only if input counts are needed), `projects_project` (server / application names).

**Query (optional):** `serverId=mcp-1` returns only that server's tools. Without it, all tools are returned.

**Output**
```json
{
  "tools": [
    {
      "id": "tool-1",
      "name": "getCustomerTransactions",
      "displayName": "Get Customer Transactions",
      "description": "Fetches chronological transaction records for a customer with optional date range filters.",
      "sourceEndpoint": "/customers/{customerId}/transactions",
      "httpMethod": "GET",
      "serverId": "mcp-1",
      "serverName": "Customer Transaction Portal MCP",
      "applicationId": "1",
      "applicationName": "Customer Transaction Portal",
      "requiredPermission": "MCP_GETCUSTOMERTRANSACTIONS",
      "status": "Active",
      "isAiReady": true,
      "aiReadinessScore": 90,
      "sampleInputsCount": 2,
      "sampleOutputsCount": 1,
      "lastUsed": "2026-09-18T14:05:00Z",
      "callCount": 128
    }
  ]
}
```

- Field sources: `name`, `displayName`, `description`, `httpMethod`, `requiredPermission`, `status` come from `tools_tool` (`sourceEndpoint` = `tools_tool.path`). `serverId` / `serverName` / `applicationId` / `applicationName` come from the tool's project (same ids as section 3).
- `status`: `Active` | `Needs Configuration`. Only enabled tools are in this list (see the last-but-two note below), so `Disabled` is never returned here. The card shows the "Test Tool" button only for `Active`. A tool with `Needs Configuration` still appears in the list.
- Search (name, description, endpoint, server name) and the server / status filters run on the client over this list. No pagination or server-side filtering for now, apart from the optional `serverId`.
- `sampleInputsCount` / `sampleOutputsCount` are the lengths of the sample lists saved through section 11 (`0` until someone adds samples). `aiReadinessScore` and `isAiReady` are calculated from them by the same rules as section 10. `lastUsed` and `callCount` are not stored yet (no usage data), so the backend may return `null` / `0`, and the client shows "Used: Never (0 calls)". `lastUsed` is an ISO timestamp or `null`.
- **Not in this response:** `whenToUse`, `whenNotToUse`, `callSequence`, `inputs`, `outputSchemaDescription` and the sample payloads. Only **Configure Tool** and **Test Tool** need them, so they come from `GET /api/mcp-tools/{id}` (section 10), and **Save Configuration** goes to section 11.
- `mcpTools` in the section 7 counts is the length of this list across all servers.
- **Only enabled tools are returned** (`tools_tool.status = 'active'`, shown as `Active` or `Needs Configuration`). A `disabled` row is either an endpoint that was discovered but never enabled (section 2) or a tool someone turned off (section 11). Both appear only on the API Discovery page, so this list is not flooded with them. A tool disabled through section 11 therefore disappears from this page, and is turned back on from API Discovery with the same section 11 call.
- On `/demo` this endpoint is never called; the tools come from the static data.

## 9. Run MCP Tool Test

Used by the **Run Test** button in the "Interactive MCP Tool Execution Sandbox" popup (opened by "Test Tool" on a tool card). It calls the tool's real backend API once with the JSON typed in the left panel and returns the response for the right panel. Nothing is saved by this call; "Save as Sample Input / Output" is a separate action that goes through section 11.

**POST** `/api/mcp-tools/{id}/execute`

**Tables touched:** read-only: `tools_tool`, `tools_toolparameter`, `projects_project` (`base_url`, `auth_config`). Nothing is written.

**Input**
```json
{
  "input": {
    "customerId": "C12345",
    "fromDate": "2026-06-01"
  }
}
```

**Output** `200`
```json
{
  "success": true,
  "httpStatus": 200,
  "durationMs": 142,
  "request": {
    "method": "GET",
    "url": "https://api.internal.aexp.com/v2/customers/C12345/transactions?fromDate=2026-06-01"
  },
  "response": {
    "customerId": "C12345",
    "totalCount": 3,
    "transactions": [
      { "transactionId": "TX1001", "date": "2026-08-14", "merchant": "Whole Foods Market", "amount": 125.5, "status": "COMPLETED" }
    ]
  },
  "error": null
}
```

- `input` is a flat JSON object keyed by parameter name, the same shape as a sample input. The server places each value by the tool's saved parameters (`tools_toolparameter.location`): `path` values fill `{placeholders}` in `tools_tool.path`, `query` / `header` / `cookie` are added to the request, and `body` parameters are combined into the JSON request body. Unknown keys are ignored.
- The call goes to `projects_project.base_url` + `tools_tool.path` with the tool's `http_method`. If the application uses `authblue` or `oauth`, the server fetches a token from the stored `tokenUrl` and sends `Authorization: Bearer <token>`. `authblue` posts `serviceId` / `servicePassword` / `scopeGroups` as JSON; `oauth` with `credentialStyle: basic_auth` sends `grant_type=client_credentials` with the client id/secret as HTTP Basic auth, and `json_body` posts `requestBodyTemplate` with `{{clientId}}` / `{{clientSecret}}` filled in. `idaas` is not supported yet (the call returns `success: false`). The token request uses that application's own saved `authConfig` from `projects_project`, so each application authenticates with its own credentials. The browser never sends credentials here, and they are never returned in the response.
- **Upstream failures are still `200`.** When the target API answers with 4xx / 5xx, times out cannot be reached, or no access token could be obtained (`error` starts with "Could not get an access token"), the endpoint returns `200` with `success: false`, the upstream `httpStatus` (or `null` for timeout / unreachable), `response` set to the upstream body when there is one, and `error` set to a short message such as `"Upstream returned 404"` or `"Timed out after 30s"`. The popup shows these in the right panel and in the status bar (instead of a fixed "200 OK").
- `response` is the parsed JSON body; if the upstream body is not JSON it is returned as a string. Very large bodies are truncated (1 MB) and `error` says so.
- `request.url` is returned for display only. Header and cookie values, and the token, are never echoed back.
- `durationMs` is the time of the upstream call only, not the token fetch.

**Errors** (the request itself was not valid, so nothing was called)
- `404` with `{ "error": "MCP tool not found." }` for an unknown id.
- `400` with `{ "error": "..." }` when `input` is missing or not an object, or `{ "error": "Missing required parameter: customerId" }` when a required parameter has no value.
- `409` with `{ "error": "Tool is not active." }` when the tool's status is not `Active`, or its MCP server is `Disabled` / `Maintenance`. The button is already disabled for non-active tools in the UI; this is the server-side guard.

**Notes**
- This makes a **real call** to the application's API, so a `POST` / `PUT` / `DELETE` tool can change data. The popup should make that clear for non-GET tools (the header already shows the target endpoint); the API does not block them.
- This is a direct REST call made by the Python API to the application's API. It does not go through the MCP server or check `requiredPermission`; it only tests that the tool's API mapping and the inputs work. Recording tests in audit logs / call counts is not decided yet.
- The client should set a timeout a little above the server's 30s upstream limit, and keep the Run Test button in its "Executing Tool..." state until the response arrives.
- On `/demo` this endpoint is never called; the popup keeps returning its canned response.

## 10. Get MCP Tool Detail

Used when **Configure Tool** is clicked on a tool card. Returns everything the "Configure Tool" popup shows in one call, so the list (section 8) stays light. Also the source for the sample inputs / outputs the **Test Tool** popup offers.

| Popup part | Filled from |
|---|---|
| Header (name, status, server, original API, AI Readiness %) | `tool` |
| **Multiple Sample Inputs (N)** tab | `sampleInputs` |
| **Multiple Sample Outputs (N)** tab | `sampleOutputs` |
| **AI Usage Guidance** tab (when to use / not use, call sequence) | `whenToUse`, `whenNotToUse`, `callSequence` |
| **Input Schema (N)** tab (read-only table) | `inputs` |
| **Description & Security** tab | `description`, `requiredPermission` |
| Save Configuration | section 11 |

**GET** `/api/mcp-tools/{id}`

**Tables touched:** read-only: `tools_tool` (all tool fields, the three guidance columns and the two sample columns), `tools_toolparameter` (`inputs`), `projects_project` (`id` and `name`, for the server / application fields).

**Output**
```json
{
  "tool": {
    "id": "tool-1",
    "name": "getCustomerTransactions",
    "displayName": "Get Customer Transactions",
    "sourceEndpoint": "/customers/{customerId}/transactions",
    "httpMethod": "GET",
    "serverId": "mcp-1",
    "serverName": "Customer Transaction Portal MCP",
    "applicationId": "1",
    "applicationName": "Customer Transaction Portal",
    "status": "Active",
    "isAiReady": true,
    "aiReadinessScore": 89,
    "description": "Fetches chronological transaction records for a customer with optional date range filters.",
    "requiredPermission": "MCP_GETCUSTOMERTRANSACTIONS",
    "whenToUse": "Use this tool when the user asks for recent or historical transactions for an identified customer.",
    "whenNotToUse": "Do not use this tool for customer profile information or access-management questions.",
    "callSequence": "Call getCustomer first. Take customerId from its response and pass it here.",
    "outputSchemaDescription": "Transactions for the customer, newest first.",
    "inputs": [
      { "name": "customerId", "location": "path", "type": "string", "required": true, "description": "Customer ID", "exampleValue": "C12345" },
      { "name": "fromDate", "location": "query", "type": "string", "required": false, "description": "Start date (YYYY-MM-DD)", "exampleValue": "2026-06-01" }
    ],
    "sampleInputs": [
      {
        "id": "si-1",
        "name": "Last two weeks",
        "description": "Query transactions for the first two weeks of August",
        "type": "success",
        "payload": { "customerId": "C12345", "fromDate": "2026-08-01", "toDate": "2026-08-14" }
      }
    ],
    "sampleOutputs": [
      {
        "id": "so-1",
        "name": "Transactions found",
        "description": "Normal response with results",
        "type": "success",
        "payload": { "customerId": "C12345", "transactions": [{ "transactionId": "TX1001", "amount": 125.5, "status": "COMPLETED" }] }
      },
      {
        "id": "so-2",
        "name": "No results",
        "description": "Empty response when no records match the filter",
        "type": "empty",
        "payload": { "customerId": "C12345", "transactions": [] }
      }
    ]
  }
}
```

- Field sources: `description`, `requiredPermission`, `status`, `displayName`, `httpMethod` and `sourceEndpoint` (= `path`) come from `tools_tool` as in section 8. `inputs` are the tool's `tools_toolparameter` rows, in the same shape as `parameters` in section 1 (`exampleValue` is the parameter's `default_value`, `""` when there is none). `outputSchemaDescription` is `tools_tool.response_schema.description` (`""` when there is none).
- **New columns on `tools_tool`** (migration `tools/0003_tool_ai_guidance_and_samples`) for what the popup edits and the backend did not store before: `when_to_use`, `when_not_to_use`, `call_sequence` (text, blank by default), and `sample_inputs`, `sample_outputs` (JSON arrays, `[]` by default). Samples are kept as JSON on the tool, not as rows, because they are always read and replaced as a whole list.
- `sampleInputs[].type` is always `success`. `sampleOutputs[].type`: `success` | `empty` | `validation_error` | `auth_error` | `business_error`. `payload` is a JSON object. `id` is assigned by the server and is only stable within one tool.
- `aiReadinessScore` (0-100) is calculated by the server on read, not stored: `min(100, 75 + 5 × number of sample inputs + 3 × number of sample outputs)`. `isAiReady` is `true` when the tool has a `description`, `whenToUse` and `whenNotToUse`. Section 8 uses the same rules.
- `404` with `{ "error": "MCP tool not found." }` for an unknown id. A disabled tool is still readable by id (`status: "Disabled"`), even though it is not in the section 8 list.
- On `/demo` this endpoint is never called; the popup opens with the tool's static data.

## 11. Update MCP Tool Configuration

The **Save Configuration** button of the "Configure Tool" popup, and also the way to **enable or disable** a tool (the API Discovery page uses it to turn a discovered endpoint into an MCP tool, or to turn one off). One partial-update endpoint for every field, so it needs no separate endpoints for samples or for enabling. Send only the fields being changed; omitted fields are left as they are.

**PATCH** `/api/mcp-tools/{id}`

**Tables touched:** `tools_tool` only. Columns written: `status`, `description`, `required_permission`, `when_to_use`, `when_not_to_use`, `call_sequence`, `sample_inputs`, `sample_outputs` (the last five are new, see section 10). Nothing in `tools_toolparameter` or `projects_project` changes. If `description`, `whenToUse` or `whenNotToUse` changed, the tool's vector in Qdrant (`mcp_tools`, point id = `tools_tool.id`) is re-embedded; disabled tools are not indexed, so they are skipped. Changing `status` also updates the index (see "Enable / disable" below).

**Input** (any subset)
```json
{
  "description": "Fetches chronological transaction records for a customer with optional date range filters.",
  "requiredPermission": "MCP_GETCUSTOMERTRANSACTIONS",
  "status": "Active",
  "whenToUse": "Use this tool when the user asks for recent or historical transactions for an identified customer.",
  "whenNotToUse": "Do not use this tool for customer profile information or access-management questions.",
  "callSequence": "Call getCustomer first. Take customerId from its response and pass it here.",
  "sampleInputs": [
    { "id": "si-1", "name": "Last two weeks", "description": "Query transactions for the first two weeks of August", "payload": { "customerId": "C12345", "fromDate": "2026-08-01" } },
    { "name": "Single day", "description": "One day only", "payload": { "customerId": "C12345", "fromDate": "2026-08-05", "toDate": "2026-08-05" } }
  ],
  "sampleOutputs": [
    { "id": "so-1", "name": "Transactions found", "description": "Normal response with results", "type": "success", "payload": { "customerId": "C12345", "transactions": [] } }
  ]
}
```

| Field | UI action |
|---|---|
| `status` | Enable / disable a tool: the API Discovery page's enable toggle (send `Active` or `Disabled`). Not shown in the Configure Tool popup. |
| `description`, `requiredPermission` | "Description & Security" tab |
| `whenToUse`, `whenNotToUse`, `callSequence` | "AI Usage Guidance" tab |
| `sampleInputs` | "+ Add Sample Input" and the delete icon on the Sample Inputs tab. Also "Save as Sample Input" in the Test Tool popup. |
| `sampleOutputs` | "+ Add Sample Output" and the delete icon on the Sample Outputs tab. Also "Save as Sample Output" in the Test Tool popup. |

**Output:** `200` with the updated `{ "tool": {...} }` in the same shape as section 10 (including the recalculated `aiReadinessScore`), so the client can replace its copy of the tool, both in the popup and in the card list.

- **Samples are replaced as a whole list.** Send the complete `sampleInputs` / `sampleOutputs` array that should exist after the save; a sample left out is deleted, and `[]` clears the list. Existing samples keep their `id`; a new sample is sent **without** an `id` and gets one in the response. "Save as Sample ..." from the Test Tool popup does the same: take the tool's current list (section 10), add the new item and send the full list.
- Validation: `description` cannot be blank (the popup marks it required). `requiredPermission` may be blank, but then the governance layer has nothing to check, so the UI should warn. `whenToUse` / `whenNotToUse` / `callSequence` may be blank. Each sample needs a `name` and a `payload` that is a JSON object; `description` is optional; `type` must be one of the values in section 10 (a missing input type is stored as `success`, a missing output type as `success`).
- **Enable / disable:** `status` accepts only `Active` or `Disabled` (stored as `active` / `disabled`). `Needs Configuration` cannot be sent: it is not a stored status, only how section 8 shows an enabled tool that is not fully configured. Sending the current value again is safe. The response `status` is the same as in section 10, so an enabled tool may come back as `Needs Configuration`.
  - **Disabled** removes the tool from the MCP Tools list (section 8) and from the section 7 / section 12 tool counts, its vector is removed from Qdrant, and Run Test (section 9) answers `409`. Its saved configuration (samples, guidance, description) is kept, so nothing is lost when it is enabled again.
  - **Active** puts it back in the list and counts, and it is embedded into Qdrant again (best effort, same as section 2).
  - The PATCH still returns `200` with the tool after it is disabled, even though the list no longer contains it. The client should drop it from the MCP Tools list, and refresh the section 7 counts.
  - A tool can be enabled even if its MCP server is `Disabled` / `Maintenance`; it just cannot be executed until the server is active again (section 9 `409`).
- **Not accepted here:** `name`, `displayName`, `sourceEndpoint`, `httpMethod` and `serverId`. The API mapping is fixed when the server is generated (section 2). Sending any of them returns `400`. A `status` value other than `Active` / `Disabled` also returns `400`.
- Changing `description`, `whenToUse` or `whenNotToUse` also re-embeds the tool text into the vector DB (best effort, same as section 2; the embedded tool text also includes `whenToUse` / `whenNotToUse` from now on), otherwise search keeps using the old text.
- Errors: `404` with `{ "error": "MCP tool not found." }`; `400` with `{ "error": "..." }` or DRF field errors (same shapes as sections 1 and 2), e.g. `{ "sampleInputs": ["Sample 2: payload must be a JSON object."] }`.
- **The popup already checks that the JSON payload is valid** before adding a sample, so the server error is only a guard.
- On `/demo` this endpoint is never called; the popup keeps its changes in local state only.

---

# Dashboard page

## 12. Get Dashboard Summary

Feeds everything on the Dashboard that is hard-coded today: the five KPI cards, the "Apps ➔ Servers / N MCP Tools" line in the architecture diagram, the Knowledge Hub branch text, and the "Recent Platform Activity & Governance" list. One call on page load.

**Why a new endpoint:** the existing ones cover only part of it. Section 3 (`/api/mcp-servers`) and section 8 (`/api/mcp-tools`) return full lists, which is too heavy just to show counts, and section 7 (`/api/navigation/counts`) has no AI-ready or health numbers, no knowledge numbers and no activity. Rather than add a call per card, this is the single dashboard endpoint. The other dashboard bits (quick-launch scenarios, architecture text) are static UI copy and need no API.

**GET** `/api/dashboard`

**Tables touched:** read-only; `COUNT(*)` / `GROUP BY` queries only, no full lists are loaded. `projects_project` (`applications.total`, `applications.aiReady` via `is_ai_ready`, and `mcpServers` counts grouped by `mcp_health_status`), `tools_tool` (`mcpTools.total`, and `mcpTools.active` via `status = 'active'`), `auth_governance_accessrequest` (`pendingAccessRequests`, `status = 'pending'`). Knowledge sources and audit events have no tables yet, so `knowledge` and `recentActivity` are not backed by any table today.

**Output**
```json
{
  "applications": { "total": 5, "aiReady": 4 },
  "mcpServers": { "total": 5, "healthy": 4, "degraded": 1, "offline": 0 },
  "mcpTools": { "total": 42, "active": 39 },
  "pendingAccessRequests": 3,
  "knowledge": { "sources": 1284, "indexedDocuments": 24582 },
  "recentActivity": [
    {
      "id": "evt-101",
      "timestamp": "2026-09-19T14:05:00Z",
      "action": "Tool Call: getCustomerTransactions",
      "actor": "Case Management",
      "mcpServer": "Customer Transaction Portal MCP",
      "details": "Returned 3 transactions for customer C12345",
      "status": "SUCCESS"
    }
  ]
}
```

- Card mapping: Enterprise Applications = `applications.total` with "`aiReady` AI-Ready via MCP"; MCP Servers = `mcpServers.total`, and its trend line is built on the client from the health counts (e.g. "100% healthy" = `healthy / total`); MCP Tools = `mcpTools.total`; Pending Access Requests = `pendingAccessRequests`; Knowledge Sources = `knowledge.sources` with "`indexedDocuments` Indexed Docs".
- `applications.total` and `mcpServers.total` are the same number for now (one application = one MCP server, see the section 3 intro); they are kept separate so the two cards do not have to assume it.
- `mcpTools.total` and `mcpTools.active` are both the enabled tools (`status = 'active'`), the same number as `mcpTools` in section 7; disabled rows are discovered endpoints that were never enabled, and are not MCP tools yet.
- `recentActivity` is the 5 most recent audit events, newest first. It is not paginated; the full list belongs to the Audit page ("View Full Audit Log"), which will get its own list endpoint when that page gets real data. `status`: `SUCCESS` | `DENIED` | `CONFIG_UPDATED` | other values are shown with a neutral style. `timestamp` is ISO; the client formats it.
- **Partial data is fine.** Every block and every field is optional. The backend may leave out anything it cannot provide yet (today that is `knowledge` and `recentActivity`, which have no tables) or the whole call may fail. The client then falls back per value to what it counts from the lists it already loaded (same idea as section 7): `applications` / `mcpServers` / `mcpTools` from the loaded lists, `pendingAccessRequests` from section 7, `knowledge` from the knowledge source list and `recentActivity` from the audit list. An empty `recentActivity: []` is a real answer and shows "No recent activity".
- The old "94% AI context configured" card text is dropped because no such number is stored; the tools card shows "N active" instead.
- On `/demo` this endpoint is never called; the dashboard uses the static data.

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
| 8 | GET | `/api/mcp-tools` | MCP Tools page: tool cards |
| 9 | POST | `/api/mcp-tools/{id}/execute` | MCP Tools page: Run Test in the execution sandbox popup |
| 10 | GET | `/api/mcp-tools/{id}` | MCP Tools page: Configure Tool popup (samples, AI guidance, inputs, description, permission) |
| 11 | PATCH | `/api/mcp-tools/{id}` | MCP Tools page: Save Configuration (also "Save as Sample" from the Test Tool popup); API Discovery: enable / disable a tool |
| 12 | GET | `/api/dashboard` | Dashboard: KPI cards, knowledge line, recent activity |
