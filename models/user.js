const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
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
  miningStart: {
    type: Date,
    default: null
  },
  lastMiningClaim: {
    type: Date,
    default: null
  },
  lastManualMining: {
    type: Date,
    default: null
  },
  referrer: {
    type: String,
    default: null
  },
  referralLevel: {
    type: Number,
    default: 1
  },
  totalReferralRewards: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: [String],
    default: []
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Virtual for getting full name
UserSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  } else if (this.firstName) {
    return this.firstName;
  } else if (this.lastName) {
    return this.lastName;
  } else {
    return 'User';
  }
});

module.exports = mongoose.model('User', UserSchema);