// server.js
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database
const db = {
// Friends model
const friendModel = {
  friends: {}, // دوستان هر کاربر
  // ساختار دوست
  friend: {
    id: "unique_id",
    username: "friend_name",
    inviteDate: "ISO_date",
    isActive: false,
    activeDate: null,
    referredBy: "user_id"
  }
};
  users: {},
  mining: {},
  transactions: {},
  referrals: {},
  news: [
    {
      id: '1',
      title: '🚀 PiProtocol Platform Version 2.0 Roadmap',
      content: 'We are proud to announce that version 2.0 of the PiProtocol platform with new features and improved mining performance will be launched on October 6, 2025.',
      published_at: new Date().toISOString()
    },
    {
      id: '2',
      title: '🤝 Strategic Partnership with BlockChain Solutions',
      content: 'We are happy to announce our strategic partnership with BlockChain Solutions for developing secure and scalable infrastructure. This partnership will allow us to provide better services to our users.',
      published_at: new Date().toISOString()
    },
    {
      id: '3',
      title: '📊 PiProtocol Development Roadmap for 2025',
      content: 'The PiProtocol development roadmap for 2025 has been published. In this roadmap, our plans for launching a dedicated wallet, listing PiP token on major blockchain networks, and a staking system with 12% annual interest have been specified.',
      published_at: new Date().toISOString()
    },
    {
      id: '4',
      title: '🏆 Reaching 100,000 Active Users',
      content: 'We are proud to announce that the number of active users of the PiProtocol platform has exceeded 100,000. We thank all users for their trust and support.',
      published_at: new Date().toISOString()
    },
    {
      id: '5',
      title: '💰 Listing PiP Token on Reputable Exchanges',
      content: 'The PiP token will soon be listed on several reputable digital currency exchanges. This action will increase liquidity and accessibility for more users to the PiP token.',
      published_at: new Date().toISOString()
    }
  ]
};

// Helper functions
const getUser = (userId) => {
  if (!db.users[userId]) {
    db.users[userId] = {
      userId,
      profile: { first: '', last: '' },
      coins: 0,
      pi: 0,
      usdt: 0,
      transactions: [],
      miningStart: null,
      completedTasks: [],
      taskStatuses: {},
      lastManual: 0
    };
  }
  return db.users[userId];
};

const getReferralData = (userId) => {
  if (!db.referrals[userId]) {
    db.referrals[userId] = {
      invited: 0,
      active: 0,
      invitedFriends: [],
      activeFriends: []
    };
  }
  return db.referrals[userId];
};

// Routes

// Mining endpoints
app.post('/mining/start', (req, res) => {
  const { userId, ts } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const user = getUser(userId);
  user.miningStart = ts || Date.now();
  
  res.json({ success: true, miningStart: user.miningStart });
});

app.post('/claim', (req, res) => {
  const { userId, amount } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const user = getUser(userId);
  if (amount > 0) {
    user.coins += parseFloat(amount);
    user.transactions.unshift({
      id: uuidv4(),
      type: 'earn',
      amount: parseFloat(amount),
      note: 'Mining session reward',
      ts: Date.now()
    });
  }
  
  user.miningStart = null;
  
  res.json({ 
    success: true, 
    coins: user.coins,
    transactions: user.transactions.slice(0, 10)
  });
});

// Conversion endpoints
app.post('/convert/coins-to-pi', (req, res) => {
  const { userId, coins, pi } = req.body;
  if (!userId || !coins || !pi) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const user = getUser(userId);
  if (user.coins < coins) {
    return res.status(400).json({ error: 'Not enough coins' });
  }
  
  user.coins -= parseFloat(coins);
  user.pi += parseFloat(pi);
  user.transactions.unshift({
    id: uuidv4(),
    type: 'swap',
    amount: parseFloat(pi),
    note: `Convert ${coins} coins → ${parseFloat(pi).toFixed(2)} Pi`,
    ts: Date.now()
  });
  
  res.json({ 
    success: true, 
    coins: user.coins,
    pi: user.pi,
    transactions: user.transactions.slice(0, 10)
  });
});

