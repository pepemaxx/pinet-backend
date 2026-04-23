const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['earn', 'swap', 'withdraw', 'deposit', 'info', 'profit', 'refund'], required: true },
  amount: { type: Number, required: true },
  note: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);