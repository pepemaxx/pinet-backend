require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/mining', require('./routes/mining'));
app.use('/api/convert', require('./routes/convert'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/referral', require('./routes/referral'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/news', require('./routes/news'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));