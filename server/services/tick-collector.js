const WebSocket = require('ws');
const mongoose = require('mongoose');

const APP_ID = process.env.APP_ID || '89963';
// Optional: set DERIV_API_TOKEN in your environment to enable real-time tick
// subscriptions.  Without it the collector falls back to polling ticks_history
// every POLL_INTERVAL_MS milliseconds (works without authentication).
const DERIV_API_TOKEN = process.env.DERIV_API_TOKEN || '';
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;
const POLL_INTERVAL_MS = 5000; // 5-second poll when no auth token

// R_10/R_25/R_50/R_75/R_100 were retired by Deriv — use 1HZ* equivalents instead.
const VOLATILITY_SYMBOLS = [
    { symbol: '1HZ10V',   name: 'Volatility 10 (1s) Index' },
    { symbol: '1HZ25V',   name: 'Volatility 25 (1s) Index' },
    { symbol: '1HZ50V',   name: 'Volatility 50 (1s) Index' },
    { symbol: '1HZ75V',   name: 'Volatility 75 (1s) Index' },
    { symbol: '1HZ100V',  name: 'Volatility 100 (1s) Index' },
    { symbol: 'BOOM300N', name: 'Boom 300 Index' },
    { symbol: 'BOOM500',  name: 'Boom 500 Index' },
    { symbol: 'BOOM1000', name: 'Boom 1000 Index' },
    { symbol: 'CRASH300N',name: 'Crash 300 Index' },
    { symbol: 'CRASH500', name: 'Crash 500 Index' },
    { symbol: 'CRASH1000',name: 'Crash 1000 Index' },
];

let Tick = null;
let memory = null;

const getStore = () => {
    if (mongoose.connection.readyState === 1) {
        if (!Tick) Tick = require('../models/Tick');
        return { type: 'mongo', model: Tick };
    }
    if (!memory) memory = require('../store/memory');
    return { type: 'memory', store: memory };
};

const saveTick = async (tick) => {
    try {
        const { type, model, store } = getStore();
        if (type === 'mongo') {
            await model.create(tick);
        } else {
            store.add(tick);
        }
    } catch (err) {
        // silently ignore duplicate key errors
        if (err.code !== 11000) {
            console.error(`[TickCollector] Save error (${tick.symbol}):`, err.message);
        }
    }
};

class SymbolCollector {
    constructor(symbol, name) {
        this.symbol = symbol;
        this.name = name;
        this.ws = null;
        this.reconnect_timer = null;
        this.poll_timer = null;
        this.running = false;
        this.tick_count = 0;
        this.reconnect_delay = 3000;
    }

    start() {
        this.running = true;
        this._connect();
    }

    stop() {
        this.running = false;
        if (this.reconnect_timer) clearTimeout(this.reconnect_timer);
        if (this.poll_timer) clearTimeout(this.poll_timer);
        if (this.ws) {
            this.ws.terminate();
            this.ws = null;
        }
    }

