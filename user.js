const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 7,
    maxlength: 7
  },
  coins: {
    type: Number,
    default: 0,
    min: 0
  },
  pi: {
    type: Number,
    default: 0,
    min: 0
  },
  usdt: {
    type: Number,
    default: 0,
    min: 0
  },
  friendsInvited: {
    type: Number,
    default: 0,
    min: 0
  },
  friendsActive: {
    type: Number,
    default: 0,
    min: 0
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
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActive timestamp before saving
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// Index for better performance
userSchema.index({ userId: 1 });
userSchema.index({ referredBy: 1 });

module.exports = mongoose.model('User', userSchema);