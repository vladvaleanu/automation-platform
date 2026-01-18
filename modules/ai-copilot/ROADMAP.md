# Forge Module: Roadmap & Functional Specification

> **Goal**: Build "Forge", the Local Intelligent Infrastructure Operator.

## 0. Dependencies & Prerequisites

| Dependency | Version | Purpose |
|------------|---------|--------|
| Ollama | 0.4+ | Local LLM inference (Llama 3.1, Mistral, etc.) |
| PostgreSQL | 15+ | Database with pgvector extension |
| pgvector | 0.7+ | Vector similarity search for RAG |
| Redis | 7+ | Event bus, job queue (existing infra) |

**Optional:**
- `nomic-embed-text` or `mxbai-embed-large` models for embeddings

## 1. User Interface (Frontend) Specification

### A. The Command Center (Main Page)
**Path**: `/modules/ai-copilot` or `/ai-copilot`
**Layout**: Split-Pane (Vertical Split). Resizable.

#### Top Pane: "Situation Deck" (Live Alerts)
-   **View Modes**:
    1.  **Summary View** (Default): Cards represent *Incidents* (Groups of alerts).
    2.  **Expanded View**: Clicking an Incident reveals rows of *Raw Alerts*.
-   **Incident Card Fields**:
    -   `Severity Badge`: Critical (Red Pulse) / Warning (Yellow) / Info (Blue).
    -   `Title`: Auto-generated summary (e.g., "Multiple PDU Failure").
    -   `Impact`: "Affects 12 Racks, 3 Zones".
    -   `Duration`: "Active for 4m 20s".
    -   `Badge`: "Forge Analysis Available" (Icon).
    -   `Actions`: [Expand] [Chat with Forge] [Dismiss].

#### Bottom Pane: "Forge Workspace" (Chat)
-   **Header**:
    -   `Status`: "Connected (Ollama: Llama 3.1)" or "Offline".
    -   `Context Focus`: "Viewing Incident #124".
-   **Chat Stream**:
    -   **System Messages**: "Reading logs...", "Consulting SOP-102...".
    -   **Forge Messages**: Markdown supported. Code blocks for commands.
    -   **Strict Warnings**: Red border messages for SOP violations.
-   **Input Area**:
    -   `Text Field`: Supports free text and **Slash Commands** (e.g., `/clear`, `/status`, `/promote`).
    -   `Command Palette`: Auto-complete popup when `/` is typed.
    -   `Actions`: [Promote to Team] [Clear Context].

### B. Admin Dashboard (Knowledge & Approval)
**Path**: `/modules/ai-copilot/admin`
**Permission**: `ai_copilot:admin`

#### Tab 1: Knowledge Queue (Approvals)
-   **Review Queue**: Pending items waiting for approval.
-   **Conversation Audit Log**:
    *   *Admin Only View*: Searchable history of all user-Forge interactions.
    *   Filters: By User, date, or topic.
    *   Purpose: Compliance & oversight.

#### Tab 2: Settings (Configuration)
-   **Section 1: AI Brain (Generation)**
    -   *Safe to change anytime. Controls who "speaks".*
    -   `Provider Engine`: Dropdown [Ollama, LocalAI, OpenAI-Compatible].
    -   `API Endpoint`: Input (e.g., `http://localhost:11434/v1`).
    -   `Chat Model`: Input/Dropdown (e.g., `llama3.1`, `mistral-nemo`).
    -   `Context Window`: Number (Adjustable).
-   **Section 2: Long-Term Memory (Embeddings)**
    -   *Requires re-indexing if changed. Stored via pgvector.*
    -   `Embedding Provider`: Dropdown (Default: `Same as Generation` or `nomic-embed-text`).
    -   `Embedding Model`: Input (e.g., `nomic-embed-text`, `mxbai-embed-large`).
    -   `Vector Dimensions`: Auto-detected from model (e.g., 768 for nomic).
-   **Section 3: Personality & Strictness**
    -   `Persona Name`: Input (default: "Forge").
    -   `Strictness Level`: Slider (1=Helpful, 10=Military Strict).
    -   `Infrastructure Priority`: Checkboxes [X] Power [X] Cooling [ ] Access.
