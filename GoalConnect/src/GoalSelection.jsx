import React, { useState, useEffect } from 'react';
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
  const [currentGoal, setCurrentGoal] = useState(null); // Store the saved goal
  const [isCompleted, setIsCompleted] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check if user already has a goal for today
  useEffect(() => {
    const fetchTodayGoal = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`http://localhost:3001/api/goals/date/${today}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const goals = await response.json();
          if (goals.length > 0) {
            setCurrentGoal(goals[0]);
            setIsCompleted(goals[0].isCompleted);
          }
        }
      } catch (error) {
        console.error('Error fetching today\'s goal:', error);
      }
    };

    fetchTodayGoal();
  }, []);

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGoal) {
      setStatus('⚠️ Please select a goal.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('❌ Please log in first.');
      return;
    }

    // Check if this goal already exists for today
    try {
      const today = new Date().toISOString().split('T')[0];
      const checkResponse = await fetch(`http://localhost:3001/api/goals/date/${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (checkResponse.ok) {
        const existingGoals = await checkResponse.json();
        const duplicateGoal = existingGoals.find(goal => 
          goal.description.trim().toLowerCase() === selectedGoal.trim().toLowerCase()
        );
        if (duplicateGoal) {
          setStatus('⚠️ You already have this goal for today!');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking existing goals:', error);
      // Continue with submission even if check fails, backend will handle it
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
      setCurrentGoal(data);
      setIsCompleted(data.isCompleted);
      setStatus(`✅ Goal submitted successfully!`);
      setSelectedGoal('');
    } catch (err) {
      console.error(err);
      setStatus(`❌ Error submitting goal: ${err.message}`);
    }
  };

  const toggleCompletion = async () => {
    if (!currentGoal) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3001/api/goals/${currentGoal._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: !isCompleted })
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setCurrentGoal(updatedGoal);
        setIsCompleted(updatedGoal.isCompleted);
      }
    } catch (error) {
      console.error('Error updating goal completion:', error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // For now, just store the file name as imageUrl
      const reader = new FileReader();
      reader.onload = () => {
        updateGoalImage(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateGoalImage = async (imageUrl) => {
    if (!currentGoal) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3001/api/goals/${currentGoal._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl })
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setCurrentGoal(updatedGoal);
      }
    } catch (error) {
      console.error('Error updating goal image:', error);
    }
  };

  const resetSelection = () => {
    setCurrentGoal(null);
    setIsCompleted(false);
    setImageFile(null);
    setStatus(null);
  };

  // If user already has a goal for today, show the goal management view
  if (currentGoal) {
    return (
      <div className="goal-selection-container">
        <h2>Your Goal for Today</h2>
        <div className="current-goal-view">
          <div className="goal-card selected-goal-card">
            <h3>{currentGoal.description}</h3>
            
            <div className="goal-management-sections">
              <div className="completion-section">
                <h4>Progress</h4>
                <label className="completion-toggle">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={toggleCompletion}
                  />
                  <span className="checkmark"></span>
                  Mark as {isCompleted ? 'Incomplete' : 'Complete'}
                </label>
                {isCompleted && <span className="completion-status">✅ Completed!</span>}
              </div>
              
              <div className="image-section">
                <h4>Add Memory</h4>
                <div className="image-upload-area">
                  <label htmlFor="goal-image" className="image-upload-label">
                    📷 Upload Photo
                  </label>
                  <input
                    id="goal-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="image-upload-input"
                  />
                  {currentGoal.imageUrl && (
                    <div className="uploaded-image-info">
                      <span className="image-icon">🖼️</span>
                      <span className="image-name">{currentGoal.imageUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="goal-actions-bottom" style={{ marginTop: '20px' }}>
            <button onClick={resetSelection} className="reset-button">
              Choose Different Goal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="goal-selection-container">
      <h2>Select Your Goal for Today</h2>
      
      {!selectedGoal ? (
        <div className="goal-selection-form" style={{ position: 'relative' }}>
          <div className="custom-dropdown">
            <div 
              className="dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'border-color 0.3s ease',
                borderColor: isDropdownOpen ? '#4CAF50' : '#e1e5e9'
              }}
            >
              <span style={{ color: selectedGoal ? '#333' : '#6c757d' }}>
                {selectedGoal || '🎯 Choose your goal for today...'}
              </span>
              <span style={{ 
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </span>
            </div>
            
            {isDropdownOpen && (
              <div 
                className="dropdown-options"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  backgroundColor: 'white',
                  border: '2px solid #e1e5e9',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {goalOptions.map((goal, index) => (
                  <div
                    key={index}
                    className="dropdown-option-card"
                    onClick={() => handleGoalSelect(goal)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: index < goalOptions.length - 1 ? '1px solid #f1f3f4' : 'none',
                      transition: 'background-color 0.2s ease',
                      fontSize: '15px',
                      backgroundColor: 'white'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    {goal}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="goal-confirmation">
          <div className="selected-goal-preview">
            <h3>Selected Goal:</h3>
            <p>{selectedGoal}</p>
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              Confirm Goal
            </button>
            <button 
              type="button" 
              onClick={() => setSelectedGoal('')}
              className="back-button"
            >
              Choose Different Goal
            </button>
          </div>
        </form>
      )}
      
      {status && <p className="status-message">{status}</p>}
    </div>
  );
}

export default GoalSelection;