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

    useEffect(() => {
        const isOpen = () =>
            chart_api?.api?.connection?.readyState === 1 ||
            (api_base as any)?.api?.connection?.readyState === 1;

        if (isOpen()) {
            // eslint-disable-next-line no-console
            console.log('[Chart] Connection already open on mount');
            setIsConnectionOpened(true);
            return;
        }

        // eslint-disable-next-line no-console
        console.log('[Chart] Polling for WebSocket connection…');
        const poll = setInterval(() => {
            if (isOpen()) {
                // eslint-disable-next-line no-console
                console.log('[Chart] Connection open — activating SmartChart');
                setIsConnectionOpened(true);
                clearInterval(poll);
            }
        }, 300);

        const timeout = setTimeout(() => {
            clearInterval(poll);
            // eslint-disable-next-line no-console
            console.log('[Chart] Connection timeout — activating SmartChart anyway');
            setIsConnectionOpened(true);
        }, 8000);

        return () => {
            clearInterval(poll);
            clearTimeout(timeout);
        };
    }, []);

    const requestAPI = (req: ServerTimeRequest | ActiveSymbolsRequest | TradingTimesRequest) => {
        const api = getBestApi();
        if (!api) return Promise.reject(new Error('Chart API not ready'));
        // eslint-disable-next-line no-console
        console.log('[Chart] requestAPI:', req);
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

            // eslint-disable-next-line no-console
            console.log('[Chart] requestSubscribe:', req);
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
            // eslint-disable-next-line no-console
            console.log('[Chart] requestSubscribe error:', (e as TError)?.error?.message, e);
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
                requestForgetStream={() => {}}
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
