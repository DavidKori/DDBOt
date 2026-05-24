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

- **Fix** (`src/components/community-modal/index.tsx`): Modal now uses `localStorage` key `korifx_community_dismissed` — shown only on first visit, dismissed permanently when the user clicks any button or "Maybe later".

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

### Chart Flutter Asset & Timing Fix (May 2026)

#### Flutter Chart Assets Missing

- **Root cause**: `@deriv/deriv-charts` bundles a Flutter-compiled Dart app (inside `smartcharts.js`) that uses `new URL("main.dart.js", document.baseURI)` to resolve its own assets. When the app runs at `/`, Flutter expects `main.dart.js`, `flutter.js`, `flutter_bootstrap.js`, `assets/AssetManifest.json`, `assets/FontManifest.json`, etc. to be served from `/`. These files are inside `node_modules/@deriv/deriv-charts/dist/chart/` but Vite's SPA fallback was returning `index.html` (HTML) for every missing asset, causing Flutter to throw `FormatException: SyntaxError: Unexpected token '<'`.
- **Fix**: Copied all Flutter chart files from `node_modules/@deriv/deriv-charts/dist/chart/` to `public/`: `main.dart.js` (2.3 MB), `flutter.js`, `flutter_bootstrap.js`, `flutter_service_worker.js`, `version.json`, `.last_build_id`, `assets/AssetManifest.{bin,bin.json,json}`, `assets/FontManifest.json`, `assets/fonts/` (IBMPlexSans, MaterialIcons), `assets/shaders/`, `canvaskit/canvaskit.js`. These are now served directly by Vite at the correct paths.

#### Chart WebSocket Timing Race

- **Root cause**: `chart.tsx` used an 8-second polling loop waiting for `api_base.init()` to complete before setting `isConnectionOpened=true`. But `api_base.init()` awaits a Firebase TMB check (~3s) + WebSocket auth handshake (~1s) + chart_api WebSocket (~1s) = can exceed 8s on Replit, causing SmartChart to timeout and stay blank.
- **Fix** (`src/pages/chart/chart.tsx`): Rewrote to call `chart_api.init()` directly in its own `useEffect`, bypassing `api_base` entirely. Sets `isConnectionOpened=true` as soon as the chart's own WebSocket reaches `readyState 1` (~1s). Added `getBestApi()` helper that prefers `chart_api.api` when open, falls back to `api_base.api`.

#### `onsocketclose` Listener Leak

- **Root cause**: `chart-api.js` used `.bind(this)` inline in both `addEventListener` and `removeEventListener` calls, which creates a new function reference each time. The `removeEventListener` call never matched the previously-added listener, causing stale close handlers to fire with wrong `readyState` readings.
- **Fix** (`src/external/bot-skeleton/services/api/chart-api.js`): Stored the bound handler as `_boundOnSocketClose = this._onSocketClose.bind(this)` at class-field initialization time; reused same reference for both add and remove. Also fixed `reconnectIfNotConnected` condition from `readyState && readyState > 1` (broken for `readyState=0` falsy) to `readyState !== undefined && readyState > 1`.

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
