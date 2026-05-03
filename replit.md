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

### Chart & Community Modal Fixes (May 2026)

#### Community Modal
- **Fix** (`src/components/community-modal/index.tsx`): Changed `useState(false)` to `useState(true)` and removed the `useEffect`/`sessionStorage` gate, so the modal now appears on every page reload instead of only once per browser session.

#### Chart Toolbar Icons (SVG Sprite)
- **Root cause**: `@deriv/deriv-charts` sets webpack public path `u.p = ""`, so its SVG sprite URL resolves to the page root. The sprite file `sprite-dd6387.smartcharts.svg` was missing from the `public/` folder.
- **Fix**: Copied `node_modules/@deriv/deriv-charts/dist/sprite-dd6387.smartcharts.svg` → `public/sprite-dd6387.smartcharts.svg` (625 KB). Toolbar icons (zoom, chart type, draw tools) now load correctly.

#### Chart Graph Not Rendering (React Effect Order Race Condition)
- **Root cause**: React runs child `useEffect` hooks **before** parent effects. The `Chart` component (child) had `isConnectionOpened = useState(true)` — hardcoded `true` — which told SmartCharts to start making API calls immediately. But `AppRoot` (parent) calls `api_base.init()` in its own `useEffect`, which runs **after** the chart's. So when SmartCharts called `requestAPI({active_symbols: 'brief'})`, `api_base.api` was still `null`, causing an immediate `Promise.reject`. SmartCharts received a failed promise on its first call and never retried, leaving the chart blank indefinitely.
- **Fix** (`src/pages/chart/chart.tsx`):
  1. Re-imported `chart_api` (the dedicated chart WebSocket connection) and added `getBestApi()` helper that prefers `chart_api.api` when open, falls back to `api_base.api`, then falls back to whichever exists.
  2. Replaced `isConnectionOpened = useState(true)` with a polling `useEffect` that checks `readyState === 1` every 300 ms. Once either `chart_api.api` or `api_base.api` reaches `readyState 1` (WebSocket open), it sets `isConnectionOpened = true`, which signals SmartCharts to begin loading. Hard 8-second timeout fallback in case of very slow connections.
  3. Simplified `requestAPI` to call `getBestApi().send(req)` directly — no complex active-symbols wait logic that could hang. DerivAPIBasic queues requests internally until the socket is open.
  4. Fixed `requestSubscribe` to clean up the previous `onMessage()` listener via `currentSubscriberRef` before creating a new subscription, preventing listener leaks on symbol change.

#### Flutter Chart Symbol Assets
- **Root cause**: `AssetManifest.json` listed 100+ symbol PNG icons (`packages/deriv_chart/assets/icons/symbols/*.png`) that were absent from the `public/js/smartcharts/chart/assets/packages/` directory. These files are not included in the npm package distribution. Vite's SPA fallback returned `index.html` (HTML) for every missing asset, causing Flutter's Dart runtime to throw a `FormatException` when trying to parse non-JSON content.
- **Fix**: Created transparent 1×1 placeholder PNGs for all 100 symbol icons plus `icon_placeholder.png` using Node.js, placed at `public/js/smartcharts/chart/assets/packages/deriv_chart/assets/icons/symbols/`. This eliminates the FormatException and allows the Flutter navigation widget to initialize.

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