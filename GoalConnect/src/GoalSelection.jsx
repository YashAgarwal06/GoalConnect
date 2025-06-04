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
  const [inputValue, setInputValue] = useState(''); // New state for input text
  const [status, setStatus] = useState(null);
  const [currentGoal, setCurrentGoal] = useState(null); // Store the saved goal
  const [isCompleted, setIsCompleted] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(goalOptions); // New state for filtered options
  const [todayGoals, setTodayGoals] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);

  // Check if user already has a goal for today
  useEffect(() => {
    const fetchTodayGoals = async () => {
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
          setTodayGoals(goals.sort((a,b)=>(a.priorityRank??0)-(b.priorityRank??0)));
        }
      } catch (error) {
        console.error('Error fetching today\'s goals:', error);
      }
    };

    fetchTodayGoals();
  }, []);

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
    setInputValue(goal); // Update input value when selecting from dropdown
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Filter options based on input
    const filtered = goalOptions.filter(option =>
      option.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered);
    
    // Show dropdown if there are filtered options and input is not empty
    setIsDropdownOpen(value.length > 0 && filtered.length > 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      setSelectedGoal(inputValue.trim());
      setIsDropdownOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (inputValue.length > 0) {
      setIsDropdownOpen(filteredOptions.length > 0);
    } else {
      setFilteredOptions(goalOptions);
      setIsDropdownOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for option selection
    setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
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
        priority: 'medium',
        priorityRank: todayGoals.length
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
      setTodayGoals(prev => [...prev, {...data, priorityRank: prev.length}]);
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
        setTodayGoals(prev => prev.map(g => g._id === updatedGoal._id ? updatedGoal : g));
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageUploadStatus('❌ Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setImageUploadStatus('❌ Image must be less than 5MB');
        return;
      }

      setImageFile(file);
      setImageUploadStatus(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitImageUpload = async () => {
    if (!imageFile || !currentGoal) return;

    setIsUploadingImage(true);
    setImageUploadStatus('Uploading image...');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(`http://localhost:3001/api/goals/${currentGoal._id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setTodayGoals(prev => prev.map(g => g._id === result.goal._id ? result.goal : g));
        setCurrentGoal(result.goal);
        setIsCompleted(result.goal.isCompleted);
        setImageUploadStatus('✅ Image uploaded! Click to replace');
        setImageFile(null);
        setImagePreview(null);
        // Clear the file input
        const fileInput = document.getElementById('goal-image');
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        setImageUploadStatus(`❌ Upload failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageUploadStatus('❌ Upload failed. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleReplaceImage = () => {
    setImageUploadStatus(null);
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('goal-image');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  };

  const resetSelection = () => {
    setCurrentGoal(null);
    setIsCompleted(false);
    setImageFile(null);
    setImagePreview(null);
    setImageUploadStatus(null);
    setIsUploadingImage(false);
    setStatus(null);
  };

  const openGoalDetails = (goal) => {
    setCurrentGoal(goal);
    setIsCompleted(goal.isCompleted);
    setImageFile(null);
    setImagePreview(null);
    setImageUploadStatus(null);
  };

  const closeGoalDetails = () => {
    setCurrentGoal(null);
    setImageFile(null);
    setImagePreview(null);
    setImageUploadStatus(null);
  };

  const deleteGoal = async (goalId, e) => {
    // stop click bubbling so modal doesn't open
    if (e) e.stopPropagation();
    const confirmDelete = window.confirm('Remove this goal?');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setTodayGoals(prev => prev.filter(g => g._id !== goalId));
        if (currentGoal && currentGoal._id === goalId) {
          closeGoalDetails();
        }
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  // Insert helper to update priority rank on server
  const updateGoalPriority = async (goalId, newRank) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:3001/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priorityRank: newRank })
      });
    } catch (err) {
      console.error('Error updating goal priority:', err);
    }
  };

  const handleDragStart = (index, e) => {
    setDragIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (index, e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...todayGoals];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    reordered.forEach((g, i) => { g.priorityRank = i; });
    setTodayGoals(reordered);
    reordered.forEach(g => updateGoalPriority(g._id, g.priorityRank));
    setDragIndex(null);
  };

  // If user already has a goal for today, show the goal management view
  if (currentGoal) {
    return (
      <div className="goal-selection-container two-column">
        {/* Left – add/select goal */}
        <div className="goal-selection-left">
          <h2>Select / Add Goal for Today</h2>

          {!selectedGoal ? (
            <div className="goal-selection-form" style={{ position: 'relative' }}>
              <div className="custom-dropdown">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="🎯 Type your goal or choose from suggestions..."
                  className={`goal-input ${isDropdownOpen ? 'dropdown-open' : ''}`}
                />
                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>

                {isDropdownOpen && filteredOptions.length > 0 && (
                  <div className="dropdown-options">
                    {filteredOptions.map((goal, index) => (
                      <div
                        key={index}
                        className="dropdown-option-card"
                        onClick={() => handleGoalSelect(goal)}
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
                <button type="submit" className="submit-button">Confirm Goal</button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGoal('');
                    setInputValue('');
                    setFilteredOptions(goalOptions);
                  }}
                  className="back-button"
                >
                  Choose Different Goal
                </button>
              </div>
            </form>
          )}

          {status && <p className="status-message">{status}</p>}
        </div>

        {/* Right – today's goals list */}
        <div className="goal-selection-right">
          <h2>Today's Goals</h2>
          {todayGoals.length > 0 ? (
            <ul className="today-goals-list">
              {todayGoals.map((goal, index) => (
                <li
                  key={goal._id}
                  className={`goal-list-item ${goal.isCompleted ? 'completed' : ''}`}
                  draggable
                  onDragStart={(e)=>handleDragStart(index, e)}
                  onDragOver={handleDragOver}
                  onDrop={(e)=>handleDrop(index, e)}
                  onClick={() => openGoalDetails(goal)}
                >
                  <span className="goal-number">{index+1}.</span>
                  <span className="drag-handle" title="Drag to reorder" onMouseDown={(e)=>e.stopPropagation()}>☰</span>
                  <span className="goal-desc">{goal.description}</span>
                  <div className="goal-icons" onClick={(e)=>e.stopPropagation()}>
                    {goal.isCompleted && <span className="goal-complete-icon" title="Completed">✓</span>}
                    {goal.imageUrl && <span className="goal-image-icon uploaded" title="Memory added"></span>}
                    <span className="goal-delete-icon" title="Remove goal" onClick={(e)=>deleteGoal(goal._id,e)}>🗑️</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No goals yet. Add one on the left!</p>
          )}
        </div>

        {/* Modal for selected goal */}
        {currentGoal && (
          <div className="goal-details-modal">
            <div className="modal-overlay" onClick={closeGoalDetails}></div>
            <div className="modal-content">
              <div className="modal-header">
                <h3>🎯 {currentGoal.description}</h3>
                <button className="close-modal-btn" onClick={closeGoalDetails}>✕</button>
              </div>

              {/* Progress Section */}
              <div className="goal-section">
                <h4 className="section-title"><span className="section-icon">📊</span> Progress</h4>
                <div className="section-content">
                  <label className="completion-toggle">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={toggleCompletion}
                      className="completion-checkbox"
                    />
                    <span className="completion-label">Mark as {isCompleted ? 'Incomplete' : 'Complete'}</span>
                  </label>
                  {isCompleted && <div className="completion-status">✅ Goal Completed! Great job!</div>}
                </div>
              </div>

              {/* Memory Section */}
              <div className="goal-section">
                <h4 className="section-title">Add Memory</h4>
                <div className="section-content">
                  {!currentGoal.imageUrl && !imageFile && (
                    <>
                      <label htmlFor="goal-image" className="upload-button">Choose Photo</label>
                      <input
                        id="goal-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden-file-input"
                      />
                    </>
                  )}

                  {imageFile && imagePreview && (
                    <div className="image-upload-preview">
                      <div className="preview-container">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                        <div className="preview-actions">
                          <button onClick={submitImageUpload} disabled={isUploadingImage} className="submit-image-button">
                            {isUploadingImage ? '⏳ Uploading...' : '✅ Submit Image'}
                          </button>
                          <button
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                              document.getElementById('goal-image').value = '';
                            }}
                            className="cancel-upload-button"
                            disabled={isUploadingImage}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentGoal.imageUrl && (
                    <div className="uploaded-image-container">
                      <div className="uploaded-image-display">
                        <img src={`http://localhost:3001/${currentGoal.imageUrl}`} alt="Goal memory" className="uploaded-image" />
                      </div>
                      <div className="image-status">
                        <span className="success-message">✅ Image uploaded!</span>
                        <button onClick={handleReplaceImage} className="replace-image-button">🔄 Click to replace</button>
                      </div>
                    </div>
                  )}

                  {imageUploadStatus && (
                    <div className={`upload-status ${imageUploadStatus.includes('❌') ? 'error' : imageUploadStatus.includes('✅') ? 'success' : 'info'}`}>{imageUploadStatus}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="goal-selection-container two-column">
      {/* Left – add/select goal */}
      <div className="goal-selection-left">
        <h2>Select / Add Goal for Today</h2>

        {!selectedGoal ? (
          <div className="goal-selection-form" style={{ position: 'relative' }}>
            <div className="custom-dropdown">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="🎯 Type your goal or choose from suggestions..."
                className={`goal-input ${isDropdownOpen ? 'dropdown-open' : ''}`}
              />
              <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>

              {isDropdownOpen && filteredOptions.length > 0 && (
                <div className="dropdown-options">
                  {filteredOptions.map((goal, index) => (
                    <div
                      key={index}
                      className="dropdown-option-card"
                      onClick={() => handleGoalSelect(goal)}
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
              <button type="submit" className="submit-button">Confirm Goal</button>
              <button
                type="button"
                onClick={() => {
                  setSelectedGoal('');
                  setInputValue('');
                  setFilteredOptions(goalOptions);
                }}
                className="back-button"
              >
                Choose Different Goal
              </button>
            </div>
          </form>
        )}

        {status && <p className="status-message">{status}</p>}
      </div>

      {/* Right – today's goals list */}
      <div className="goal-selection-right">
        <h2>Today's Goals</h2>
        {todayGoals.length > 0 ? (
          <ul className="today-goals-list">
            {todayGoals.map((goal, index) => (
              <li
                key={goal._id}
                className={`goal-list-item ${goal.isCompleted ? 'completed' : ''}`}
                draggable
                onDragStart={(e)=>handleDragStart(index, e)}
                onDragOver={handleDragOver}
                onDrop={(e)=>handleDrop(index, e)}
                onClick={() => openGoalDetails(goal)}
              >
                <span className="goal-number">{index+1}.</span>
                <span className="drag-handle" title="Drag to reorder" onMouseDown={(e)=>e.stopPropagation()}>☰</span>
                <span className="goal-desc">{goal.description}</span>
                <div className="goal-icons" onClick={(e)=>e.stopPropagation()}>
                  {goal.isCompleted && <span className="goal-complete-icon" title="Completed">✓</span>}
                  {goal.imageUrl && <span className="goal-image-icon uploaded" title="Memory added"></span>}
                  <span className="goal-delete-icon" title="Remove goal" onClick={(e)=>deleteGoal(goal._id,e)}>🗑️</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No goals yet. Add one on the left!</p>
        )}
      </div>

      {/* Modal for selected goal */}
      {currentGoal && (
        <div className="goal-details-modal">
          <div className="modal-overlay" onClick={closeGoalDetails}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>🎯 {currentGoal.description}</h3>
              <button className="close-modal-btn" onClick={closeGoalDetails}>✕</button>
            </div>

            {/* Progress Section */}
            <div className="goal-section">
              <h4 className="section-title"><span className="section-icon">📊</span> Progress</h4>
              <div className="section-content">
                <label className="completion-toggle">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={toggleCompletion}
                    className="completion-checkbox"
                  />
                  <span className="completion-label">Mark as {isCompleted ? 'Incomplete' : 'Complete'}</span>
                </label>
                {isCompleted && <div className="completion-status">✅ Goal Completed! Great job!</div>}
              </div>
            </div>

            {/* Memory Section */}
            <div className="goal-section">
              <h4 className="section-title">Add Memory</h4>
              <div className="section-content">
                {!currentGoal.imageUrl && !imageFile && (
                  <>
                    <label htmlFor="goal-image" className="upload-button">Choose Photo</label>
                    <input
                      id="goal-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden-file-input"
                    />
                  </>
                )}

                {imageFile && imagePreview && (
                  <div className="image-upload-preview">
                    <div className="preview-container">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <div className="preview-actions">
                        <button onClick={submitImageUpload} disabled={isUploadingImage} className="submit-image-button">
                          {isUploadingImage ? '⏳ Uploading...' : '✅ Submit Image'}
                        </button>
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            document.getElementById('goal-image').value = '';
                          }}
                          className="cancel-upload-button"
                          disabled={isUploadingImage}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {currentGoal.imageUrl && (
                  <div className="uploaded-image-container">
                    <div className="uploaded-image-display">
                      <img src={`http://localhost:3001/${currentGoal.imageUrl}`} alt="Goal memory" className="uploaded-image" />
                    </div>
                    <div className="image-status">
                      <span className="success-message">✅ Image uploaded!</span>
                      <button onClick={handleReplaceImage} className="replace-image-button">🔄 Click to replace</button>
                    </div>
                  </div>
                )}

                {imageUploadStatus && (
                  <div className={`upload-status ${imageUploadStatus.includes('❌') ? 'error' : imageUploadStatus.includes('✅') ? 'success' : 'info'}`}>{imageUploadStatus}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalSelection;