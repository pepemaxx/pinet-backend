const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, sparse: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  coins: { type: Number, default: 0 },
  pi: { type: Number, default: 0 },
  usdt: { type: Number, default: 0 },
  miningStart: { type: Number, default: null },
  friendsInvited: { type: Number, default: 0 },
  friendsActive: { type: Number, default: 0 },
  invitedFriends: [{
    id: String,
    username: String,
    inviteDate: Date,
    isActive: Boolean
  }],
  activeFriends: [{
    id: String,
    username: String,
    activeDate: Date
  }],
  rewardedFriends: [String],
  completedTasks: [String],
  taskStatuses: { type: Map, of: String, default: {} },
  lastResetDate: { type: String, default: () => new Date().toDateString() },
  referrer: {
    id: String,
    username: String,
    date: Date
  },
  pendingRewards: [{
    id: String,
    username: String,
    amount: Number,
    type: String
  }],
  referralLevel: { type: Number, default: 1 },
  totalReferralRewards: { type: Number, default: 0 },
  activeInvestment: {
    planId: String,
    totalBase: Number,
    startTimestamp: Number,
    durationSeconds: Number,
    profitRatePerDay: Number
  },
  lastManual: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);