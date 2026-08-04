---
name: Deriv API auth requirement
description: Deriv API breaking changes — synthetic indices now require auth for streaming; trading_times is broken server-side.
---

## Rule
Deriv API (`wss://ws.derivws.com/websockets/v3`) now requires an authenticated WebSocket connection for:
- `ticks: 'R_100', subscribe: 1` → returns "InvalidSymbol" without auth
- `active_symbols: 'brief'` → returns `[]` without auth (no error, just empty)
- `trading_times: 'YYYY-MM-DD'` → returns `OutputValidationFailed` (Deriv server-side schema bug, ongoing)

`ticks_history: 'R_100'` still works without auth (historical data only).

**Why:** Deriv restricted real-time synthetic index streaming to authenticated sessions. The trading_times endpoint has a response schema bug on their side.

**How to apply:**
1. `chart-api.js` — call `this.api.authorize(token)` after socket opens if `V2GetActiveToken()` returns a token.
2. `chart.tsx getBestApi()` — prefer `api_base` when `is_authorized === true` (it authorizes on login).
3. `trading-times.js updateTradingTimes()` — wrap `ws.send()` in try/catch; DerivAPIBasic rejects on API errors, not resolves.
4. Backend `tick-collector.js` — use `DERIV_API_TOKEN` env var if set (auth → subscribe); otherwise fall back to `ticks_history` polling every 5s (works without auth).
5. Backend URL: canonical endpoint is `wss://ws.derivws.com` (old `ws.binaryws.com` still responds but is deprecated).
