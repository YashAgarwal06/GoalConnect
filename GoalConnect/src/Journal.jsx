import React, { useState } from 'react';

const Journal = () => {
  const [mood, setMood] = useState('');
  const [reflection, setReflection] = useState('');
  const [improvement, setImprovement] = useState('');

  return (
    <div className="journal-container">
      <h1>📝 Daily Reflection</h1>

      {/* Mood Selection */}
      <div className="mood-section">
        <label>How do you feel after working on your goal?</label>
        <div className="mood-buttons">
          <button 
            className={mood === 'positive' ? 'selected' : ''}
            onClick={() => setMood('positive')}
          >😊 Positive</button>

          <button 
            className={mood === 'neutral' ? 'selected' : ''}
            onClick={() => setMood('neutral')}
          >😐 Neutral</button>

          <button 
            className={mood === 'negative' ? 'selected' : ''}
            onClick={() => setMood('negative')}
          >😞 Negative</button>
        </div>
      </div>

      {/* Reflection Text */}
      <div className="reflection-section">
        <label>Write about today’s goal progress:</label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Today I..."
          rows="6"
        />
      </div>

      {/* Improvement Text */}
      <div className="improvement-section">
        <label>What could you improve on?</label>
        <input
          type="text"
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
          placeholder="Next time I could..."
        />
      </div>
    </div>
  );
};

export default Journal;
