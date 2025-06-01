import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const GoalHistory = () => {
  const [selectedTimeMetric, setSelectedTimeMetric] = useState('7days');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [dailyGoals, setDailyGoals] = useState([]);
  const [error, setError] = useState(null);
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
          setDailyGoals(data.map(goal => ({
            id: goal._id,
            title: goal.description,
            completed: goal.isCompleted
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

  return (
    <div className="goal-history-container">
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
      
      {activeTab === 'calendar' && (
        <div className="calendar-view">
          <div className="calendar-container">
            <Calendar
              onChange={handleDateChange}
              // onActiveStartDateChange={(activeStartDate) => handleArrowClick(activeStartDate)}
              value={selectedDate}
              // tileContent={renderCalendarTileContent}
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
            <div className="daily-goals">
              <h4>Goals on this day</h4>
              {dailyGoals.length > 0 ? (
                <div className="goals-button-list">
                  {dailyGoals.map(goal => (
                    <button
                      key={goal.id}
                      className={`goal-button ${goal.completed ? 'completed' : ''}`}
                      onClick={() => toggleGoalCompletion(goal.id)}
                    >
                      <span className="goal-check">
                        {goal.completed ? '✓' : ''}
                      </span>
                      <span className="goal-title">{goal.title}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="no-goals-message">No goals set for this date</p>
              )}
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