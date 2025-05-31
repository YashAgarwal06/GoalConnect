import React, { useState } from 'react';
import './GoalSelection.css';

const goalOptions = [
  'Exercise or move your body',
  'Practice mindfulness or meditation',
  'Read or learn something new',
  'Work on a personal project',
  'Connect with someone (message, call, etc.)',
  'Eat healthy or cook a meal',
  'Take a break or rest intentionally',
  'Limit distractions or screen time',
  'Journal or reflect on your day',
  'Sleep well or stick to a sleep schedule',
];

function GoalSelection() {
  const [selectedGoal, setSelectedGoal] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGoal) {
      setStatus('⚠️ Please select a goal.');
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('❌ Please log in first.');
      return;
    }

    setStatus('Submitting...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const goalData = {
        description: selectedGoal,
        date: today,
        category: 'personal',
        priority: 'medium'
      };

      const res = await fetch('http://localhost:3001/api/goals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit goal');
      }

      const data = await res.json();
      setStatus(`✅ Goal submitted successfully! Your goal "${selectedGoal}" has been saved.`);
      setSelectedGoal(''); // Clear selection after successful submission
    } catch (err) {
      console.error(err);
      setStatus(`❌ Error submitting goal: ${err.message}`);
    }
  };

  return (
    <div className="goal-selection-container">
      <h2>Select Your Goal for Today</h2>
      <form onSubmit={handleSubmit}>
        <select
          value={selectedGoal}
          onChange={(e) => setSelectedGoal(e.target.value)}
          className="goal-dropdown"
        >
          <option value="">-- Choose a General Goal --</option>
          {goalOptions.map((goal, index) => (
            <option key={index} value={goal}>
              {goal}
            </option>
          ))}
        </select>
        <button type="submit" className="submit-button">
          Submit Goal
        </button>
      </form>
      {status && <p className="status-message">{status}</p>}
    </div>
  );
}

export default GoalSelection;