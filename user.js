const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  coins: {
    type: Number,
    default: 0
  },
  pi: {
    type: Number,
    default: 0
  },
  usdt: {
    type: Number,
    default: 0
  },
  friendsInvited: {
    type: Number,
    default: 0
  },
  friendsActive: {
    type: Number,
    default: 0
  },
  miningRate: {
    type: Number,
    default: 0.002
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  referredBy: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('User', userSchema);