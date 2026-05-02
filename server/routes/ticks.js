const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

let Tick, memory;

const useMemory = () => {
    if (!memory) memory = require('../store/memory');
    return memory;
};

const useMongo = () => {
    if (mongoose.connection.readyState === 1) {
        if (!Tick) Tick = require('../models/Tick');
        return Tick;
    }
    return null;
};

// POST /api/ticks — store one tick
router.post('/', async (req, res, next) => {
    try {
        const { symbol, price, epoch, pip_size, ask, bid } = req.body;
        if (!symbol || price == null || epoch == null) {
            return res.status(400).json({ error: 'symbol, price and epoch are required' });
        }
        const doc = { symbol, price, epoch, pip_size, ask, bid };
        const model = useMongo();
        if (model) {
            const saved = await model.create(doc);
            return res.status(201).json(saved);
        }
        return res.status(201).json(useMemory().add(doc));
    } catch (err) {
        next(err);
    }
});

// POST /api/ticks/batch — store many ticks
router.post('/batch', async (req, res, next) => {
    try {
        const { ticks } = req.body;
        if (!Array.isArray(ticks) || ticks.length === 0) {
            return res.status(400).json({ error: 'ticks array is required' });
        }
        const model = useMongo();
        if (model) {
            const saved = await model.insertMany(ticks, { ordered: false });
            return res.status(201).json({ inserted: saved.length });
        }
        const saved = useMemory().addMany(ticks);
        return res.status(201).json({ inserted: saved.length });
    } catch (err) {
        next(err);
    }
});

// GET /api/ticks/:symbol — query ticks
router.get('/:symbol', async (req, res, next) => {
    try {
        const { symbol } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 500, 5000);
        const from = req.query.from ? parseInt(req.query.from) : null;
        const to = req.query.to ? parseInt(req.query.to) : null;

        const model = useMongo();
        if (model) {
            const filter = { symbol };
            if (from || to) {
                filter.epoch = {};
                if (from) filter.epoch.$gte = from;
                if (to) filter.epoch.$lte = to;
            }
            const ticks = await model.find(filter).sort({ epoch: -1 }).limit(limit).lean();
            return res.json(ticks.reverse());
        }
        return res.json(useMemory().query({ symbol, limit, from, to }));
    } catch (err) {
        next(err);
    }
});

// GET /api/ticks — list all stored symbols
router.get('/', async (req, res, next) => {
    try {
        const model = useMongo();
        if (model) {
            const symbols = await model.distinct('symbol');
            return res.json({ symbols });
        }
        return res.json({ symbols: useMemory().symbols() });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/ticks/:symbol — clear ticks for a symbol
router.delete('/:symbol', async (req, res, next) => {
    try {
        const { symbol } = req.params;
        const model = useMongo();
        if (model) {
            const result = await model.deleteMany({ symbol });
            return res.json({ deleted: result.deletedCount });
        }
        useMemory().clear(symbol);
        return res.json({ deleted: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
