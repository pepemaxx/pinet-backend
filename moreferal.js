const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  inviterCode: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['invited', 'active', 'rewarded'],
    default: 'invited'
  },
  inviteDate: {
    type: Date,
    default: Date.now
  },
  activationDate: {
    type: Date,
    default: null
  },
  rewardGiven: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
referralSchema.index({ inviterCode: 1 });
referralSchema.index({ userId: 1 });
referralSchema.index({ inviterCode: 1, status: 1 });
referralSchema.index({ inviteDate: 1 });

module.exports = mongoose.model('Referral', referralSchema);