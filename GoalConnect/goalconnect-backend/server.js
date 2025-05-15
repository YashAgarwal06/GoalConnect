const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth'); // Ensure you have this file
const User = require('./models/User'); // Add this line

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('GoalConnect Backend is running!');
});

app.use('/api/auth', authRoutes);

// Add more detailed MongoDB connection logging
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('connected', async () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('disconnected', () => {
  console.log('❌ MongoDB disconnected');
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    const port = process.env.PORT || 3001;
    app.listen(port, () => console.log(`✅ Server running on port ${port}`));
  })
  .catch(err => {
    console.error('❌ Initial MongoDB connection error:', err);
    process.exit(1);
  });