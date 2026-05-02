const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const ticksRouter = require('./routes/ticks');
const analysisRouter = require('./routes/analysis');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

let dbConnected = false;

if (MONGODB_URI) {
    mongoose
        .connect(MONGODB_URI)
        .then(() => {
            dbConnected = true;
            console.log('[Backend] MongoDB connected');
        })
        .catch(err => {
            console.warn('[Backend] MongoDB connection failed, using in-memory store:', err.message);
        });
} else {
    console.warn('[Backend] MONGODB_URI not set — using in-memory store (data lost on restart)');
}

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', db: dbConnected ? 'mongodb' : 'memory', timestamp: Date.now() });
});

app.use('/api/ticks', ticksRouter);
app.use('/api/analysis', analysisRouter);

app.use((err, _req, res, _next) => {
    console.error('[Backend Error]', err.message);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] Server running on port ${PORT}`);
});
