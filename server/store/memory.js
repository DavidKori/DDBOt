const store = new Map();

const getList = symbol => store.get(symbol) || [];

const add = tick => {
    const list = getList(tick.symbol);
    list.push({ ...tick, _id: `${tick.symbol}_${tick.epoch}_${Date.now()}`, createdAt: new Date() });
    if (list.length > 10000) list.splice(0, list.length - 10000);
    store.set(tick.symbol, list);
    return list[list.length - 1];
};

const addMany = ticks => ticks.map(add);

const query = ({ symbol, limit = 500, from, to }) => {
    let list = getList(symbol);
    if (from) list = list.filter(t => t.epoch >= from);
    if (to) list = list.filter(t => t.epoch <= to);
    return list.slice(-limit);
};

const symbols = () => [...store.keys()];

const clear = symbol => {
    if (symbol) store.delete(symbol);
    else store.clear();
};

module.exports = { add, addMany, query, symbols, clear };
