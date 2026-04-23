const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

router.post('/', async (req, res) => {
  const { userId, asset, address, amount } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (asset === 'pi' && user.pi < amount) return res.status(400).json({ error: 'Insufficient Pi' });
    if (asset === 'usdt' && user.usdt < amount) return res.status(400).json({ error: 'Insufficient USDT' });

    if (asset === 'pi') user.pi -= amount;
    else user.usdt -= amount;
    await user.save();

    await Transaction.create({
      userId,
      type: 'withdraw',
      amount,
      note: `Withdraw ${amount} ${asset.toUpperCase()} to ${address.slice(0,12)}...`
    });

    // در دنیای واقعی، درخواست برداشت را در صف قرار می‌دهید
    res.json({ success: true, message: 'Withdrawal request registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;