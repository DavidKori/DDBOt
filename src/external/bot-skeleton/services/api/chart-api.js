import { generateDerivApiInstance } from './appId';

class ChartAPI {
    api;
    _boundOnSocketClose = this._onSocketClose.bind(this);

    _onSocketClose() {
        // eslint-disable-next-line no-console
        console.warn('[chart_api] socket closed, readyState:', this.api?.connection?.readyState);
        this.reconnectIfNotConnected();
    }

    init = async (force_create_connection = false) => {
        if (!this.api || force_create_connection) {
            if (this.api?.connection) {
                this.api.disconnect();
                this.api.connection.removeEventListener('close', this._boundOnSocketClose);
            }
            // eslint-disable-next-line no-console
            console.warn('[chart_api] creating new DerivAPIBasic instance…');
            this.api = generateDerivApiInstance();

            // Wait for the WebSocket to reach OPEN state (readyState 1).
            const conn = this.api?.connection;
            if (conn && conn.readyState !== 1) {
                await new Promise(resolve => {
                    if (conn.readyState === 1) return resolve();
                    let settled = false;
                    let timer;
                    const done = (label) => {
                        if (settled) return;
                        settled = true;
                        clearTimeout(timer);
                        conn.removeEventListener('open', onOpen);
                        conn.removeEventListener('error', onError);
                        // eslint-disable-next-line no-console
                        console.warn('[chart_api]', label, '— readyState:', conn.readyState);
                        resolve();
                    };
                    const onOpen = () => done('WebSocket OPEN ✓');
                    const onError = (e) => {
                        // eslint-disable-next-line no-console
                        console.warn('[chart_api] WebSocket error:', e);
                        done('WebSocket error — resolving anyway');
                    };
                    conn.addEventListener('open', onOpen, { once: true });
                    conn.addEventListener('error', onError, { once: true });
                    timer = setTimeout(() => done('WebSocket open timeout (10s)'), 10000);
                });
            } else {
                // eslint-disable-next-line no-console
                console.warn('[chart_api] WebSocket already OPEN on init');
            }

            this.api?.connection.addEventListener('close', this._boundOnSocketClose);
            // eslint-disable-next-line no-console
            console.warn('[chart_api] init complete, readyState:', this.api?.connection?.readyState);
        }
        this.getTime();
    };

    getTime() {
        if (!this.time_interval) {
            this.time_interval = setInterval(() => {
                if (this.api?.connection?.readyState === 1) {
                    this.api.send({ time: 1 });
                }
            }, 30000);
        }
    }

    reconnectIfNotConnected = () => {
        const rs = this.api?.connection?.readyState;
        // eslint-disable-next-line no-console
        console.warn('[chart_api] reconnectIfNotConnected — readyState:', rs);
        if (rs !== undefined && rs > 1) {
            // eslint-disable-next-line no-console
            console.warn('[chart_api] Reconnecting to server…');
            this.init(true);
        }
    };
}

const chart_api = new ChartAPI();

export default chart_api;
