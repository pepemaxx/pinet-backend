const express = require('express');
const router = express.Router();

const staticNews = [
  { title: '🚀 PiProtocol Platform Version 2.0 Roadmap', content: 'We are proud to announce that version 2.0...', published_at: '2025-10-06' },
  { title: '🤝 Strategic Partnership with BlockChain Solutions', content: 'We are happy to announce our strategic partnership...' },
  { title: '📊 PiProtocol Development Roadmap for 2025', content: 'The PiProtocol development roadmap for 2025 has been published.' },
  { title: '🏆 Reaching 100,000 Active Users', content: 'We are proud to announce that the number of active users...' },
  { title: '💰 Listing PiP Token on Reputable Exchanges', content: 'The PiP token will soon be listed on several reputable exchanges.' },
  { title: '👥 New Referral System Launched', content: 'We\'ve launched our new multi-level referral system!' }
];

router.get('/', async (req, res) => {
  res.json(staticNews);
});

module.exports = router;