import { initSurvicate } from '../public-path';
import { lazy, Suspense, useState, useCallback } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import CommunityModal from '@/components/community-modal';
import KoriFxLoader from '@/components/korifx-loader';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { crypto_currencies_display_order, fiat_currencies_display_order } from '@/components/shared';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { StoreProvider } from '@/hooks/useStore';
import CallbackPage from '@/pages/callback';
import Endpoint from '@/pages/endpoint';
import { TAuthData } from '@/types/api-types';
import { initializeI18n, localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import Layout from '../components/layout';
import AppRoot from './app-root';
import './app-root.scss';

const FreeBots = lazy(() => import('../pages/free-bots'));
const AnalysisTool = lazy(() => import('../pages/analysis-tool'));

const { TRANSLATIONS_CDN_URL, R2_PROJECT_NAME, CROWDIN_BRANCH_NAME } = process.env;
const i18nInstance = initializeI18n({
    cdnUrl: `${TRANSLATIONS_CDN_URL}/${R2_PROJECT_NAME}/${CROWDIN_BRANCH_NAME}`,
});

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => {
    const { isOnline } = useOfflineDetection();
    const getLoadingMessage = () =>
        !isOnline ? localize('Loading offline dashboard...') : localize('Please wait while we connect...');
    return <Suspense fallback={<ChunkLoader message={getLoadingMessage()} />}>{children}</Suspense>;
};

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={
                <SuspenseWrapper>
                    <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                        <StoreProvider>
                            <RoutePromptDialog />
                            <CoreStoreProvider>
                                <Layout />
                            </CoreStoreProvider>
                        </StoreProvider>
                    </TranslationProvider>
                </SuspenseWrapper>
            }
        >
            <Route index element={<AppRoot />} />
            <Route path='endpoint' element={<Endpoint />} />
            <Route path='callback' element={<CallbackPage />} />
            <Route path='free-bots' element={<FreeBots />} />
            <Route path='analysis-tool' element={<AnalysisTool />} />
        </Route>
    )
);

function App() {
    const [showLoader, setShowLoader] = useState(true);
    const [showCommunity, setShowCommunity] = useState(false);

    const handleLoaderDone = useCallback(() => {
        setShowLoader(false);
        setShowCommunity(true);
    }, []);

    React.useEffect(() => {
        initSurvicate();
        window?.dataLayer?.push({ event: 'page_load' });
        return () => {
            const survicate_box = document.getElementById('survicate-box');
            if (survicate_box) {
                survicate_box.style.display = 'none';
            }
        };
    }, []);

    React.useEffect(() => {
        const accounts_list = localStorage.getItem('accountsList');
        const client_accounts = localStorage.getItem('clientAccounts');
        const url_params = new URLSearchParams(window.location.search);
        const account_currency = url_params.get('account');
        const validCurrencies = [...fiat_currencies_display_order, ...crypto_currencies_display_order];
        const is_valid_currency = account_currency && validCurrencies.includes(account_currency?.toUpperCase());

        if (!accounts_list || !client_accounts) return;

        try {
            const parsed_accounts = JSON.parse(accounts_list);
            const parsed_client_accounts = JSON.parse(client_accounts) as TAuthData['account_list'];

            const updateLocalStorage = (token: string, loginid: string) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginid);
            };

            if (account_currency?.toUpperCase() === 'DEMO') {
                const demo_account = Object.entries(parsed_accounts).find(([key]) => key.startsWith('VR'));
                if (demo_account) {
                    const [loginid, token] = demo_account;
                    updateLocalStorage(String(token), loginid);
                    return;
                }
            }

            if (account_currency?.toUpperCase() !== 'DEMO' && is_valid_currency) {
                const real_account = Object.entries(parsed_client_accounts).find(
                    ([loginid, account]) =>
                        !loginid.startsWith('VR') && account.currency.toUpperCase() === account_currency?.toUpperCase()
                );
                if (real_account) {
                    const [loginid, account] = real_account;
                    if ('token' in account) {
                        updateLocalStorage(String(account?.token), loginid);
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn('Error', e); // eslint-disable-line no-console
        }
    }, []);

    return (
        <>
            {showLoader && <KoriFxLoader onDone={handleLoaderDone} />}
            {showCommunity && <CommunityModal />}
            <RouterProvider router={router} />
        </>
    );
}

export default App;
