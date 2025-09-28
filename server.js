const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/piprotocol', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const miningRoutes = require('./routes/mining');
const referralRoutes = require('./routes/referral');
const walletRoutes = require('./routes/wallet');
const tasksRoutes = require('./routes/tasks');
const profileRoutes = require('./routes/profile');
const newsRoutes = require('./routes/news');

// Use routes
app.use('/mining', miningRoutes);
app.use('/referral', referralRoutes);
app.use('/convert', walletRoutes);
app.use('/tasks', tasksRoutes);
app.use('/profile', profileRoutes);
app.use('/news', newsRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;