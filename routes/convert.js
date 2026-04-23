const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// POST /api/convert/coins-to-pi
router.post('/coins-to-pi', async (req, res) => {
  const { userId, coins, pi } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.coins < coins) return res.status(400).json({ error: 'Insufficient coins' });
    user.coins -= coins;
    user.pi += pi;
    await user.save();

    await Transaction.create({
      userId,
      type: 'swap',
      amount: pi,
      note: `Convert ${coins} coins → ${pi.toFixed(2)} Pi`
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/convert/pi-to-usdt
router.post('/pi-to-usdt', async (req, res) => {
  const { userId, pi, usdt } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.pi < pi) return res.status(400).json({ error: 'Insufficient Pi' });
    user.pi -= pi;
    user.usdt += usdt;
    await user.save();

    await Transaction.create({
      userId,
      type: 'swap',
      amount: usdt,
      note: `Convert ${pi} Pi → ${usdt.toFixed(2)} USDT`
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;