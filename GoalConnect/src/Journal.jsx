import React, { useState, useEffect } from 'react';
import './Journal.css';

const Journal = () => {
  const [mood, setMood] = useState('');
  const [reflection, setReflection] = useState('');
  const [improvement, setImprovement] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Load saved entry on mount
  useEffect(() => {
    const saved = localStorage.getItem('journalEntry');
    if (saved) {
      const entry = JSON.parse(saved);
      setMood(entry.mood || '');
      setReflection(entry.reflection || '');
      setImprovement(entry.improvement || '');
    }
  }, []);

  // Save current entry
  const handleSave = () => {
    const journalEntry = {
      date: new Date().toISOString().split('T')[0],
      mood,
      reflection,
      improvement
    };

    localStorage.setItem('journalEntry', JSON.stringify(journalEntry));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="journal-container">
      <h1>📝 Daily Reflection</h1>

      <div className="mood-section">
        <label>How do you feel after working on your goal?</label>
        <div className="mood-buttons">
          <button className={mood === 'positive' ? 'selected' : ''} onClick={() => setMood('positive')}>😊</button>
          <button className={mood === 'neutral' ? 'selected' : ''} onClick={() => setMood('neutral')}>😐</button>
          <button className={mood === 'negative' ? 'selected' : ''} onClick={() => setMood('negative')}>😞</button>
        </div>
      </div>

      <div className="reflection-section">
        <label>Write about today’s goal progress:</label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Today I..."
          rows="6"
        />
      </div>

      <div className="improvement-section">
        <label>What could you improve on?</label>
        <input
          type="text"
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
          placeholder="Next time I could..."
        />
      </div>

      <div className="journal-save-container">
        <button
          className="save-journal-button"
          onClick={handleSave}
          disabled={!mood || !reflection}
        >
          ✏️ {isSaved ? 'Saved!' : 'Save Reflection'}
        </button>
      </div>
    </div>
  );
};

export default Journal;
