import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import { useStore } from '@/hooks/useStore';
import {
    ActiveSymbolsRequest,
    ServerTimeRequest,
    TicksHistoryResponse,
    TicksStreamRequest,
    TradingTimesRequest,
} from '@deriv/api-types';
import { ChartTitle, SmartChart } from '@deriv/deriv-charts';
import { useDevice } from '@deriv-com/ui';
import ToolbarWidgets from './toolbar-widgets';
import '@deriv/deriv-charts/dist/smartcharts.css';

type TError = null | {
    error?: {
        code?: string;
        message?: string;
    };
};

/** Return whichever DerivAPIBasic connection is currently OPEN, or fall back to
 *  whichever is instantiated so at least requests can be queued. */
const getBestApi = () => {
    if (chart_api?.api?.connection?.readyState === 1) return chart_api.api;
    if ((api_base as any)?.api?.connection?.readyState === 1) return (api_base as any).api;
    return chart_api?.api ?? (api_base as any)?.api ?? null;
};

const Chart = observer(({ show_digits_stats }: { show_digits_stats: boolean }) => {
    const barriers: [] = [];
    const { common, ui } = useStore();
    const { chart_store, run_panel, dashboard } = useStore();
    const [isSafari, setIsSafari] = useState(false);
    const [is_connection_opened, setIsConnectionOpened] = useState(false);
    const currentSubscriberRef = useRef<{ unsubscribe?: () => void } | null>(null);

    const {
        chart_type,
        getMarketsOrder,
        granularity,
        onSymbolChange,
        setChartStatus,
        symbol,
        updateChartType,
        updateGranularity,
        updateSymbol,
        setChartSubscriptionId,
        chart_subscription_id,
    } = chart_store;
    const chartSubscriptionIdRef = useRef(chart_subscription_id);
    const { isDesktop, isMobile } = useDevice();
    const { is_drawer_open } = run_panel;
    const { is_chart_modal_visible } = dashboard;

    const settings = {
        assetInformation: false,
        countdown: true,
        isHighestLowestMarkerEnabled: false,
        language: common.current_language.toLowerCase(),
        position: ui.is_chart_layout_default ? 'bottom' : 'left',
        theme: ui.is_dark_mode_on ? 'dark' : 'light',
    };

    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        setIsSafari(ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1 && ua.indexOf('android') === -1);

        return () => {
            currentSubscriberRef.current?.unsubscribe?.();
            chart_api.api?.forgetAll?.('ticks');
        };
    }, []);

    useEffect(() => {
        chartSubscriptionIdRef.current = chart_subscription_id;
    }, [chart_subscription_id]);

    useEffect(() => {
        if (!symbol) updateSymbol();
    }, [symbol, updateSymbol]);

    /**
     * Bootstrap the chart's own WebSocket independently of api_base so we
     * don't block on the Firebase TMB check (which can take up to 3 s) or the
     * api_base authorisation handshake.  chart_api.init() resolves once the
     * socket reaches readyState 1.
     */
    useEffect(() => {
        let cancelled = false;

        const initChartConnection = async () => {
            try {
                await chart_api.init();
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('[Chart] chart_api.init() error:', e);
            }

            if (!cancelled) {
                setIsConnectionOpened(true);
            }
        };

        // If the connection is already open (e.g. api_base initialised first),
        // skip the async wait and activate immediately.
        if (chart_api?.api?.connection?.readyState === 1) {
            setIsConnectionOpened(true);
            return;
        }

        initChartConnection();

        return () => {
            cancelled = true;
        };
    }, []);

    const requestAPI = (req: ServerTimeRequest | ActiveSymbolsRequest | TradingTimesRequest) => {
        const api = getBestApi();
        if (!api) return Promise.reject(new Error('Chart API not ready'));
        return api.send(req);
    };

    const requestForgetStream = (subscription_id: string) => {
        if (subscription_id) {
            const api = getBestApi();
            api?.forget?.(subscription_id);
        }
    };

    const requestSubscribe = async (req: TicksStreamRequest, callback: (data: any) => void) => {
        const api = getBestApi();
        if (!api) return;
        try {
            if (chartSubscriptionIdRef.current) {
                requestForgetStream(chartSubscriptionIdRef.current);
            }
            currentSubscriberRef.current?.unsubscribe?.();
            currentSubscriberRef.current = null;

            const response = await api.send(req);
            const sub_id = response?.subscription?.id;
            setChartSubscriptionId(sub_id);

            if (response) callback(response);

            if (req.subscribe === 1 && sub_id) {
                const subscriber = api
                    .onMessage()
                    ?.subscribe(({ data }: { data: TicksHistoryResponse }) => {
                        const msg_sub_id = (data as any)?.subscription?.id;
                        if (msg_sub_id === sub_id) {
                            callback(data);
                        }
                    });
                currentSubscriberRef.current = subscriber ?? null;
            }
        } catch (e) {
            if ((e as TError)?.error?.code === 'MarketIsClosed') callback([]);
        }
    };

    const display_symbol = symbol || 'R_100';

    return (
        <div
            className={classNames('dashboard__chart-wrapper', {
                'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
                'dashboard__chart-wrapper--safari': isSafari,
            })}
            dir='ltr'
        >
            <SmartChart
                id='dbot'
                barriers={barriers}
                showLastDigitStats={show_digits_stats}
                chartControlsWidgets={null}
                enabledChartFooter={false}
                chartStatusListener={(v: boolean) => setChartStatus(!v)}
                toolbarWidget={() => (
                    <ToolbarWidgets
                        updateChartType={updateChartType}
                        updateGranularity={updateGranularity}
                        position={!isDesktop ? 'bottom' : 'top'}
                        isDesktop={isDesktop}
                    />
                )}
                chartType={chart_type}
                isMobile={isMobile}
                enabledNavigationWidget={isDesktop}
                granularity={granularity}
                requestAPI={requestAPI}
                requestForget={() => {}}
                requestForgetStream={requestForgetStream}
                requestSubscribe={requestSubscribe}
                settings={settings}
                symbol={display_symbol}
                topWidgets={() => <ChartTitle onChange={onSymbolChange} />}
                isConnectionOpened={is_connection_opened}
                getMarketsOrder={getMarketsOrder}
                isLive
                leftMargin={80}
            />
        </div>
    );
});

export default Chart;
