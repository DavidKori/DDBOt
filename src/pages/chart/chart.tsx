import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton';
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

type TSubscription = {
    [key: string]: null | {
        unsubscribe?: () => void;
    };
};

type TError = null | {
    error?: {
        code?: string;
        message?: string;
    };
};

const subscriptions: TSubscription = {};

const Chart = observer(({ show_digits_stats }: { show_digits_stats: boolean }) => {
    const barriers: [] = [];
    const { common, ui } = useStore();
    const { chart_store, run_panel, dashboard } = useStore();
    const [isSafari, setIsSafari] = useState(false);

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
        const isSafariBrowser = () => {
            const ua = navigator.userAgent.toLowerCase();
            return ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1 && ua.indexOf('android') === -1;
        };
        setIsSafari(isSafariBrowser());

        return () => {
            (api_base as any).api?.forgetAll?.('ticks');
        };
    }, []);

    useEffect(() => {
        chartSubscriptionIdRef.current = chart_subscription_id;
    }, [chart_subscription_id]);

    useEffect(() => {
        if (!symbol) updateSymbol();
    }, [symbol, updateSymbol]);

    const requestAPI = (req: ServerTimeRequest | ActiveSymbolsRequest | TradingTimesRequest) => {
        const api = (api_base as any)?.api;
        if (!api) {
            const error = new Error('API not ready');
            return Promise.reject(error);
        }
        // If requesting active_symbols but not yet populated, wait for api_base to fetch them
        if ('active_symbols' in req && !(api_base as any)?.has_active_symbols) {
            const waitPromise = (api_base as any)?.active_symbols_promise || Promise.resolve();
            return waitPromise.then(() => {
                // eslint-disable-next-line no-console
                console.log('[Chart] requestAPI after active_symbols ready:', req);
                return api.send(req);
            });
        }
        // eslint-disable-next-line no-console
        console.log('[Chart] requestAPI:', req);
        return api.send(req);
    };

    const requestForgetStream = (subscription_id: string) => {
        if (subscription_id) {
            const api = (api_base as any)?.api;
            api?.forget?.(subscription_id);
        }
    };

    const requestSubscribe = async (req: TicksStreamRequest, callback: (data: any) => void) => {
        const api = (api_base as any)?.api;
        if (!api) return;
        try {
            requestForgetStream(chartSubscriptionIdRef.current);
            const history = await api.send(req);
            const sub_id = history?.subscription?.id;
            setChartSubscriptionId(sub_id);
            if (history) callback(history);
            if (req.subscribe === 1 && sub_id) {
                subscriptions[sub_id] = api
                    .onMessage()
                    ?.subscribe(({ data }: { data: TicksHistoryResponse }) => {
                        const msg_sub_id = (data as any)?.subscription?.id;
                        if (!msg_sub_id || msg_sub_id === sub_id) {
                            callback(data);
                        }
                    });
            }
        } catch (e) {
            (e as TError)?.error?.code === 'MarketIsClosed' && callback([]);
            // eslint-disable-next-line no-console
            console.log('[Chart] error:', (e as TError)?.error?.message);
        }
    };

    // Wait for api_base to initialize and connect
    const [is_connection_opened, setIsConnectionOpened] = useState(false);

    useEffect(() => {
        let mounted = true;
        
        const checkConnection = () => {
            if (!mounted) return;
            
            const isReady = (api_base as any)?.api?.connection?.readyState === 1 && 
                           (api_base as any)?.has_active_symbols;
            
            if (isReady) {
                setIsConnectionOpened(true);
            } else {
                // Keep polling until both conditions are met
                setTimeout(checkConnection, 500);
            }
        };
        
        checkConnection();
        
        return () => {
            mounted = false;
        };
    }, []);

    if (!symbol) return (
        <div
            className='dashboard__chart-wrapper'
            dir='ltr'
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--general-main-2, #0e1821)' }}
        >
            <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '14px' }}>
                Loading chart…
            </span>
        </div>
    );

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
                symbol={symbol}
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
