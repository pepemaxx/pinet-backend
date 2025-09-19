const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const referralRoutes = require('./routes/referral');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/referral', referralRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'PiProtocol Backend is running!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://ronaldofans2025_db_user:Sgj0KzVir6F5n1SX@cluster0.xxxxx.mongodb.net/piprotocol', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));