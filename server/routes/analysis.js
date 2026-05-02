const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

let Tick, memory;
const useMemory = () => { if (!memory) memory = require('../store/memory'); return memory; };
const useMongo = () => {
    if (mongoose.connection.readyState === 1) {
        if (!Tick) Tick = require('../models/Tick');
        return Tick;
    }
    return null;
};

const getTicks = async (symbol, limit = 1000) => {
    const model = useMongo();
    if (model) {
        return (await model.find({ symbol }).sort({ epoch: -1 }).limit(limit).lean()).reverse();
    }
    return useMemory().query({ symbol, limit });
};

const sma = (prices, period) => {
    if (prices.length < period) return [];
    const result = [];
    for (let i = period - 1; i < prices.length; i++) {
        const slice = prices.slice(i - period + 1, i + 1);
        result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
    return result;
};

const ema = (prices, period) => {
    if (prices.length < period) return [];
    const k = 2 / (period + 1);
    const result = [prices.slice(0, period).reduce((a, b) => a + b, 0) / period];
    for (let i = period; i < prices.length; i++) {
        result.push(prices[i] * k + result[result.length - 1] * (1 - k));
    }
    return result;
};

const rsi = (prices, period = 14) => {
    if (prices.length < period + 1) return [];
    const gains = [], losses = [];
    for (let i = 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        gains.push(Math.max(diff, 0));
        losses.push(Math.max(-diff, 0));
    }
    const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const result = [];
    let ag = avgGain, al = avgLoss;
    result.push(al === 0 ? 100 : ag === 0 ? 0 : 100 - 100 / (1 + ag / al));
    for (let i = period; i < gains.length; i++) {
        ag = (ag * (period - 1) + gains[i]) / period;
        al = (al * (period - 1) + losses[i]) / period;
        result.push(al === 0 ? 100 : ag === 0 ? 0 : 100 - 100 / (1 + ag / al));
    }
    return result;
};

const ohlc = (ticks, intervalSecs = 60) => {
    if (!ticks.length) return [];
    const candles = {};
    for (const tick of ticks) {
        const bucket = Math.floor(tick.epoch / intervalSecs) * intervalSecs;
        if (!candles[bucket]) {
            candles[bucket] = { time: bucket, open: tick.price, high: tick.price, low: tick.price, close: tick.price, volume: 0 };
        } else {
            const c = candles[bucket];
            c.high = Math.max(c.high, tick.price);
            c.low = Math.min(c.low, tick.price);
            c.close = tick.price;
            c.volume++;
        }
    }
    return Object.values(candles).sort((a, b) => a.time - b.time);
};

// GET /api/analysis/:symbol/sma?period=20
router.get('/:symbol/sma', async (req, res, next) => {
    try {
        const period = parseInt(req.query.period) || 20;
        const limit = parseInt(req.query.limit) || 500;
        const ticks = await getTicks(req.params.symbol, limit);
        const prices = ticks.map(t => t.price);
        const values = sma(prices, period);
        const aligned = ticks.slice(period - 1).map((t, i) => ({ epoch: t.epoch, price: t.price, sma: values[i] }));
        res.json({ symbol: req.params.symbol, period, data: aligned });
    } catch (err) { next(err); }
});

// GET /api/analysis/:symbol/ema?period=20
router.get('/:symbol/ema', async (req, res, next) => {
    try {
        const period = parseInt(req.query.period) || 20;
        const limit = parseInt(req.query.limit) || 500;
        const ticks = await getTicks(req.params.symbol, limit);
        const prices = ticks.map(t => t.price);
        const values = ema(prices, period);
        const aligned = ticks.slice(period - 1).map((t, i) => ({ epoch: t.epoch, price: t.price, ema: values[i] }));
        res.json({ symbol: req.params.symbol, period, data: aligned });
    } catch (err) { next(err); }
});

// GET /api/analysis/:symbol/rsi?period=14
router.get('/:symbol/rsi', async (req, res, next) => {
    try {
        const period = parseInt(req.query.period) || 14;
        const limit = parseInt(req.query.limit) || 500;
        const ticks = await getTicks(req.params.symbol, limit);
        const prices = ticks.map(t => t.price);
        const values = rsi(prices, period);
        const aligned = ticks.slice(period).map((t, i) => ({ epoch: t.epoch, price: t.price, rsi: values[i] }));
        res.json({ symbol: req.params.symbol, period, data: aligned });
    } catch (err) { next(err); }
});

// GET /api/analysis/:symbol/ohlc?interval=60
router.get('/:symbol/ohlc', async (req, res, next) => {
    try {
        const interval = parseInt(req.query.interval) || 60;
        const limit = parseInt(req.query.limit) || 2000;
        const ticks = await getTicks(req.params.symbol, limit);
        const candles = ohlc(ticks, interval);
        res.json({ symbol: req.params.symbol, interval, data: candles });
    } catch (err) { next(err); }
});

// GET /api/analysis/:symbol/summary — latest price, count, high/low
router.get('/:symbol/summary', async (req, res, next) => {
    try {
        const ticks = await getTicks(req.params.symbol, 1000);
        if (!ticks.length) return res.json({ symbol: req.params.symbol, count: 0 });
        const prices = ticks.map(t => t.price);
        const latest = ticks[ticks.length - 1];
        const sma20 = sma(prices, 20);
        const ema20 = ema(prices, 20);
        const rsi14 = rsi(prices, 14);
        res.json({
            symbol: req.params.symbol,
            count: ticks.length,
            latest_price: latest.price,
            latest_epoch: latest.epoch,
            high: Math.max(...prices),
            low: Math.min(...prices),
            sma_20: sma20.length ? +sma20[sma20.length - 1].toFixed(5) : null,
            ema_20: ema20.length ? +ema20[ema20.length - 1].toFixed(5) : null,
            rsi_14: rsi14.length ? +rsi14[rsi14.length - 1].toFixed(2) : null,
        });
    } catch (err) { next(err); }
});

module.exports = router;
