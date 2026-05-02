import { generateDerivApiInstance } from './appId';

class ChartAPI {
    api;

    onsocketclose() {
        this.reconnectIfNotConnected();
    }

    init = async (force_create_connection = false) => {
        if (!this.api || force_create_connection) {
            if (this.api?.connection) {
                this.api.disconnect();
                this.api.connection.removeEventListener('close', this.onsocketclose.bind(this));
            }
            this.api = generateDerivApiInstance();

            // Wait for the WebSocket to be OPEN before resolving.
            // generateDerivApiInstance() returns synchronously with a CONNECTING socket;
            // callers that check api.connection.readyState immediately would get 0 (CONNECTING)
            // instead of 1 (OPEN), causing requestAPI calls to queue indefinitely.
            const conn = this.api?.connection;
            if (conn && conn.readyState !== 1) {
                await new Promise(resolve => {
                    if (conn.readyState === 1) return resolve();
                    const onOpen = () => resolve();
                    const onError = () => resolve(); // resolve on error too so we don't hang forever
                    conn.addEventListener('open', onOpen, { once: true });
                    conn.addEventListener('error', onError, { once: true });
                    // 10-second hard timeout so a failed connection doesn't block forever
                    setTimeout(() => {
                        conn.removeEventListener('open', onOpen);
                        conn.removeEventListener('error', onError);
                        resolve();
                    }, 10000);
                });
            }

            this.api?.connection.addEventListener('close', this.onsocketclose.bind(this));
        }
        this.getTime();
    };

    getTime() {
        if (!this.time_interval) {
            this.time_interval = setInterval(() => {
                this.api.send({ time: 1 });
            }, 30000);
        }
    }

    reconnectIfNotConnected = () => {
        // eslint-disable-next-line no-console
        console.log('chart connection state: ', this.api?.connection?.readyState);
        if (this.api?.connection?.readyState && this.api?.connection?.readyState > 1) {
            // eslint-disable-next-line no-console
            console.log('Info: Chart connection to the server was closed, trying to reconnect.');
            this.init(true);
        }
    };
}

const chart_api = new ChartAPI();

export default chart_api;