    _connect() {
        if (!this.running) return;

        try {
            this.ws = new WebSocket(WS_URL);
        } catch (err) {
            console.error(`[TickCollector] WS create error (${this.symbol}):`, err.message);
            this._scheduleReconnect();
            return;
        }

        this.ws.on('open', () => {
            this.reconnect_delay = 3000;

            if (DERIV_API_TOKEN) {
                // Authenticate first; the 'authorize' response handler will subscribe
                this.ws.send(JSON.stringify({ authorize: DERIV_API_TOKEN }));
            } else {
                // No token: use ticks_history polling (works without auth)
                console.log(`[TickCollector] No DERIV_API_TOKEN — polling ticks_history for ${this.symbol}`);
                this._schedulePoll(0);
            }
        });

        this.ws.on('message', async (raw) => {
            try {
                const msg = JSON.parse(raw.toString());

                if (msg.error) {
                    console.warn(`[TickCollector] API error (${this.symbol}): ${msg.error.message}`);
                    // On InvalidToken / auth error, fall back to polling
                    if (msg.msg_type === 'authorize') {
                        console.warn(`[TickCollector] Auth failed for ${this.symbol}, falling back to polling`);
                        this._schedulePoll(0);
                    }
                    return;
                }

                if (msg.msg_type === 'authorize') {
                    // Auth succeeded — now subscribe to real-time ticks
                    console.log(`[TickCollector] Authorized → subscribing to ${this.symbol}`);
                    this.ws.send(JSON.stringify({ ticks: this.symbol, subscribe: 1 }));
                    return;
                }

                if (msg.msg_type === 'tick' && msg.tick) {
                    const { symbol, epoch, quote, ask, bid, pip_size } = msg.tick;
                    this.tick_count++;
                    await saveTick({
                        symbol,
                        price: quote,
                        epoch,
                        pip_size: pip_size || 0,
                        ask: ask || quote,
                        bid: bid || quote,
                    });

                    if (this.tick_count % 100 === 0) {
                        console.log(`[TickCollector] ${symbol}: ${this.tick_count} ticks stored`);
                    }
                    return;
                }

                // ticks_history poll response
                if (msg.msg_type === 'history' && msg.history) {
                    const { prices, times } = msg.history;
                    if (prices && prices.length > 0) {
                        const latest_idx = prices.length - 1;
                        await saveTick({
                            symbol: this.symbol,
                            price: prices[latest_idx],
                            epoch: times[latest_idx],
                            pip_size: 0,
                            ask: prices[latest_idx],
                            bid: prices[latest_idx],
                        });
                        this.tick_count++;
                    }
                    // Schedule next poll
                    this._schedulePoll(POLL_INTERVAL_MS);
                }
            } catch (err) {
                console.error(`[TickCollector] Parse error (${this.symbol}):`, err.message);
            }
        });

        this.ws.on('error', (err) => {
            console.warn(`[TickCollector] WS error (${this.symbol}): ${err.message}`);
        });

        this.ws.on('close', () => {
            if (this.poll_timer) {
                clearTimeout(this.poll_timer);
                this.poll_timer = null;
            }
            if (this.running) {
                this._scheduleReconnect();
            }
        });
    }

    _schedulePoll(delay) {
        if (!this.running) return;
        if (this.poll_timer) clearTimeout(this.poll_timer);
        this.poll_timer = setTimeout(() => this._doPoll(), delay);
    }

    _doPoll() {
        if (!this.running || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({
            ticks_history: this.symbol,
            count: 1,
            end: 'latest',
            style: 'ticks',
        }));
    }

    _scheduleReconnect() {
        if (!this.running) return;
        this.reconnect_timer = setTimeout(() => this._connect(), this.reconnect_delay);
        this.reconnect_delay = Math.min(this.reconnect_delay * 1.5, 30000);
    }

    getStats() {
        return {
            symbol: this.symbol,
            name: this.name,
            connected: this.ws?.readyState === WebSocket.OPEN,
            tick_count: this.tick_count,
            mode: DERIV_API_TOKEN ? 'subscribe' : 'poll',
        };
    }
}

class TickCollector {
    constructor() {
        this.collectors = new Map();
        this.started = false;
    }

    start() {
        if (this.started) return;
        this.started = true;
        const mode = DERIV_API_TOKEN ? 'authenticated subscription' : 'unauthenticated ticks_history polling';
        console.log(`[TickCollector] Starting — tracking ${VOLATILITY_SYMBOLS.length} markets (app_id=${APP_ID}, mode=${mode})`);

        VOLATILITY_SYMBOLS.forEach(({ symbol, name }) => {
            const collector = new SymbolCollector(symbol, name);
            this.collectors.set(symbol, collector);
            // stagger connections by 300ms each to avoid API rate limits
            setTimeout(() => collector.start(), this.collectors.size * 300);
        });
    }

    stop() {
        this.collectors.forEach(c => c.stop());
        this.collectors.clear();
        this.started = false;
        console.log('[TickCollector] Stopped all collectors');
    }

    stats() {
        return [...this.collectors.values()].map(c => c.getStats());
    }
}

module.exports = new TickCollector();
