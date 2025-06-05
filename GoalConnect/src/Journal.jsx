import React, { useState, useEffect } from 'react';
import './Journal.css';

const Journal = () => {
  const [mood, setMood] = useState('neutral');
  const [reflection, setReflection] = useState('');
  const [improvement, setImprovement] = useState('');
  const [title, setTitle] = useState('');
  const [gratitude, setGratitude] = useState(['']);
  const [challenges, setChallenges] = useState(['']);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingEntryId, setExistingEntryId] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  // Load existing journal entry for today on mount
  useEffect(() => {
    const loadTodaysEntry = async () => {
      try {
        setIsLoading(true);
        // Use consistent date handling - create date in UTC
        const today = new Date();
        const utcDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dateString = utcDate.toISOString().split('T')[0];
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/api/journal/date/${dateString}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const entry = await response.json();
          if (entry) {
            // Map backend mood to frontend mood
            const frontendMood = mapMoodFromBackend(entry.mood);
            setMood(frontendMood);
            setReflection(entry.content || '');
            setImprovement(entry.reflection || '');
            setTitle(entry.title || '');
            setGratitude(entry.gratitude && entry.gratitude.length > 0 ? entry.gratitude : ['']);
            setChallenges(entry.challenges && entry.challenges.length > 0 ? entry.challenges : ['']);
            setExistingEntryId(entry._id);
          }
        }
        setError(null);
      } catch (error) {
        console.error('Error loading journal entry:', error);
        setError('Failed to load existing journal entry');
      } finally {
        setIsLoading(false);
      }
    };

    loadTodaysEntry();
  }, []);

  // Helper function to add item to array
  const addArrayItem = (setter, array) => {
    setter([...array, '']);
  };

  // Helper function to update array item
  const updateArrayItem = (setter, array, index, value) => {
    const newArray = [...array];
    newArray[index] = value;
    setter(newArray);
  };

  // Helper function to remove array item
  const removeArrayItem = (setter, array, index) => {
    if (array.length > 1) {
      const newArray = array.filter((_, i) => i !== index);
      setter(newArray);
    }
  };

  // Map frontend mood values to backend enum values
  const mapMoodToBackend = (frontendMood) => {
    const moodMap = {
      'positive': 'happy',
      'neutral': 'neutral',
      'negative': 'sad'
    };
    return moodMap[frontendMood] || 'neutral';
  };

  // Map backend mood values to frontend values
  const mapMoodFromBackend = (backendMood) => {
    const moodMap = {
      'very_happy': 'positive',
      'happy': 'positive',
      'neutral': 'neutral',
      'sad': 'negative',
      'very_sad': 'negative'
    };
    return moodMap[backendMood] || 'neutral';
  };

  // Save journal entry
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use consistent date handling - create date in UTC
      const today = new Date();
      const utcDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dateString = utcDate.toISOString().split('T')[0];
      const token = localStorage.getItem('token');
      
      console.log('Saving journal entry...', { existingEntryId, dateString });
      
      // Filter out empty strings from arrays
      const filteredGratitude = gratitude.filter(item => item.trim() !== '');
      const filteredChallenges = challenges.filter(item => item.trim() !== '');

      const journalEntry = {
        date: dateString,
        title: title.trim(),
        content: reflection.trim(),
        mood: mapMoodToBackend(mood),
        reflection: improvement.trim(),
        gratitude: filteredGratitude,
        challenges: filteredChallenges
      };

      console.log('Journal entry data:', journalEntry);

      let response;
      
      if (existingEntryId) {
        // Update existing entry
        console.log('Updating existing entry:', existingEntryId);
        response = await fetch(`${API_BASE_URL}/api/journal/${existingEntryId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(journalEntry)
        });
      } else {
        // Create new entry
        console.log('Creating new entry');
        response = await fetch(`${API_BASE_URL}/api/journal`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(journalEntry)
        });
      }

      console.log('Response status:', response.status);

      if (response.ok) {
        const savedEntry = await response.json();
        console.log('Entry saved successfully:', savedEntry);
        setExistingEntryId(savedEntry._id);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        setError(errorData.error || 'Failed to save journal entry');
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      setError('Failed to save journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="journal-container">
      <h1>📝 Daily Reflection</h1>

      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading-message">Loading...</div>}

      <div className="journal-form">
        <div className="mood-section">
          <label>How do you feel after working on your goal(s)?</label>
          <div className="mood-buttons">
            <button 
              className={mood === 'positive' ? 'selected' : ''} 
              onClick={() => setMood('positive')}
              disabled={isLoading}
            >
              😊
            </button>
            <button 
              className={mood === 'neutral' ? 'selected' : ''} 
              onClick={() => setMood('neutral')}
              disabled={isLoading}
            >
              😐
            </button>
            <button 
              className={mood === 'negative' ? 'selected' : ''} 
              onClick={() => setMood('negative')}
              disabled={isLoading}
            >
              😞
            </button>
          </div>
        </div>

        <div className="title-section">
          <label>Title (Optional):</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Today's reflection title..."
            maxLength="200"
            disabled={isLoading}
          />
        </div>

        <div className="reflection-section">
          <label>Reflection for Today:</label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Today I..."
            rows="6"
            maxLength="5000"
            disabled={isLoading}
          />
          <small>{reflection.length}/5000 characters</small>
        </div>

        <div className="improvement-section">
          <label>What could you improve on?</label>
          <textarea
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            placeholder="Next time I could..."
            rows="3"
            maxLength="2000"
            disabled={isLoading}
          />
          <small>{improvement.length}/2000 characters</small>
        </div>

        <div className="gratitude-section">
          <label>What are you grateful for today?</label>
          {gratitude.map((item, index) => (
            <div key={index} className="array-input-container">
              <input
                type="text"
                value={item}
                onChange={(e) => updateArrayItem(setGratitude, gratitude, index, e.target.value)}
                placeholder="I'm grateful for..."
                maxLength="200"
                disabled={isLoading}
              />
              {gratitude.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeArrayItem(setGratitude, gratitude, index)}
                  className="remove-item-btn"
                  disabled={isLoading}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => addArrayItem(setGratitude, gratitude)}
            className="add-item-btn"
            disabled={isLoading}
          >
            + Add another gratitude
          </button>
        </div>

        <div className="challenges-section">
          <label>What challenges did you face?</label>
          {challenges.map((item, index) => (
            <div key={index} className="array-input-container">
              <input
                type="text"
                value={item}
                onChange={(e) => updateArrayItem(setChallenges, challenges, index, e.target.value)}
                placeholder="A challenge I faced was..."
                maxLength="200"
                disabled={isLoading}
              />
              {challenges.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeArrayItem(setChallenges, challenges, index)}
                  className="remove-item-btn"
                  disabled={isLoading}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => addArrayItem(setChallenges, challenges)}
            className="add-item-btn"
            disabled={isLoading}
          >
            + Add another challenge
          </button>
        </div>

        <div className="journal-save-container">
          <button
            className="save-journal-button"
            onClick={handleSave}
            disabled={!reflection.trim() || isLoading}
          >
            ✏️ {isLoading ? 'Saving...' : (isSaved ? 'Saved!' : (existingEntryId ? 'Update Reflection' : 'Save Reflection'))}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Journal;
