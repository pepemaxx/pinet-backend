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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));