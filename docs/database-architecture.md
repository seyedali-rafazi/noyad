# Local Database Infrastructure & Architecture

This document outlines the local database architecture, layer boundaries, and persistence characteristics for the AI-powered Persian daily planner.

---

## 1. Architectural Boundaries

To ensure testability, maintainability, and clean separation of concerns, the application strictly separates data storage from business logic and UI presentation.

```
+-------------------------------------------------------------------+
|                        Expo Router UI / Routes                    |
|                        (app/ & feature UI screens)                |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                        Domain Services Layer                      |
|                  (Business rules, Persian date math)              |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                        Repositories Layer                         |
|                    (Typed Drizzle query methods)                  |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|               Centralized Database Client & Migrator              |
|        (Expo SQLite, PRAGMA WAL/foreign_keys, Drizzle ORM)        |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                 Operating System Application Sandbox              |
|                    (ai_calender.db on flash storage)              |
+-------------------------------------------------------------------+
```

### Layer Responsibilities

1. **Database Initialization (`src/core/database/client.ts`)**:
   - Manages connection lifecycle via `initializeDatabase()`, `getDatabase()`, `getExpoDatabase()`, and `closeDatabase()`.
   - Enforces a strict singleton pattern to eliminate duplicate connections and file lock contention.
   - Applies SQLite runtime pragmas (`PRAGMA journal_mode = WAL;` and `PRAGMA foreign_keys = ON;`).
   - Encapsulates native errors into typed `DatabaseInitializationError`.

2. **Schema Definitions (`src/core/database/schema/`)**:
   - Houses declarative Drizzle ORM table, relation, and type declarations.
   - Completely agnostic of runtime queries, UI screens, or network logic.
   - All future tables (tasks, notes, chat history) will reside in dedicated modules here and re-exported from `schema/index.ts`.

3. **Migration Management (`src/core/database/migrations/` & `src/core/database/migrator.ts`)**:
   - Manages schema evolution and migrations versioning.
   - `drizzle.config.ts` targets `src/core/database/schema/index.ts` and outputs SQL to `src/core/database/migrations/`.
   - `applyMigrations()` programmatically runs pending migrations inside a transaction and updates `__drizzle_migrations`.

4. **Future Repositories (To be implemented in feature modules)**:
   - Encapsulate data access operations (queries, inserts, updates, deletes) using the typed `db` instance.
   - Shields the rest of the application from SQL syntax and query construction.
   - Avoids ad-hoc abstractions; implements direct, typed functions per domain entity.

5. **Future Domain Services (To be implemented in feature modules)**:
   - Orchestrates multi-step business logic, conflict resolution, calendar transformations (Gregorian <-> Jalali), and notification scheduling.
   - Consumes repositories; never interacts with raw SQL or native database handles directly.

6. **UI & Route Boundaries (`app/` & UI components)**:
   - Routes and components must **never** import `expo-sqlite` or write direct queries.
   - Presentation layers interact exclusively through domain hooks or services.

---

## 2. Local Persistence & Sandbox Specifications

### Sandbox Location
- On iOS: Stored in the application's sandboxed `NSDocumentDirectory` (`Documents/SQLite/ai_calender.db`).
- On Android: Stored in the application's private internal storage (`/data/data/<package_name>/databases/ai_calender.db`).
- File access is strictly isolated by the mobile operating system sandbox, preventing unauthorized cross-app access.

### Persistence Guarantees
- **App Restarts**: Data is written directly to non-volatile device flash storage. Write-Ahead Logging (WAL) ensures transactional durability (ACID compliance) across unexpected terminations and system reboots.
- **No Automatic Synchronization**: The database is strictly local-first and on-device. No background network synchronization or telemetry is executed.
- **App Uninstall**: If the user uninstalls the application, the mobile operating system removes the application sandbox, permanently deleting `ai_calender.db` and associated WAL files (`-wal`, `-shm`).
- **Future Backup & Export**: Because data is sandboxed and uninstalls purge files, a future phase must implement a secure, user-initiated local file export/import mechanism (e.g. encrypted JSON/SQLite backup) for device migration and data portability.

---

## 3. Persian-First & Temporal Rules

- **Timestamp Storage**: All database timestamps must be stored as **UTC ISO 8601 strings** (`YYYY-MM-DDTHH:mm:ss.sssZ`) or epoch integers.
- **No Localized Strings in Database**: Localized Jalali representations (e.g., `"۱۴۰۴/۰۱/۰۱"`) must **never** be stored as canonical date/time records.
- **Presentation Formatting**: Conversion from UTC to Jalali via `date-fns-jalali` occurs strictly at the presentation boundary when rendering dates in UI components.
