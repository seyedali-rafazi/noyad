# Architectural Conventions & RTL Guidelines

## 1. Persian-First & RTL Architecture

### Planned RTL Configuration Approach

When presentation screens and UI components are developed:

1. **RTL Native Configuration**:
   Use React Native's `I18nManager.allowRTL(true)` combined with `expo-localization` to detect user locale and enable RTL layout on native components.
   ```typescript
   import { I18nManager } from 'react-native';
   // When initializing Persian locale UI:
   // I18nManager.allowRTL(true);
   // I18nManager.forceRTL(isPersian);
   ```
2. **Layout Primitives**:
   - Prefer logical style properties: `paddingStart`, `paddingEnd`, `marginStart`, `marginEnd` over physical `left`/`right`.
   - Align text using contextual or explicit alignment (`textAlign: 'right'` for Persian content).
   - Use Persian-friendly typography with fallback fonts for Persian numerals and Persian glyphs.
3. **Current Phase Boundary**:
   RTL is NOT globally forced in this phase because the application contains no UI or screens yet.

### Date & Time Strategy

- **Database & Storage**:
  - **NEVER** store localized Jalali strings (e.g. `"۱۴۰۴/۰۱/۰۱"`) as timestamps or database fields.
  - All database timestamps must be stored as **UTC ISO 8601 strings** (`YYYY-MM-DDTHH:mm:ss.sssZ`) or epoch milliseconds/seconds.
  - Store user timezone explicitly alongside scheduled items (e.g., `'Asia/Tehran'`).
- **Formatting**:
  - Jalali conversion and Persian numeral formatting via `date-fns-jalali` must happen strictly at the presentation boundary when rendering dates to the user.

---

## 2. Architectural Boundaries & Conventions

### Layer Isolation

- **`app/`**: Expo Router routes and layouts only. Contains zero business logic, zero direct database access, and zero external API calls.
- **`src/features/<feature>/`**: Feature-specific application logic, domain models, and UI components.
- **`src/core/database/`**: Isolated local database layer. Screens and components must not execute ad-hoc raw SQL; all queries must go through dedicated domain accessors.
- **`src/core/ai/`**: Future AI prompts, client wrappers, and structured output validators.
- **`src/shared/`**: Common, domain-agnostic UI primitives, hooks, and helpers.

### Security & Privacy

- The application is local-first. All data resides in `expo-sqlite` on the user's device.
- No AI secrets or remote API tokens are bundled into the client build. Future AI integrations must use on-device processing or secure proxy configurations.
