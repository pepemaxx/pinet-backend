const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/referral/stats
router.post('/stats', async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      invited: user.friendsInvited,
      active: user.friendsActive,
      invitedFriends: user.invitedFriends,
      activeFriends: user.activeFriends,
      referralLevel: user.referralLevel,
      totalReferralRewards: user.totalReferralRewards,
      pendingRewards: user.pendingRewards
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referral/register
router.post('/register', async (req, res) => {
  const { inviterCode, userId, username } = req.body;
  try {
    const inviter = await User.findOne({ userId: inviterCode });
    if (!inviter) return res.status(404).json({ error: 'Inviter not found' });

    const newUser = await User.findOne({ userId });
    if (!newUser) return res.status(404).json({ error: 'New user not found' });

    // ثبت معرف
    newUser.referrer = {
      id: inviter.userId,
      username: `${inviter.firstName} ${inviter.lastName}`.trim() || inviter.userId,
      date: new Date()
    };
    await newUser.save();

    // افزایش تعداد دعوت شده‌ها برای معرف
    inviter.friendsInvited += 1;
    inviter.invitedFriends.push({
      id: userId,
      username,
      inviteDate: new Date(),
      isActive: false
    });
    await inviter.save();

    // اضافه کردن پاداش دعوت (در حالت pending)
    inviter.pendingRewards.push({
      id: userId,
      username,
      amount: 2,
      type: 'invite'
    });
    await inviter.save();

    res.json({ success: true, inviterName: `${inviter.firstName} ${inviter.lastName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referral/activate
router.post('/activate', async (req, res) => {
  const { referrerId, userId } = req.body;
  try {
    const referrer = await User.findOne({ userId: referrerId });
    const user = await User.findOne({ userId });
    if (!referrer || !user) return res.status(404).json({ error: 'User not found' });

    // فعال کردن دوست در لیست معرف
    const invitedFriend = referrer.invitedFriends.find(f => f.id === userId);
    if (invitedFriend && !invitedFriend.isActive) {
      invitedFriend.isActive = true;
      referrer.friendsActive += 1;
      referrer.activeFriends.push({
        id: userId,
        username: `${user.firstName} ${user.lastName}`.trim() || userId,
        activeDate: new Date()
      });

      // پاداش فعال‌سازی
      referrer.pendingRewards.push({
        id: userId,
        username: `${user.firstName} ${user.lastName}`.trim() || userId,
        amount: 5,
        type: 'activation'
      });

      // به‌روزرسانی سطح معرف
      const newLevel = Math.min(5, Math.floor(referrer.friendsActive / 5) + 1);
      if (newLevel > referrer.referralLevel) {
        referrer.referralLevel = newLevel;
        // پاداش یکباره سطح
        const levelReward = [0, 5, 10, 20, 50, 100][newLevel];
        referrer.pendingRewards.push({
          id: 'system',
          username: 'System',
          amount: levelReward,
          type: `level_${newLevel}`
        });
      }

      await referrer.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referral/claim-rewards
router.post('/claim-rewards', async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const total = user.pendingRewards.reduce((sum, r) => sum + r.amount, 0);
    user.coins += total;
    user.totalReferralRewards += total;
    user.pendingRewards = [];
    await user.save();
    res.json({ success: true, claimed: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referral/share (برای ردیابی اشتراک‌گذاری)
router.post('/share', async (req, res) => {
  const { userId, platform } = req.body;
  // فقط برای آمار، نیازی به ذخیره در دیتابیس نیست
  res.json({ success: true });
});

module.exports = router;