# Domain Layer & Application Contracts Architecture

This document specifies the domain models, business invariants, application operation contracts, safety policies, and architectural layer boundaries for the Persian-first, AI-powered daily planner.

---

## 1. Architectural Boundaries & Module Organization

The application enforces a strict unidirectional dependency graph:

```
+-------------------------------------------------------------------------+
|                              Features Layer                             |
|              (src/features/*: UI, React components, state stores)       |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                            Application Layer                            |
|     (src/application/*: Operations, Confirmation Policies, Ports, AI)  |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                              Domain Layer                               |
|        (src/domain/*: Entities, Business Invariants, Error Model)      |
+-------------------------------------------------------------------------+
                                     ^
                                     |
+-------------------------------------------------------------------------+
|                            Core Infrastructure                          |
|         (src/core/database/*: SQLite, Drizzle ORM, Migrations)          |
|         (src/core/ai/*: Raw Prompts, LLM Provider Clients)              |
+-------------------------------------------------------------------------+
```

### Module Responsibilities

1. **`src/domain/`**:
   - Pure domain models (`Task`, `Note`, `Conversation`, `Message`).
   - Business invariants (e.g. title length limits, task state machine transitions, `completedAt` timestamp synchronization).
   - Domain errors and structured error models (`ValidationError`, `NotFoundError`, `ConflictError`, `DatabaseError`, `AiValidationFailureError`, `AmbiguousRequestError`).
   - **Zero dependencies** on React Native, SQLite, Drizzle, or network libraries.

2. **`src/application/`**:
   - Operation contracts for all primary actions (`create_task`, `update_task`, `complete_task`, `delete_task`, `create_note`, `update_note`, `delete_note`, `list_tasks`).
   - Common `OperationResult<T>` discriminated union (`success`, `failure`, `requiresConfirmation`).
   - Destructive operation safety barrier (`ConfirmationPolicy`, `ConfirmationRequest`).
   - Untrusted AI payload validation and sanitization contracts.
   - Persistence repository interfaces (`ITaskRepository`, `INoteRepository`, `IConversationRepository`).

3. **`src/core/database/`**:
   - SQLite singleton connection management, PRAGMAs (`WAL`, `foreign_keys`).
   - Drizzle ORM schema and migration engine.
   - Converts between raw `*Record` database schemas and domain models.

4. **`src/core/ai/`**:
   - Future client wrappers, system prompt definitions, and LLM orchestration.
   - Emits raw candidates that must pass through `src/application/ai/contracts.ts` before execution.

5. **`src/features/`**:
   - Future UI presentation components, Zustand stores, screens, and localized views.

---

## 2. Four-Tier Model Distinction

To prevent leakages across persistence, business logic, AI, and presentation, four distinct representations exist:

| Tier | Module Location | Characteristics | Example |
| :--- | :--- | :--- | :--- |
| **Domain Model** | `src/domain/models/` | Immutable, camelCase, rich business rules, UTC ISO timestamps | `Task` (`dueDate: "2026-10-15T12:00:00.000Z"`) |
| **Database Record** | `src/domain/types/database.ts` | Relational SQLite storage, integer booleans (`0 \| 1`), JSON text strings, snake_case | `TaskRecord` (`is_all_day: 0`, `due_date`) |
| **AI Operation Payload** | `src/application/ai/contracts.ts` | **Untrusted candidate** output from LLMs; contains confidence scores, prompt wrappers, unconfirmed flags | `UntrustedAiTaskPayload` (`title: "تسک: «جلسه»"`) |
| **UI Presentation Model** | `src/domain/types/presentation.ts` | Formatted for Persian RTL display: Jalali dates via `date-fns-jalali`, Persian numerals, color tokens | `TaskPresentationModel` (`formattedJalaliDueDate: "۱۴۰۵/۰۷/۲۴"`) |

---

## 3. Persian-First & Temporal Rules

1. **Storage Rule**:
   - All database timestamps and domain timestamps are **strictly stored as UTC ISO 8601 strings** (`YYYY-MM-DDTHH:mm:ss.sssZ`).
   - Localized Jalali strings (e.g. `"۱۴۰۵/۰۷/۲۴"`) or Persian numerals are explicitly rejected by storage validators.
2. **Presentation Rule**:
   - Jalali conversion, Persian numeral formatting, and relative time labels (`"امروز"`, `"فردا"`) are computed strictly in UI presentation selectors.
3. **Timezone Preservation**:
   - Tasks optionally store the scheduling timezone (e.g., `'Asia/Tehran'`) to ensure consistent reminders across daylight saving or travel.

---

## 4. Application Operations & Contracts

Each operation defines an explicit input type and result type:

### Task Operations
- **`create_task`**: Accepts `CreateTaskInput`, produces `OperationResult<Task>`.
- **`update_task`**: Accepts `UpdateTaskInput` (requires target `id`), produces `OperationResult<Task>`.
- **`complete_task`**: Accepts `CompleteTaskInput` (requires target `id`), synchronizes `completedAt`, produces `OperationResult<Task>`.
- **`delete_task`**: Accepts `DeleteTaskInput` (requires target `id`, supports `confirmed: boolean`), produces `OperationResult<{ id: string; deleted: true }>`.
- **`list_tasks`**: Accepts `ListTasksInput` (filtering by status/priority/date range, sorting, pagination), produces `OperationResult<ListTasksOutput>`.

### Note Operations
- **`create_note`**: Accepts `CreateNoteInput`, normalizes tags, produces `OperationResult<Note>`.
- **`update_note`**: Accepts `UpdateNoteInput` (requires target `id`), produces `OperationResult<Note>`.
- **`delete_note`**: Accepts `DeleteNoteInput` (requires target `id`, supports `confirmed: boolean`), produces `OperationResult<{ id: string; deleted: true }>`.

---

## 5. Destructive Operations & Confirmation Policy

Permanent deletions and AI-generated destructive mutations cannot execute blindly:
1. When `delete_task` or `delete_note` is invoked without `confirmed: true`, the operation yields:
   ```typescript
   {
     success: false,
     requiresConfirmation: true,
     confirmation: {
       token: "conf_...",
       actionType: "delete_task",
       targetTitle: "جلسه هیئت مدیره",
       promptPersian: "آیا از حذف تسک «جلسه هیئت مدیره» اطمینان دارید؟",
       severity: "critical"
     }
   }
   ```
2. AI-initiated destructive actions **always** require confirmation regardless of parameters.
3. Once the user confirms the action via modal/sheet, the UI passes `confirmed: true` to proceed.

---

## 6. Error Contracts

The system uses 6 explicit error types with typed details and factory functions:

1. **`VALIDATION_ERROR`**: Field-level validation violations with path, message, code, and received value.
2. **`NOT_FOUND`**: Missing entity with `entityType` and `entityId`.
3. **`CONFLICT`**: Concurrency collision, duplicate entity, or illegal state machine transition.
4. **`DATABASE_ERROR`**: SQLite I/O failure, disk full, or constraint violation.
5. **`AI_VALIDATION_FAILURE`**: Malformed or unparseable AI candidate payload.
6. **`AMBIGUOUS_REQUEST`**: Natural language query matching multiple candidate records, providing a localized clarification prompt.