app.post('/convert/pi-to-usdt', (req, res) => {
  const { userId, pi, usdt } = req.body;
  if (!userId || !pi || !usdt) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const user = getUser(userId);
  if (user.pi < pi) {
    return res.status(400).json({ error: 'Not enough Pi' });
  }
  
  user.pi -= parseFloat(pi);
  user.usdt += parseFloat(usdt);
  user.transactions.unshift({
    id: uuidv4(),
    type: 'swap',
    amount: parseFloat(usdt),
    note: `Convert ${pi} Pi → ${parseFloat(usdt).toFixed(2)} USDT`,
    ts: Date.now()
  });
  
  res.json({ 
    success: true, 
    pi: user.pi,
    usdt: user.usdt,
    transactions: user.transactions.slice(0, 10)
  });
});

// Withdrawal endpoint
app.post('/withdraw', (req, res) => {
  const { userId, asset, address, amount } = req.body;
  if (!userId || !asset || !address || !amount) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const user = getUser(userId);
  
  // In a real app, we would process the withdrawal
  // For demo, just record the transaction
  user.transactions.unshift({
    id: uuidv4(),
    type: 'withdraw',
    amount: parseFloat(amount),
    note: `Withdraw request ${amount} ${asset.toUpperCase()} → ${address.slice(0, 12)}...`,
    ts: Date.now()
  });
  
  res.json({ 
    success: true, 
    message: 'Withdrawal request registered',
    transactions: user.transactions.slice(0, 10)
  });
});

// Referral endpoints
app.post('/referral/register', (req, res) => {
  const { inviterCode, userId } = req.body;
  if (!inviterCode || !userId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  // Don't allow self-referral
  if (inviterCode === userId) {
    return res.status(400).json({ error: 'Cannot refer yourself' });
  }
  
  const inviterData = getReferralData(inviterCode);
  const userData = getReferralData(userId);
  
  // Check if user is already invited
  const alreadyInvited = inviterData.invitedFriends.some(friend => friend.id === userId);
  if (!alreadyInvited) {
    inviterData.invited += 1;
    inviterData.invitedFriends.push({
      id: userId,
      username: `User${userId.slice(-4)}`,
      inviteDate: new Date().toISOString(),
      isActive: false
    });
    
    // Randomly make some users active (for demo)
    if (Math.random() > 0.5) {
      inviterData.active += 1;
      const friendIndex = inviterData.invitedFriends.findIndex(f => f.id === userId);
      if (friendIndex !== -1) {
        inviterData.invitedFriends[friendIndex].isActive = true;
      }
      
      inviterData.activeFriends.push({
        id: userId,
        username: `User${userId.slice(-4)}`,
        activeDate: new Date().toISOString()
      });
    }
  }
  
  res.json({ 
    success: true,
    message: 'Referral registered successfully'
  });
});

app.post('/referral/stats', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const referralData = getReferralData(userId);
  
  res.json({
    invited: referralData.invited,
    active: referralData.active,
    invitedFriends: referralData.invitedFriends,
    activeFriends: referralData.activeFriends
  });
});

app.post('/referral/share', (req, res) => {
  const { userId, platform } = req.body;
  if (!userId || !platform) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  // In a real app, we would track share events
  // For demo, just return success
  
  res.json({ 
    success: true,
    message: `Share event on ${platform} recorded`
  });
});

// تابع ایجاد دوست جدید
function createFriend(userId, friendData) {
  if (!db.friends[userId]) {
    db.friends[userId] = [];
  }
  
  const newFriend = {
id: friendData.id || uuidv4(),
    username: friendData.username || `User${friendData.userId?.slice(-4)}`,
    inviteDate: new Date().toISOString(),
    isActive: false,
    activeDate: null,
    referredBy: userId
  };
  
  db.friends[userId].push(newFriend);
  return newFriend;
}

  // جلوگیری از دعوت خود
  if (inviterCode === userId) {
    return res.status(400).json({ error: 'Cannot refer yourself' });
  }

  const inviter = getUser(inviterCode);
  const invitee = getUser(userId);
  
  // چک کنید که قبلاً دعوت نشده
  const referralData = getReferralData(inviterCode);
  const alreadyInvited = referralData.invitedFriends.some(f => f.id === userId);
  
  if (!alreadyInvited) {
    // ایجاد دوست جدید
    const newFriend = createFriend(inviterCode, {
      id: userId,
      username: username || invitee.profile?.first || `User${userId.slice(-4)}`
    });
    // به‌روزرسانی آمار
    referralData.invited += 1;
    referralData.invitedFriends.push(newFriend);
    
    res.json({
      success: true,
      message: 'Friend invited successfully',
      friend: newFriend
    });
  } else {
    res.json({
      success: false,
      message: 'Already invited'
    });
  }
});

