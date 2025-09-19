const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Referral = require('../models/Referral');

// ثبت دعوت جدید
router.post('/register', async (req, res) => {
  try {
    const { inviterCode, userId, timestamp } = req.body;
    
    // بررسی اینکه کاربر قبلاً دعوت نشده باشد
    const existingReferral = await Referral.findOne({ userId });
    if (existingReferral) {
      return res.json({ 
        success: true, 
        message: 'Referral already registered',
        data: existingReferral
      });
    }
    
    // بررسی اینکه inviter وجود دارد
    const inviterExists = await User.findOne({ userId: inviterCode });
    if (!inviterExists && inviterCode !== 'direct') {
      return res.status(400).json({ 
        success: false, 
        error: 'Inviter not found' 
      });
    }
    
    // ایجاد رکورد دعوت جدید
    const newReferral = new Referral({
      inviterCode,
      userId,
      status: 'invited',
      inviteDate: new Date(timestamp || Date.now())
    });
    
    await newReferral.save();
    
    // افزایش تعداد دوستان دعوت شده برای inviter
    if (inviterCode !== 'direct') {
      await User.findOneAndUpdate(
        { userId: inviterCode },
        { $inc: { friendsInvited: 1 } },
        { upsert: true, new: true }
      );
    }
    
    // ایجاد کاربر جدید اگر وجود ندارد
    await User.findOneAndUpdate(
      { userId },
      { 
        $setOnInsert: { 
          referredBy: inviterCode,
          joinedAt: new Date(timestamp || Date.now())
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({ 
      success: true, 
      message: 'Referral registered successfully',
      data: newReferral
    });
  } catch (error) {
    console.error('Referral registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// دریافت آمار دعوت‌ها
router.post('/stats', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    // پیدا کردن کاربر
    let user = await User.findOne({ userId });
    
    if (!user) {
      // اگر کاربر وجود ندارد، ایجادش کن
      user = new User({ userId });
      await user.save();
      return res.json({ 
        invited: 0, 
        active: 0, 
        invitedFriends: [], 
        activeFriends: [] 
      });
    }
    
    // پیدا کردن دوستان دعوت شده
    const invitedFriends = await Referral.find({ inviterCode: userId });
    
    // پیدا کردن دوستان فعال
    const activeFriends = await Referral.find({ 
      inviterCode: userId, 
      status: 'active' 
    });
    
    // به‌روزرسانی تعداد دوستان فعال
    const activeCount = activeFriends.length;
    if (user.friendsActive !== activeCount) {
      await User.findOneAndUpdate(
        { userId },
        { friendsActive: activeCount }
      );
      user.friendsActive = activeCount;
    }
    
    res.json({
      success: true,
      invited: user.friendsInvited,
      active: user.friendsActive,
      invitedFriends: invitedFriends.map(friend => ({
        id: friend.userId,
        username: `User ${friend.userId}`,
        inviteDate: friend.inviteDate,
        isActive: friend.status === 'active',
        status: friend.status
      })),
      activeFriends: activeFriends.map(friend => ({
        id: friend.userId,
        username: `User ${friend.userId}`,
        activeDate: friend.activationDate,
        daysActive: friend.activationDate 
          ? Math.floor((Date.now() - friend.activationDate) / (1000 * 60 * 60 * 24))
          : 0
      }))
    });
  } catch (error) {
    console.error('Stats retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ثبت اشتراک‌گذاری لینک
router.post('/share', async (req, res) => {
  try {
    const { userId, platform } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    // افزایش تعداد دعوت‌ها
    await User.findOneAndUpdate(
      { userId },
      { $inc: { friendsInvited: 1 } },
      { upsert: true, new: true }
    );
    
    res.json({ 
      success: true, 
      message: 'Share recorded successfully',
      platform: platform || 'unknown'
    });
  } catch (error) {
    console.error('Share recording error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// فعال کردن دوست (وقتی دوست شروع به ماینینگ کند)
router.post('/activate', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    // پیدا کردن رکورد دعوت
    const referral = await Referral.findOne({ userId });
    
    if (!referral) {
      return res.status(404).json({ 
        success: false, 
        error: 'Referral not found' 
      });
    }
    
    if (referral.status === 'active') {
      return res.json({ 
        success: true, 
        message: 'Friend is already active' 
      });
    }
    
    // به‌روزرسانی وضعیت به فعال
    referral.status = 'active';
    referral.activationDate = new Date();
    await referral.save();
    
    // افزایش تعداد دوستان فعال برای inviter
    await User.findOneAndUpdate(
      { userId: referral.inviterCode },
      { $inc: { friendsActive: 1 } }
    );
    
    res.json({ 
      success: true, 
      message: 'Friend activated successfully',
      data: referral
    });
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// دریافت لیست دوستان دعوت شده
router.get('/friends/invited/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const invitedFriends = await Referral.find({ inviterCode: userId })
      .sort({ inviteDate: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: invitedFriends.length,
      friends: invitedFriends.map(friend => ({
        id: friend.userId,
        username: `User ${friend.userId}`,
        inviteDate: friend.inviteDate,
        status: friend.status,
        isActive: friend.status === 'active',
        daysSinceInvite: Math.floor((Date.now() - friend.inviteDate) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (error) {
    console.error('Invited friends retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// دریافت لیست دوستان فعال
router.get('/friends/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const activeFriends = await Referral.find({ 
      inviterCode: userId, 
      status: 'active' 
    })
    .sort({ activationDate: -1 })
    .limit(50);
    
    res.json({
      success: true,
      count: activeFriends.length,
      friends: activeFriends.map(friend => ({
        id: friend.userId,
        username: `User ${friend.userId}`,
        activationDate: friend.activationDate,
        daysActive: Math.floor((Date.now() - friend.activationDate) / (1000 * 60 * 60 * 24)),
        miningBoost: 0.001 // افزایش سرعت ماینینگ برای هر دوست فعال
      }))
    });
  } catch (error) {
    console.error('Active friends retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// دریافت اطلاعات کاربر
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user: {
        userId: user.userId,
        coins: user.coins,
        pi: user.pi,
        usdt: user.usdt,
        friendsInvited: user.friendsInvited,
        friendsActive: user.friendsActive,
        miningRate: user.miningRate,
        joinedAt: user.joinedAt,
        referredBy: user.referredBy,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('User retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// به‌روزرسانی اطلاعات کاربر
router.post('/user/update', async (req, res) => {
  try {
    const { userId, updates } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        userId: user.userId,
        coins: user.coins,
        pi: user.pi,
        usdt: user.usdt,
        friendsInvited: user.friendsInvited,
        friendsActive: user.friendsActive,
        miningRate: user.miningRate
      }
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;