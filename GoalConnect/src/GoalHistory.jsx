import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
  const [milestones, setMilestones] = useState({
    totalCompletedGoals: 0,
    longestStreak: 0,
    weeklyStreaks: 0,
    monthlyGoals: 0
  });
  
  // Fetch daily goals for selected date
  useEffect(() => {
    const fetchDailyGoals = async () => {
      try {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        const formattedDate = date.toISOString().split('T')[0];
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/api/goals/date/${formattedDate}`, {
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
          const sortedGoals = uniqueGoals;
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
        const response = await fetch(`${API_BASE_URL}/api/goals/stats/${selectedTimeMetric}`, {
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
          
          const response = await fetch(`${API_BASE_URL}/api/goals/date/${formattedDate}`, {
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

  // Calculate milestones data
  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Please log in to view milestones');
          return;
        }
        
        // Try the new stats/all endpoint first
        let response = await fetch(`${API_BASE_URL}/api/goals/stats/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let data;
        if (response.ok) {
          data = await response.json();
        } else {
          // Fallback: get all goals and calculate manually
          response = await fetch(`${API_BASE_URL}/api/goals`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const allGoals = await response.json();
            
            // Calculate stats manually
            const totalGoals = allGoals.length;
            const completedGoals = allGoals.filter(goal => goal.isCompleted).length;
            const completionRate = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);
            
            data = {
              totalGoals,
              completedGoals,
              notCompletedGoals: totalGoals - completedGoals,
              completionRate
            };
          } else {
            const errorData = await response.json();
            setError(`Failed to fetch goal data: ${errorData.error || 'Unknown error'}`);
            return;
          }
        }
        
        if (data) {
          // Calculate longest streak - simplified for now
          let longestStreak = currentStreak; // Start with current streak as minimum
          
          const newMilestones = {
            totalCompletedGoals: data.completedGoals || 0,
            longestStreak: longestStreak,
            weeklyStreaks: Math.floor((data.completedGoals || 0) / 7),
            monthlyGoals: data.completedGoals || 0
          };
          
          setMilestones(newMilestones);
          setError(null); // Clear any previous errors
        }
      } catch (error) {
        setError(`Failed to connect to server: ${error.message}`);
      }
    };

    // Only fetch milestones when we're on the milestones tab
    if (activeTab === 'milestones') {
      fetchMilestones();
    }
  }, [activeTab, currentStreak]);

  // Function to toggle goal completion
  const toggleGoalCompletion = async (goalId) => {
    try {
      const token = localStorage.getItem('token');
      const goalToUpdate = dailyGoals.find(g => g.id === goalId);
      
      const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
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
          const statsResponse = await fetch(`${API_BASE_URL}/api/goals/stats/${selectedTimeMetric}`, {
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
      
              const response = await fetch(`${API_BASE_URL}/api/journal/date/${formattedDate}`, {
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

  // Milestone achievement checker
  const getMilestoneAchievements = () => {
    const achievements = [];
    const { totalCompletedGoals, longestStreak } = milestones;

    // Goal completion milestones
    if (totalCompletedGoals >= 100) {
      achievements.push({
        id: 'goals_100',
        title: 'Goal Crushing Legend!',
        message: '100 GOALS COMPLETED! You\'ve officially entered legendary status! Your consistency and determination are inspiring. You\'re not just achieving goals - you\'re mastering the art of personal growth!',
        icon: '👑',
        level: 'legendary',
        achieved: true,
        progress: totalCompletedGoals,
        target: 100
      });
    } else if (totalCompletedGoals >= 50) {
      achievements.push({
        id: 'goals_50',
        title: 'Momentum Master!',
        message: 'Wow! 50 goals completed! You\'re not just setting goals, you\'re crushing them! Your dedication is turning dreams into achievements. Keep this incredible momentum going!',
        icon: '🚀',
        level: 'master',
        achieved: true,
        progress: totalCompletedGoals,
        target: 50
      });
    } else if (totalCompletedGoals >= 10) {
      achievements.push({
        id: 'goals_10',
        title: 'First Steps Champion!',
        message: 'You\'ve completed 10 goals! You\'re proving that small consistent actions lead to big changes. The journey of a thousand miles begins with a single step - and you\'ve taken 10!',
        icon: '🎉',
        level: 'champion',
        achieved: true,
        progress: totalCompletedGoals,
        target: 10
      });
    }

    // Add next milestone if not at max
    if (totalCompletedGoals < 10) {
      achievements.push({
        id: 'goals_10_next',
        title: 'First Steps Champion',
        message: 'Complete 10 goals to earn your first milestone! Every expert was once a beginner.',
        icon: '🎯',
        level: 'upcoming',
        achieved: false,
        progress: totalCompletedGoals,
        target: 10
      });
    } else if (totalCompletedGoals < 50) {
      achievements.push({
        id: 'goals_50_next',
        title: 'Momentum Master',
        message: 'You\'re on your way to becoming a Momentum Master! Only ' + (50 - totalCompletedGoals) + ' more goals to go!',
        icon: '🚀',
        level: 'upcoming',
        achieved: false,
        progress: totalCompletedGoals,
        target: 50
      });
    } else if (totalCompletedGoals < 100) {
      achievements.push({
        id: 'goals_100_next',
        title: 'Goal Crushing Legend',
        message: 'You\'re approaching legendary status! Only ' + (100 - totalCompletedGoals) + ' more goals until you become a Goal Crushing Legend!',
        icon: '👑',
        level: 'upcoming',
        achieved: false,
        progress: totalCompletedGoals,
        target: 100
      });
    }

    // Streak milestones
    if (longestStreak >= 30) {
      achievements.push({
        id: 'streak_30',
        title: 'Monthly Master!',
        message: `30+ days of goal completion! You've built a habit that can last a lifetime. Your longest streak is ${longestStreak} days!`,
        icon: '🏆',
        level: 'master',
        achieved: true,
        progress: longestStreak,
        target: 30
      });
    } else if (longestStreak >= 7) {
      achievements.push({
        id: 'streak_7',
        title: 'Week Warrior!',
        message: `A full week+ of completed goals! Your longest streak is ${longestStreak} days. You've proven you can maintain consistency!`,
        icon: '⚡',
        level: 'warrior',
        achieved: true,
        progress: longestStreak,
        target: 7
      });
    } else if (longestStreak >= 3) {
      achievements.push({
        id: 'streak_3',
        title: 'Consistency Starter!',
        message: `You've got a ${longestStreak}-day streak! Small flames become roaring fires. Keep feeding this beautiful habit!`,
        icon: '🔥',
        level: 'starter',
        achieved: true,
        progress: longestStreak,
        target: 3
      });
    }

    // Current streak achievement
    if (currentStreak > 0) {
      achievements.push({
        id: 'current_streak',
        title: 'Current Streak Champion!',
        message: `You're currently on a ${currentStreak}-day streak! Every day you maintain your streak, you're building mental muscles that make the next day easier!`,
        icon: '💪',
        level: 'current',
        achieved: true,
        progress: currentStreak,
        target: currentStreak
      });
    }

    return achievements.sort((a, b) => {
      // Sort by achieved first, then by level priority
      if (a.achieved !== b.achieved) return b.achieved - a.achieved;
      const levelOrder = { legendary: 4, master: 3, champion: 2, warrior: 2, starter: 1, current: 0, upcoming: -1 };
      return (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0);
    });
  };

  // Prevent body scroll when modals are open to avoid layout shifts/glitches
  useEffect(() => {
    const shouldLockScroll = showGoalDetails || showJournalModal;
    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showGoalDetails, showJournalModal]);

  return (
    <div className={`goal-history-container ${showGoalDetails || showJournalModal ? 'modal-active' : ''}`}>
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
                                  src={`${API_BASE_URL}/${selectedGoalForDetails.imageUrl}`}
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
                                <div className="gratitude-items">
                                  {journalEntry.gratitude.map((item, index) => (
                                    <div key={index} className="gratitude-item">
                                      <div className="gratitude-icon">💝</div>
                                      <div className="gratitude-text">{item}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {journalEntry.challenges && journalEntry.challenges.length > 0 && (
                              <div className="journal-challenges">
                                <h5>Challenges:</h5>
                                <div className="challenges-items">
                                  {journalEntry.challenges.map((item, index) => (
                                    <div key={index} className="challenge-item">
                                      <div className="challenge-icon">💪</div>
                                      <div className="challenge-text">{item}</div>
                                    </div>
                                  ))}
                                </div>
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

      {activeTab === 'milestones' && (
        <div className="milestones-view">
          <h2>🏆 Your Achievements</h2>
          <p className="milestone-subtitle">Celebrate your journey and see how far you've come!</p>
          
          <div className="milestone-summary">
            <div className="milestone-stat">
              <div className="stat-number">{milestones.totalCompletedGoals}</div>
              <div className="stat-label">Goals Completed</div>
            </div>
            <div className="milestone-stat">
              <div className="stat-number">{milestones.longestStreak}</div>
              <div className="stat-label">Longest Streak</div>
            </div>
            <div className="milestone-stat">
              <div className="stat-number">{currentStreak}</div>
              <div className="stat-label">Current Streak</div>
            </div>
          </div>

          <div className="milestone-grid">
            {getMilestoneAchievements().map((achievement) => (
              <div 
                key={achievement.id}
                className={`milestone-card ${achievement.achieved ? 'achieved' : 'upcoming'} ${achievement.level}`}
              >
                <div className="milestone-header">
                  <div className="milestone-icon">{achievement.icon}</div>
                  <div className="milestone-level">{achievement.level}</div>
                </div>
                
                <h3 className="milestone-title">{achievement.title}</h3>
                <p className="milestone-message">{achievement.message}</p>
                
                {!achievement.achieved && (
                  <div className="milestone-progress">
                    <div className="progress-text">
                      {achievement.progress} / {achievement.target}
                    </div>
                    <div className="progress-bar-milestone">
                      <div 
                        className="progress-fill-milestone" 
                        style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {achievement.achieved && (
                  <div className="achievement-badge">
                    <span className="badge-text">✅ ACHIEVED!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {getMilestoneAchievements().filter(a => a.achieved).length === 0 && (
            <div className="no-milestones">
              <div className="no-milestones-icon">🌟</div>
              <h3>Start Your Journey!</h3>
              <p>Start unlocking achievements! Every great journey begins with a single step!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalHistory; 