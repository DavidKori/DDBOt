# Deriv Bot

## Overview

Deriv Bot is a web-based automated trading platform that allows users to create trading bots without coding. The application uses a visual block-based programming interface (powered by Blockly) to let users design trading strategies. Users can build bots from scratch, use quick strategies, or import existing bot configurations. The platform supports both demo and real trading accounts through the Deriv trading API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **React 18** with TypeScript as the primary UI framework
- **MobX** for state management across the application
- Stores are organized in `src/stores/` with a root store pattern that aggregates domain-specific stores (client, dashboard, chart, run-panel, etc.)

### Build System
- **Rsbuild** as the primary build tool (modern, fast bundler)
- Webpack configuration available as fallback
- Babel for transpilation with support for decorators and class properties

### Visual Programming
- **Blockly** library for the drag-and-drop bot building interface
- Custom blocks and toolbox configurations for trading-specific operations
- Workspace serialization for saving/loading bot strategies

### Trading Integration
- **@deriv/deriv-api** for WebSocket-based communication with Deriv trading servers
- Real-time market data streaming and order execution
- Support for multiple account types (demo, real, wallet-based)

### Authentication
- OAuth2-based authentication flow with OIDC support
- Token Management Backend (TMB) integration for enhanced session handling
- Multi-account support with account switching capabilities

### Charting
- **@deriv/deriv-charts** for displaying market data and trade visualizations
- Real-time chart updates during bot execution

### PWA Support
- Service worker for offline capabilities
- Installable as a Progressive Web App on mobile devices
- Offline fallback page

### Internationalization
- **@deriv-com/translations** for multi-language support
- CDN-based translation loading with Crowdin integration

### Analytics & Monitoring
- **RudderStack** for event tracking and analytics
- **Datadog** for session replay and performance monitoring
- **TrackJS** for error tracking in production

## External Dependencies

### Deriv Ecosystem Packages
- `@deriv-com/auth-client` - Authentication client
- `@deriv-com/analytics` - Analytics integration
- `@deriv-com/quill-ui` / `@deriv-com/quill-ui-next` - UI component library
- `@deriv-com/translations` - Internationalization
- `@deriv/deriv-api` - Trading API client
- `@deriv/deriv-charts` - Charting library

### Cloud Services
- **Cloudflare Pages** - Deployment platform
- **Google Drive API** - Bot strategy storage and sync
- **LiveChat** - Customer support integration
- **Intercom** - In-app messaging (feature-flagged)
- **GrowthBook** - Feature flag management
- **Survicate** - User surveys

### Third-Party Libraries
- `blockly` - Visual programming blocks
- `mobx` / `mobx-react-lite` - State management
- `react-router-dom` - Client-side routing
- `formik` - Form handling
- `@tanstack/react-query` - Server state management
- `js-cookie` - Cookie management
- `localforage` - Client-side storage
- `lz-string` / `pako` - Compression utilities

## Replit Migration (May 2026)

### Build System Change
- Migrated from Rsbuild to **Vite 8** (rolldown-based) as the build tool
- `vite.config.ts` — has `requireShimPlugin` that injects `window.require` shim for CJS deps like react/react-dom
- Added `<script type="module" src="/src/main.tsx">` to `index.html`

### Key Compatibility Fixes
- `@deriv-com/translations` **pinned to `"1.3.12"` exactly** — 1.4.x embeds React 19 internals incompatible with React 18
- `error-boundary.js` renamed to `error-boundary.jsx` so Rolldown parses JSX correctly
- `.npmrc` has `legacy-peer-deps=true`

### Dev Environment Adaptations (Replit-specific)
All changes below are Replit dev overrides — they do NOT affect production behavior:

**`index.html`** — pre-seeds `localStorage.setItem('is_tmb_enabled', 'false')` and `window.is_tmb_enabled = false` to bypass the Firebase remote-config fetch (unreachable from Replit sandbox), making the TMB check instant.

**`src/hooks/useStore.tsx`** — Store initialized synchronously via module-level singleton (`getOrCreateRootStore`) instead of `useEffect`, so `useStore()` never returns `null` on first render.

**`src/app/App.tsx`** — `Layout` and `AppRoot` converted from `lazy()` imports to eager imports, eliminating the top-level Suspense "Please wait while we connect to the server..." fallback.

**`src/app/app-root.tsx`** — Removed `is_api_initialized` loading gate; `api_base.init()` now fires in background without blocking render. AppContent is also an eager import.

**`src/app/app-content.jsx`** — `is_loading` starts as `false` (no initial loading spinner); removed `setIsLoading(true)` from the `is_api_initialized` effect; WebSocket fallback timeout reduced from 8 s → 500 ms; active-symbols timeout reduced from 10 s → 1 s.

**`src/components/layout/index.tsx`** — `isAuthenticating` starts as `false` (no false positive auth-spinner on load).

**`src/hooks/useTMB.ts`** — All three `fetch()` calls now have `AbortController` timeouts (3 s Firebase, 5 s sessions) so they never hang indefinitely.

### Result
The app renders fully in the browser preview within ~1 second of page load, showing the complete Deriv Bot dashboard with navigation tabs, "Load or build your bot" section, and the onboarding modal.

## KoriFx Branding & Backend (May 2026)

### App Identity
- Site rebranded as **KoriFx** — colors: cyan `#00d4ff`, purple `#7c3aed`, neon green `#10f593` on dark `#080d14`
- App ID set to **89963** (via `APP_IDS.LOCALHOST` in config.ts + pre-seeded in localStorage via index.html)
- `MONGODB_URI` and `APP_ID` set as env vars

### KoriFx Loading Screen (`src/components/korifx-loader/`)
- Full-screen animated loader with spinning rings, floating particles, grid background
- Animated progress bar (purple → cyan → green gradient)
- "AI-Powered Trading Automation" tagline, "powered by Deriv" text
- Auto-dismisses after reaching 100%, triggers community modal

### Community Modal (`src/components/community-modal/`)
- Shown once per user after first load (stored in `localStorage.korifx_community_shown`)
- Buttons for Telegram, WhatsApp, YouTube with branded colors
- Dismissible via "Maybe later" or clicking outside

### KoriFx Header (`src/components/korifx-header/`)
- Persistent 38px top bar above the Deriv nav: KoriFx brand name + "powered by Deriv"
- Social icons: Telegram, WhatsApp, YouTube
- "Sign Up Free →" CTA button for new users (no accounts), links to affiliate URL `https://track.deriv.com/_EOT66RdgchlMjdsyM5hasGNd7ZgqdRLk/1/`
- Added to `Layout` component above `AppHeader`

### Charts Fix
- Removed the 10-second forced timeout in `OfflineErrorBoundary` that was triggering false "Sorry for the interruption" errors when navigating to Charts

### MongoDB (requires Atlas IP whitelist)
- Backend connects to MongoDB Atlas if `MONGODB_URI` is set
- **Action required**: In MongoDB Atlas → Network Access → Add IP Address → Allow from anywhere (`0.0.0.0/0`) to unblock Replit's dynamic IP
- Falls back to in-memory store until IP is whitelisted

## Recent Changes

### Free Bots Feature (December 2025)
- Added Free Bots page with 12 pre-built trading bot templates
- Bot cards display with category filtering (Speed Trading, AI Trading, Pattern Analysis, etc.)
- Click-to-load functionality that imports bot XML into Bot Builder
- Responsive card design with hover effects and loading states
- Bot XML files stored in `/public/bots/` directory
- Files: `src/pages/free-bots/index.tsx`, `src/pages/free-bots/free-bots.scss`