-   **Section 3: Alert Batching**
    -   `Batch Window`: Seconds (default: `30s`).
    -   `Min Alerts for Incident`: Number (default: `5`).

---

## 2. Backend Data Specification

### A. Database Schema (Prisma)

#### `AiConfig`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | |
| `provider` | String | 'ollama' |
| `baseUrl` | String | 'http://localhost:11434' |
| `model` | String | 'llama3.1' |
| `strictness` | Int | 1-10 (Default: 5 - Balanced Advisor) |
| `batchWindow` | Int | Seconds to wait before analyzing |

### B. Core Registry (Data Access)
Instead of importing implementation details, we use a **Tool Registry**.
Other modules (Power, Cooling) register "Read Tools" that Forge can call.
-   `copilot.registerTool('pdu:read', (pduId) => ...)`
-   *Efficiency*: Direct function calls, no HTTP overhead. Type-safe.

#### `TriggerRule` (The Filter)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | |
| `source` | String | 'consumption-monitor', 'access-control' |
| `condition` | String | JSON Logic or simple string match |
| `priority` | Enum | CRITICAL (Interrupt), STANDARD (Batch), LOG (Ignore) |
| `action` | Enum | PROMOTE_TO_DECK |

#### `KnowledgeItem` (The Brain)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | |
| `content` | Text | The "Lesson" or SOP snippet |
| `tags` | Json | `['pdu', 'rack-4']` |
| `status` | Enum | PENDING, APPROVED, REJECTED |
| `embedding` | Float[] | Vector embedding (requires **pgvector** extension) |

> **Note**: Embeddings require PostgreSQL with the `pgvector` extension enabled.
> Run: `CREATE EXTENSION IF NOT EXISTS vector;`

---

## 3. Phased Implementation Roadmap

### Phase 1: Visual Core (Week 1)
1.  **Scaffold**: Create `packages/frontend/src/modules/ai-copilot`.
2.  **Pages**:
    -   `MainPage.tsx` (Layout container).
    -   `SettingsPage.tsx` (Form with React Hook Form).
3.  **Components**:
    -   `SituationDeck.tsx`: Mock mapped list of incidents.
    -   `ChatWidget.tsx`: Mock chat stream styling.

> **✅ Done When:**
> - Split-pane layout renders at `/modules/ai-copilot`
> - Settings form saves to localStorage (mock persistence)
> - Incident cards display mock data with severity badges

---

### Phase 2: Backend Plumbing (Week 1-2)
1.  **Module**: `modules/ai-copilot` setup per `AI_DEVELOPMENT_GUIDE.md`.
2.  **DB**: Run Prisma migrations for the schema above + enable pgvector.
3.  **AI Service**: Implement `src/services/OllamaService.ts` *inside the module*.
    -   Ollama health check (`/api/tags` endpoint).
    -   Retry logic with exponential backoff (3 attempts).
    -   Graceful fallback: Queue messages when offline, process on reconnect.

> **✅ Done When:**
> - `GET /api/v1/m/ai-copilot/health` returns `{ status: 'ok', ollama: true/false }`
> - Settings save to `AiConfig` table and persist across restarts
> - Chat input sends message to Ollama and receives streamed response

---

### Phase 3: The Brain (Week 2-3)
1.  **Batching Logic**: Implement `AlertBatcherService`.
    -   Logic: "If >5 alerts share label 'Rack-1' within 30s -> Create Incident".
2.  **RAG**: Implement `KnowledgeService`.
    -   Function: "Find similar `KnowledgeItems` where status=APPROVED".

> **✅ Done When:**
> - Triggering 5+ mock alerts within 30s creates a single Incident card
> - Admin can approve a `KnowledgeItem` and it appears in RAG context
> - Chat responses cite relevant SOPs when applicable

---

### Phase 4: Polish (Week 4)
1.  **Strict Mode**: Implement the system prompt interceptor.
2.  **Error Handling**: "Ollama Disconnected" retry logic.

> **✅ Done When:**
> - Strictness slider (1-10) visibly changes Forge's tone in responses
> - Ollama disconnect shows "Reconnecting..." banner, auto-recovers
> - Full user flow works: Alert → Incident → Chat → Promote knowledge
