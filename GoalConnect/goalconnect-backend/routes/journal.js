const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');
const auth = require('../middleware/auth');

// Create a new journal entry
router.post('/', auth, async (req, res) => {
  try {
    const { content, date } = req.body;
    
    // Check if a journal entry already exists for this user on this date
    const entryDate = new Date(date);
    const startOfDay = new Date(entryDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(entryDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingEntry = await JournalEntry.findOne({
      user: req.user._id,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
    
    if (existingEntry) {
      return res.status(400).json({ error: 'You already have a journal entry for this date. Use update instead.' });
    }
    
    const journalEntry = new JournalEntry({
      ...req.body,
      user: req.user._id
    });
    
    await journalEntry.save();
    res.status(201).json(journalEntry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all journal entries for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'desc' } = req.query;
    const sortOrder = sort === 'asc' ? 1 : -1;
    
    const journalEntries = await JournalEntry.find({ user: req.user._id })
      .sort({ date: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await JournalEntry.countDocuments({ user: req.user._id });
    
    res.json({
      journalEntries,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalEntries: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get journal entries for a specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    // Parse the date as UTC to avoid timezone issues
    const dateString = req.params.date + 'T00:00:00.000Z';
    const date = new Date(dateString);
    
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    const journalEntry = await JournalEntry.findOne({
      user: req.user._id,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
    
    res.json(journalEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get journal entries for a specific date range
router.get('/range/:startDate/:endDate', auth, async (req, res) => {
  try {
    const startDate = new Date(req.params.startDate + 'T00:00:00.000Z');
    const endDate = new Date(req.params.endDate + 'T23:59:59.999Z');
    
    const journalEntries = await JournalEntry.find({
      user: req.user._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });
    
    res.json(journalEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific journal entry
router.get('/:id', auth, async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!journalEntry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    res.json(journalEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a journal entry
router.patch('/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'title', 'content', 'mood', 'tags', 'reflection', 
    'gratitude', 'challenges', 'accomplishments', 
    'isPrivate', 'weather', 'location', 'date'
  ];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    const journalEntry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!journalEntry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    updates.forEach(update => journalEntry[update] = req.body[update]);
    await journalEntry.save();
    res.json(journalEntry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a journal entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const journalEntry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!journalEntry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(journalEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get journal statistics for different time periods
router.get('/stats/:period', auth, async (req, res) => {
  try {
    const { period } = req.params;
    let daysBack;
    
    switch (period) {
      case '7days':
        daysBack = 7;
        break;
      case 'month':
        daysBack = 30;
        break;
      case 'year':
        daysBack = 365;
        break;
      default:
        return res.status(400).json({ error: 'Invalid period. Use 7days, month, or year' });
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const journalEntries = await JournalEntry.find({
      user: req.user._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    const totalEntries = journalEntries.length;
    
    // Calculate mood distribution
    const moodDistribution = journalEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate average content length
    const averageContentLength = totalEntries === 0 ? 0 : 
      Math.round(journalEntries.reduce((sum, entry) => sum + entry.content.length, 0) / totalEntries);
    
    // Calculate streak (consecutive days with entries)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    while (checkDate >= startDate) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const entryExists = journalEntries.some(entry => 
        entry.date >= dayStart && entry.date <= dayEnd
      );
      
      if (entryExists) {
        currentStreak++;
      } else {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    res.json({
      totalEntries,
      averageContentLength,
      moodDistribution,
      currentStreak,
      period: period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search journal entries by content, title, or tags
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search
    
    const journalEntries = await JournalEntry.find({
      user: req.user._id,
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: { $in: [searchRegex] } },
        { reflection: searchRegex }
      ]
    })
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const total = await JournalEntry.countDocuments({
      user: req.user._id,
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: { $in: [searchRegex] } },
        { reflection: searchRegex }
      ]
    });
    
    res.json({
      journalEntries,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalEntries: total,
      searchQuery: query
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get entries by mood
router.get('/mood/:mood', auth, async (req, res) => {
  try {
    const { mood } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const validMoods = ['very_sad', 'sad', 'neutral', 'happy', 'very_happy'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood. Valid moods: ' + validMoods.join(', ') });
    }
    
    const journalEntries = await JournalEntry.find({
      user: req.user._id,
      mood: mood
    })
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const total = await JournalEntry.countDocuments({
      user: req.user._id,
      mood: mood
    });
    
    res.json({
      journalEntries,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalEntries: total,
      mood: mood
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 