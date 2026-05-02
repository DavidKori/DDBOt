import { createContext, useContext } from 'react';
import RootStore from '@/stores/root-store';
import { TWebSocket } from '@/types';
import Bot from '../external/bot-skeleton/scratch/dbot';

const StoreContext = createContext<null | RootStore>(null);

type TStoreProvider = {
    children: React.ReactNode;
    mockStore?: RootStore;
};

let _rootStore: RootStore | null = null;

const getOrCreateRootStore = (): RootStore => {
    if (!_rootStore) {
        _rootStore = new RootStore(Bot);
    }
    return _rootStore;
};

const StoreProvider: React.FC<TStoreProvider> = ({ children, mockStore }) => {
    const store = mockStore ?? getOrCreateRootStore();
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

const useStore = () => {
    const store = useContext(StoreContext);
    return store as RootStore;
};

export { StoreProvider, useStore };

export const mockStore = (ws: TWebSocket) => new RootStore(Bot, ws);
