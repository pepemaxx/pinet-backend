const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/update', async (req, res) => {
  const { userId, firstName, lastName } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.firstName = firstName;
    user.lastName = lastName;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;