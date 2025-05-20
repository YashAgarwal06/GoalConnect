const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// Create a new goal
router.post('/', auth, async (req, res) => {
  try {
    const goal = new Goal({
      ...req.body,
      user: req.user._id
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all goals for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id })
      .sort({ date: 1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get goals for a specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const goals = await Goal.find({
      user: req.user._id,
      date: {
        $gte: new Date(date.setHours(0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59))
      }
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific goal
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a goal
router.patch('/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'date', 'isCompleted', 'notes', 'imageUrl', 'category', 'priority'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    updates.forEach(update => goal[update] = req.body[update]);
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 