// API برای فعال‌سازی دوست
app.post('/referral/activate', (req, res) => {
  const { userId, friendId } = req.body;
  
  const referralData = getReferralData(userId);
  const friendIndex = referralData.invitedFriends.findIndex(f => f.id === friendId);
  
  if (friendIndex !== -1 && !referralData.invitedFriends[friendIndex].isActive) {
    // فعال‌سازی دوست
    referralData.invitedFriends[friendIndex].isActive = true;
    referralData.invitedFriends[friendIndex].activeDate = new Date().toISOString();
    
    // اضافه کردن به لیست فعال‌ها
    referralData.activeFriends.push(referralData.invitedFriends[friendIndex]);
    referralData.active += 1;
    
    res.json({
      success: true,
      message: 'Friend activated',
      friend: referralData.invitedFriends[friendIndex]
    });
  } else {
    res.json({
      success: false,
      message: 'Friend not found or already active'
    });
  }
});

// News endpoint
app.get('/news', (req, res) => {
  res.json(db.news);
});

// Profile endpoints
app.post('/profile/update', (req, res) => {
  const { userId, first, last } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const user = getUser(userId);
  if (first !== undefined) user.profile.first = first;
  if (last !== undefined) user.profile.last = last;
  
  res.json({ 
    success: true,
    profile: user.profile
  });
});

// Task endpoints
app.post('/tasks/complete', (req, res) => {
  const { userId, taskId } = req.body;
  if (!userId || !taskId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const user = getUser(userId);
  
  // Mark task as completed if not already
  if (!user.completedTasks.includes(taskId)) {
    user.completedTasks.push(taskId);
  }
  
  if (!user.taskStatuses) {
    user.taskStatuses = {};
  }
  user.taskStatuses[taskId] = 'completed';
  
  res.json({ 
    success: true,
    completedTasks: user.completedTasks,
    taskStatuses: user.taskStatuses
  });
});

app.post('/tasks/claim', (req, res) => {
  const { userId, taskId, reward } = req.body;
  if (!userId || !taskId || reward === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const user = getUser(userId);
  
  // Add reward if task is not already claimed
  if (!user.completedTasks.includes(taskId)) {
    user.coins += parseFloat(reward);
    user.completedTasks.push(taskId);
    user.transactions.unshift({
      id: uuidv4(),
      type: 'earn',
      amount: parseFloat(reward),
      note: `Task: ${taskId}`,
      ts: Date.now()
    });
  }
  
  if (!user.taskStatuses) {
    user.taskStatuses = {};
  }
  user.taskStatuses[taskId] = 'completed';
  
  res.json({ 
    success: true,
    coins: user.coins,
    completedTasks: user.completedTasks,
    taskStatuses: user.taskStatuses,
    transactions: user.transactions.slice(0, 10)
  });
});

// Manual mining endpoint
app.post('/mining/manual', (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || amount === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const user = getUser(userId);
  const now = Date.now();
  const cooldownTime = 10 * 1000; // 10 seconds
  
  // Check cooldown
  if (user.lastManual && now - user.lastManual < cooldownTime) {
    return res.status(400).json({ 
      error: 'Cooldown active',
      remainingCooldown: cooldownTime - (now - user.lastManual)
    });
  }
  
  user.coins += parseFloat(amount);
  user.lastManual = now;
  user.transactions.unshift({
    id: uuidv4(),
    type: 'earn',
    amount: parseFloat(amount),
    note: 'Manual mining click',
    ts: now
  });
  
  res.json({ 
    success: true,
    coins: user.coins,
    lastManual: user.lastManual,
    transactions: user.transactions.slice(0, 10)
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});