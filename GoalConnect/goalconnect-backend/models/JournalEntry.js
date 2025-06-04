const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxLength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 5000
  },
  mood: {
    type: String,
    enum: ['very_sad', 'sad', 'neutral', 'happy', 'very_happy'],
    default: 'neutral'
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: 50
  }],
  reflection: {
    type: String,
    trim: true,
    maxLength: 2000
  },
  gratitude: [{
    type: String,
    trim: true,
    maxLength: 200
  }],
  challenges: [{
    type: String,
    trim: true,
    maxLength: 200
  }],
  accomplishments: [{
    type: String,
    trim: true,
    maxLength: 200
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  weather: {
    type: String,
    trim: true,
    maxLength: 50
  },
  location: {
    type: String,
    trim: true,
    maxLength: 100
  }
}, {
  timestamps: true
});

// Index for faster queries by user and date
journalEntrySchema.index({ user: 1, date: 1 });

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

module.exports = JournalEntry; 