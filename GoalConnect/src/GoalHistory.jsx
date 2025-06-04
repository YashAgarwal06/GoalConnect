import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const GoalHistory = () => {
  const [selectedTimeMetric, setSelectedTimeMetric] = useState('7days');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [dailyGoals, setDailyGoals] = useState([]);
  const [error, setError] = useState(null);
  const [selectedGoalForDetails, setSelectedGoalForDetails] = useState(null);
  const [showGoalDetails, setShowGoalDetails] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [journalEntry, setJournalEntry] = useState(null);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [statistics, setStatistics] = useState({
    totalGoals: 0,
    completedGoals: 0,
    notCompletedGoals: 0,
    completionRate: 0
  });
  
  // Fetch daily goals for selected date
  useEffect(() => {
    const fetchDailyGoals = async () => {
      try {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        const formattedDate = date.toISOString().split('T')[0];
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:3001/api/goals/date/${formattedDate}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter out duplicate goals by description to show only unique tasks
          const uniqueGoals = data.filter((goal, index, self) => 
            index === self.findIndex(g => g.description === goal.description)
          );
          const sortedGoals = uniqueGoals.sort((a,b)=>(a.priorityRank ?? 0)-(b.priorityRank ?? 0));
          setDailyGoals(sortedGoals.map(goal => ({
            id: goal._id,
            title: goal.description,
            completed: goal.isCompleted,
            fullGoalData: goal
          })));
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch goals');
          setDailyGoals([]);
        }
      } catch (error) {
        setError('Failed to connect to the server');
        setDailyGoals([]);
      }
    };

    fetchDailyGoals();
  }, [selectedDate]);

  // Fetch goal statistics for selected time metric
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/goals/stats/${selectedTimeMetric}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStatistics(data);
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch statistics');
        }
      } catch (error) {
        setError('Failed to connect to the server');
      }
    };

    // Only fetch statistics when we're on the stats tab
    if (activeTab === 'stats') {
      fetchStatistics();
    }
  }, [selectedTimeMetric, activeTab]);

  // Calculate current streak
  useEffect(() => {
    const calculateStreak = async () => {
      try {
        const token = localStorage.getItem('token');
        let streak = 0;
        const today = new Date();
        
        // Check each day going backwards from today
        for (let i = 0; i < 30; i++) { // Check last 30 days max
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          checkDate.setHours(0, 0, 0, 0);
          const formattedDate = checkDate.toISOString().split('T')[0];
          
          const response = await fetch(`http://localhost:3001/api/goals/date/${formattedDate}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const goals = await response.json();
            if (goals.length === 0) {
              // No goals set for this day, skip
              continue;
            }
            
            // Check if all goals for this day are completed
            const allCompleted = goals.every(goal => goal.isCompleted);
            if (allCompleted) {
              if (i === streak) { // Consecutive day
                streak++;
              } else {
                break; // Streak broken
              }
            } else {
              break; // Streak broken
            }
          } else {
            break;
          }
        }
        
        setCurrentStreak(streak);
      } catch (error) {
        console.error('Failed to calculate streak:', error);
      }
    };

    calculateStreak();
  }, [dailyGoals, activeTab]); // Recalculate when goals change

  // Function to toggle goal completion
  const toggleGoalCompletion = async (goalId) => {
    try {
      const token = localStorage.getItem('token');
      const goalToUpdate = dailyGoals.find(g => g.id === goalId);
      
      const response = await fetch(`http://localhost:3001/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: !goalToUpdate.completed })
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setDailyGoals(dailyGoals.map(goal => 
          goal.id === goalId 
            ? { ...goal, completed: updatedGoal.isCompleted }
            : goal
        ));
        setError(null);
        
        // Refresh statistics after goal completion change
        if (activeTab === 'stats') {
          const statsResponse = await fetch(`http://localhost:3001/api/goals/stats/${selectedTimeMetric}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStatistics(statsData);
          }
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update goal');
      }
    } catch (error) {
      setError('Failed to connect to the server');
    }
  };

  // Function to fetch and display journal entry for selected date
  const viewJournalReflection = async () => {
    try {
      setLoadingJournal(true);
      const date = new Date(selectedDate);
      date.setHours(0, 0, 0, 0);
      const formattedDate = date.toISOString().split('T')[0];
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/journal/date/${formattedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const entry = await response.json();
        setJournalEntry(entry);
        setShowJournalModal(true);
      } else {
        // No journal entry found for this date
        setJournalEntry(null);
        setShowJournalModal(true);
      }
    } catch (error) {
      setError('Failed to fetch journal entry');
    } finally {
      setLoadingJournal(false);
    }
  };

  // Function to close journal modal
  const closeJournalModal = () => {
    setShowJournalModal(false);
    setJournalEntry(null);
  };

  // Function to handle time metric selection
  const handleTimeMetricChange = (metric) => {
    setSelectedTimeMetric(metric);
  };

  // Function to handle date change in calendar
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  
  // Get completion rate from statistics
  const getCompletionRate = () => {
    return statistics.completionRate;
  };

  // Function to view goal details
  const viewGoalDetails = (goalId) => {
    const goal = dailyGoals.find(g => g.id === goalId);
    if (goal) {
      setSelectedGoalForDetails(goal.fullGoalData);
      setShowGoalDetails(true);
    }
  };

  // Function to close goal details modal
  const closeGoalDetails = () => {
    setShowGoalDetails(false);
    setSelectedGoalForDetails(null);
  };

  // Helper function to format mood emoji
  const getMoodEmoji = (mood) => {
    const moodMap = {
      'very_happy': '😊',
      'happy': '😊',
      'neutral': '😐',
      'sad': '😞',
      'very_sad': '😞'
    };
    return moodMap[mood] || '😐';
  };

  return (
    <div className="goal-history-container">
      <div className="goal-history-header">
        <h1>Memories & Progress History</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="history-tabs">
          <button 
            className={activeTab === 'calendar' ? 'active' : ''} 
            onClick={() => setActiveTab('calendar')}
          >
            Calendar View
          </button>
          <button 
            className={activeTab === 'stats' ? 'active' : ''} 
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
          <button 
            className={activeTab === 'milestones' ? 'active' : ''} 
            onClick={() => setActiveTab('milestones')}
          >
            Milestones
          </button>
        </div>
      </div>
      
      {activeTab === 'calendar' && (
        <div className="calendar-tab-content">
          {/* Streak Display - Moved above calendar */}
          <div className="goal-streak-container">
            <h2>🔥 Current Streak</h2>
            <div className="streak-display">
              {currentStreak > 0 ? (
                <div className="streak-message">
                  <div className="streak-count">{currentStreak}</div>
                  <div className="streak-text">
                    {currentStreak === 1 
                      ? "You have a streak of 1 day where you completed all your goals! Keep it up!" 
                      : `You have a streak of ${currentStreak} days where you have completed all your goals! Amazing consistency! 🎉`
                    }
                  </div>
                </div>
              ) : (
                <div className="streak-message">
                  <div className="streak-count">0</div>
                  <div className="streak-text">
                    Start your streak today by completing all your goals! Every journey begins with a single step. 💪
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="calendar-view">
            <div className="calendar-container">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                className="goal-calendar"
                minDetail="year"
                maxDetail="month"
                maxDate={new Date()}
                navigationLabel={({ date }) => 
                  date.toLocaleString('default', { month: 'long', year: 'numeric' })
                }
              />
            </div>
            
            <div className="selected-date-details">
              <h3>Selected Date: {selectedDate.toDateString()}</h3>
              
              {/* Journal Reflection Button */}
              <div className="journal-section">
                <button 
                  className="journal-reflection-btn"
                  onClick={viewJournalReflection}
                  disabled={loadingJournal}
                >
                  📝 {loadingJournal ? 'Loading...' : 'Open Journal Reflection'}
                </button>
              </div>
              
              <div className="daily-goals">
                <h4>Goals on this day</h4>
                {dailyGoals.length > 0 ? (
                  <div className="goals-button-list">
                    {dailyGoals.map(goal => (
                      <div key={goal.id} className="goal-item-container">
                        <button
                          className={`goal-button ${goal.completed ? 'completed' : ''}`}
                          onClick={() => toggleGoalCompletion(goal.id)}
                        >
                          <span className="goal-check">
                            {goal.completed ? '✓' : ''}
                          </span>
                          <span className="goal-title">{goal.title}</span>
                        </button>
                        <button 
                          className="view-details-btn"
                          onClick={() => viewGoalDetails(goal.id)}
                          title="View Details"
                        >
                          👁️
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-goals-message">No goals set for this date</p>
                )}

                {/* Goal Details Modal */}
                {showGoalDetails && selectedGoalForDetails && (
                  <div className="goal-details-modal">
                    <div className="modal-overlay" onClick={closeGoalDetails}></div>
                    <div className="modal-content">
                      <div className="modal-header">
                        <h3>Goal Details</h3>
                        <button className="close-modal-btn" onClick={closeGoalDetails}>
                          ✕
                        </button>
                      </div>
                      
                      <div className="modal-body">
                        <div className="goal-info">
                          <h4 className="goal-description">
                            🎯 {selectedGoalForDetails.description}
                          </h4>
                          
                          <div className="goal-metadata">
                            <p><strong>Date:</strong> {new Date(selectedGoalForDetails.date).toLocaleDateString()}</p>
                            <p><strong>Category:</strong> {selectedGoalForDetails.category || 'Personal'}</p>
                            <p><strong>Priority:</strong> {selectedGoalForDetails.priority || 'Medium'}</p>
                            <p><strong>Status:</strong> 
                              <span className={`status-badge ${selectedGoalForDetails.isCompleted ? 'completed' : 'pending'}`}>
                                {selectedGoalForDetails.isCompleted ? '✅ Completed' : '⏳ Pending'}
                              </span>
                            </p>
                          </div>

                          {selectedGoalForDetails.notes && (
                            <div className="goal-notes">
                              <h5>📝 Notes:</h5>
                              <p>{selectedGoalForDetails.notes}</p>
                            </div>
                          )}

                          {selectedGoalForDetails.imageUrl && (
                            <div className="goal-image-section">
                              <h5>📷 Memory:</h5>
                              <div className="goal-image-container">
                                <img 
                                  src={`http://localhost:3001/${selectedGoalForDetails.imageUrl}`}
                                  alt="Goal memory"
                                  className="goal-detail-image"
                                />
                                {selectedGoalForDetails.imageMetadata && (
                                  <div className="image-info">
                                    <small>
                                      Original: {selectedGoalForDetails.imageMetadata.originalName} | 
                                      Size: {Math.round(selectedGoalForDetails.imageMetadata.size / 1024)}KB |
                                      Uploaded: {new Date(selectedGoalForDetails.imageMetadata.uploadedAt).toLocaleDateString()}
                                    </small>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {!selectedGoalForDetails.imageUrl && (
                            <div className="no-image-section">
                              <p className="no-image-text">📷 No memory image uploaded for this goal</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Journal Reflection Modal */}
                {showJournalModal && (
                  <div className="journal-modal">
                    <div className="modal-overlay" onClick={closeJournalModal}></div>
                    <div className="modal-content journal-modal-content">
                      <div className="modal-header">
                        <h3>📝 Journal Reflection - {selectedDate.toDateString()}</h3>
                        <button className="close-modal-btn" onClick={closeJournalModal}>
                          ✕
                        </button>
                      </div>
                      
                      <div className="modal-body">
                        {journalEntry ? (
                          <div className="journal-entry-display">
                            {journalEntry.title && (
                              <div className="journal-title">
                                <h4>{journalEntry.title}</h4>
                              </div>
                            )}

                            <div className="journal-mood">
                              <p><strong>Mood:</strong> {getMoodEmoji(journalEntry.mood)} {journalEntry.mood.replace('_', ' ')}</p>
                            </div>

                            <div className="journal-content">
                              <h5>Reflection for Today:</h5>
                              <p className="journal-text">{journalEntry.content}</p>
                            </div>

                            {journalEntry.reflection && (
                              <div className="journal-reflection">
                                <h5>Areas for Improvement:</h5>
                                <p className="journal-text">{journalEntry.reflection}</p>
                              </div>
                            )}

                            {journalEntry.gratitude && journalEntry.gratitude.length > 0 && (
                              <div className="journal-gratitude">
                                <h5>Gratitude:</h5>
                                <ul>
                                  {journalEntry.gratitude.map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {journalEntry.challenges && journalEntry.challenges.length > 0 && (
                              <div className="journal-challenges">
                                <h5>Challenges:</h5>
                                <ul>
                                  {journalEntry.challenges.map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {journalEntry.weather && (
                              <div className="journal-weather">
                                <p><strong>Weather:</strong> {journalEntry.weather}</p>
                              </div>
                            )}

                            {journalEntry.location && (
                              <div className="journal-location">
                                <p><strong>Location:</strong> {journalEntry.location}</p>
                              </div>
                            )}

                            <div className="journal-metadata">
                              <small>
                                Created: {new Date(journalEntry.createdAt).toLocaleString()} |
                                Updated: {new Date(journalEntry.updatedAt).toLocaleString()}
                              </small>
                            </div>
                          </div>
                        ) : (
                          <div className="no-journal-entry">
                            <p>📝 No journal reflection found for {selectedDate.toDateString()}</p>
                            <p>Visit the Journal tab to create a reflection for this day!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'stats' && (
        <div className="stats-view">
          <div className="completion-stats">
            <h2>Goal Completion Rate</h2>
            
            <div className="time-metrics">
              <button 
                className={selectedTimeMetric === '7days' ? 'active' : ''} 
                onClick={() => handleTimeMetricChange('7days')}
              >
                Last 7 Days
              </button>
              <button 
                className={selectedTimeMetric === 'month' ? 'active' : ''} 
                onClick={() => handleTimeMetricChange('month')}
              >
                Last Month
              </button>
              <button 
                className={selectedTimeMetric === 'year' ? 'active' : ''} 
                onClick={() => handleTimeMetricChange('year')}
              >
                Last Year
              </button>
            </div>
            
            <div className="progress-container">
              <div className="progress-label">
                <span>{getCompletionRate()}%</span>
                <span>Time Period: {
                  selectedTimeMetric === '7days' ? 'Last 7 Days' : 
                  selectedTimeMetric === 'month' ? 'Last Month' : 'Last Year'
                }</span>
              </div>
              <div className="goal-stats-details">
                <p>{statistics.completedGoals} out of {statistics.totalGoals} goals completed</p>
                <p>{statistics.notCompletedGoals} goals remaining</p>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getCompletionRate()}%` }}></div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalHistory; 