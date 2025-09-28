const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  referrerId: {
    type: String,
    required: true,
    index: true
  },
  referredId: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  rewardClaimed: {
    type: Boolean,
    default: false
  },
  activationRewardClaimed: {
    type: Boolean,
    default: false
  },
  inviteDate: {
    type: Date,
    default: Date.now
  },
  activationDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Indexes for faster queries
ReferralSchema.index({ referrerId: 1, referredId: 1 }, { unique: true });

module.exports = mongoose.model('Referral', ReferralSchema);