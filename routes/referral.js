const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// POST /api/mining/start
router.post('/start', async (req, res) => {
  const { userId, ts } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.miningStart = ts;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/claim
router.post('/claim', async (req, res) => {
  const { userId, amount, ts } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.coins += amount;
    user.miningStart = null;
    await user.save();

    await Transaction.create({
      userId,
      type: 'earn',
      amount,
      note: 'Mining session reward',
      timestamp: ts
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;