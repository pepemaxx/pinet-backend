const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

router.post('/complete', async (req, res) => {
  const { userId, taskId, reward } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.completedTasks.includes(taskId)) {
      return res.status(400).json({ error: 'Task already completed' });
    }
    user.coins += reward;
    user.completedTasks.push(taskId);
    if (!user.taskStatuses) user.taskStatuses = new Map();
    user.taskStatuses.set(taskId, 'completed');
    await user.save();

    await Transaction.create({
      userId,
      type: 'earn',
      amount: reward,
      note: `Task: ${taskId}`
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;