# Deriv Bot

## Overview

Deriv Bot, rebranded as KoriFx, is a web-based automated trading platform designed to allow users to create trading bots without coding. It utilizes a visual block-based programming interface (Blockly) to enable users to design, build from scratch, or import trading strategies. The platform integrates with the Deriv trading API for both demo and real trading accounts, providing real-time market data and order execution. KoriFx aims to provide an AI-powered trading automation experience, complete with community engagement features and an intuitive user interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript.
- **State Management**: MobX, using a root store pattern for centralized state.
- **UI/UX**: KoriFx branding with a dark theme, featuring cyan, purple, and neon green accents. Includes a custom animated loading screen, a community modal, and a persistent branded header with social links and a "Sign Up Free" CTA.
- **Charting**: `@deriv/deriv-charts` for market data visualization, with real-time updates during bot execution.
- **Visual Programming**: Blockly library for drag-and-drop bot strategy creation, with custom blocks for trading operations.
- **Internationalization**: `@deriv-com/translations` for multi-language support, loaded via CDN.
- **PWA Support**: Service worker for offline capabilities and installability.

### Backend & Integrations
- **Trading API**: `@deriv/deriv-api` for WebSocket-based communication with Deriv trading servers.
- **Authentication**: OAuth2-based flow with OIDC support, integrating with a Token Management Backend (TMB) and supporting multiple accounts.
- **Tick Collection**: A WebSocket collector service gathers real-time tick data for various markets, storing it in MongoDB Atlas.

### Build System
- **Bundler**: Vite 8 (rolldown-based).
- **Transpilation**: Babel, supporting decorators and class properties.

### System Design Choices
- **Modularity**: Stores are organized in `src/stores/`, promoting a clear separation of concerns.
- **Performance**: Optimized rendering with eager imports for critical components and reduced loading timeouts.
- **Error Handling**: Enhanced error tracking with TrackJS and robust error boundary implementations.

### Chart WebSocket Fix (May 2026)
- **Root cause**: App ID 89963 is a development/test app registered on `ws.derivws.com` (Deriv's test server). Replit URLs (e.g., `*.riker.replit.dev`) are not recognized as `localhost` by `isLocal()` and not matched by `isTestLink()`, so `getSocketURL()` fell back to `blue.derivws.com` (the demo account server) which rejects dev app IDs with immediate close (`readyState: 3`).
- **Fix 1** (`index.html`): Seeds `localStorage.setItem('config.server_url', 'ws.derivws.com')` and `localStorage.setItem('config.app_id', '89963')` unconditionally on every page load, ensuring any stale/wrong server URL from prior sessions is overwritten.
- **Fix 2** (`src/components/shared/utils/config/config.ts`): Updated `isTestLink()` to also recognize `*.replit.dev` and `*.replit.app` hostnames, so `getSocketURL()` and `getAppId()` correctly return the test server and test app ID for Replit environments.
- **Fix 3** (`src/external/bot-skeleton/services/api/chart-api.js`): Cleaned up the WebSocket open-wait Promise to use a single `settled` flag and `clearTimeout()`, eliminating the duplicate-resolve race condition that caused spurious "timeout" log warnings even when the socket opened successfully.
- **No credentials required**: No new environment variables or API keys needed. The fix is purely about using the correct Deriv WebSocket server for the registered app ID.

## External Dependencies

### Deriv Ecosystem Packages
- `@deriv-com/auth-client`
- `@deriv-com/analytics`
- `@deriv-com/quill-ui` / `@deriv-com/quill-ui-next`
- `@deriv-com/translations`
- `@deriv/deriv-api`
- `@deriv/deriv-charts`

### Cloud Services
- **Cloudflare Pages**: Deployment platform.
- **Google Drive API**: Bot strategy storage and synchronization.
- **MongoDB Atlas**: Database for tick collection and other data.
- **LiveChat**: Customer support.
- **Intercom**: In-app messaging (feature-flagged).
- **GrowthBook**: Feature flag management.
- **Survicate**: User surveys.

### Third-Party Libraries
- `blockly`: Visual programming library.
- `mobx` / `mobx-react-lite`: State management.
- `react-router-dom`: Client-side routing.
- `formik`: Form handling.
- `@tanstack/react-query`: Server state management.
- `js-cookie`: Cookie management.
- `localforage`: Client-side storage.
- `lz-string` / `pako`: Compression utilities.