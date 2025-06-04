const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images';
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'goal-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Create a new goal
router.post('/', auth, async (req, res) => {
  try {
    const { description, date } = req.body;
    
    // Check if a goal with the same description already exists for this user on this date
    const goalDate = new Date(date);
    const startOfDay = new Date(goalDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(goalDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingGoal = await Goal.findOne({
      user: req.user._id,
      description: description,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
    
    if (existingGoal) {
      return res.status(400).json({ error: 'You already have this goal for today' });
    }
    
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
    // Parse the date as UTC to avoid timezone issues
    const dateString = req.params.date + 'T00:00:00.000Z';
    const date = new Date(dateString);
    
    const startOfDay = new Date(date);
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    const goals = await Goal.find({
      user: req.user._id,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
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
  const allowedUpdates = ['description', 'date', 'isCompleted', 'notes', 'imageUrl', 'imageMetadata'];
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

// Get goal statistics for different time periods
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
      case 'all':
        // Return all-time statistics for milestones
        const allGoals = await Goal.find({
          user: req.user._id
        });
        
        const totalGoals = allGoals.length;
        const completedGoals = allGoals.filter(goal => goal.isCompleted).length;
        const completionRate = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);
        
        return res.json({
          totalGoals,
          completedGoals,
          notCompletedGoals: totalGoals - completedGoals,
          completionRate
        });
      default:
        return res.status(400).json({ error: 'Invalid period. Use 7days, month, year, or all' });
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const goals = await Goal.find({
      user: req.user._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.isCompleted).length;
    const completionRate = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);
    
    res.json({
      totalGoals,
      completedGoals,
      notCompletedGoals: totalGoals - completedGoals,
      completionRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload image for a specific goal
router.post('/:id/upload-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      // If goal not found, delete the uploaded file to clean up
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Goal not found' });
    }

    // If goal already has an image, delete the old one
    if (goal.imageUrl) {
      const oldImagePath = goal.imageUrl;
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update goal with new image URL
    goal.imageUrl = req.file.path;
    goal.imageMetadata = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };
    await goal.save();

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: goal.imageUrl,
      imageMetadata: goal.imageMetadata,
      goal: goal
    });
  } catch (error) {
    // If there's an error and a file was uploaded, clean it up
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete image from a specific goal
router.delete('/:id/image', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (!goal.imageUrl) {
      return res.status(400).json({ error: 'Goal has no image to delete' });
    }

    // Delete the image file from filesystem
    if (fs.existsSync(goal.imageUrl)) {
      fs.unlinkSync(goal.imageUrl);
    }

    // Remove image URL from goal
    goal.imageUrl = undefined;
    goal.imageMetadata = undefined;
    await goal.save();

    res.json({
      message: 'Image deleted successfully',
      goal: goal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 