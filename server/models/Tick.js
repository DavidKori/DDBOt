const mongoose = require('mongoose');

const tickSchema = new mongoose.Schema(
    {
        symbol: { type: String, required: true, index: true },
        price: { type: Number, required: true },
        epoch: { type: Number, required: true, index: true },
        pip_size: { type: Number, default: 2 },
        ask: { type: Number },
        bid: { type: Number },
    },
    { timestamps: true }
);

tickSchema.index({ symbol: 1, epoch: -1 });

module.exports = mongoose.models.Tick || mongoose.model('Tick', tickSchema);
