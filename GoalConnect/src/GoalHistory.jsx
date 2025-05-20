import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const GoalHistory = () => {
  const [selectedTimeMetric, setSelectedTimeMetric] = useState('7days');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [dailyGoals, setDailyGoals] = useState([]);
  
  // Fetch daily goals for selected date
  useEffect(() => {
    const fetchDailyGoals = async () => {
      try {
        const response = await fetch(`put some url here`);
        if (response.ok) {
          const data = await response.json();
          setDailyGoals(data.goals || []);
        } else {
          console.error('Failed to fetch daily goals');
          // If API fails, use sample data
          setDailyGoals([
            { id: 1, title: 'Morning meditation', completed: false },
            { id: 2, title: 'Read for 30 minutes', completed: false },
            { id: 3, title: 'Complete workout routine', completed: false }
          ]);
        }
      } catch (error) {
        console.error('Error fetching daily goals:', error);
        // If API fails, use sample data
        setDailyGoals([
          { id: 1, title: 'Morning meditation', completed: false },
          { id: 2, title: 'Read for 30 minutes', completed: false },
          { id: 3, title: 'Complete workout routine', completed: false }
        ]);
      }
    };

    fetchDailyGoals();
  }, [selectedDate]);

  // Function to toggle goal completion
  const toggleGoalCompletion = async (goalId) => {
    try {
      const updatedGoals = dailyGoals.map(goal => 
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      );
      setDailyGoals(updatedGoals);

      // Send update to backend
      const goalToUpdate = updatedGoals.find(g => g.id === goalId);
      const response = await fetch(`put some url here`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: goalToUpdate.completed })
      });

      if (!response.ok) {
        // If update fails, revert the change
        // setDailyGoals(dailyGoals);
        console.error('Failed to update goal completion status');
      }
    } catch (error) {
      // If update fails, revert the change
      // setDailyGoals(dailyGoals);
      console.error('Error updating goal completion:', error);
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
  
  // Calculate completion rate based on selected time metric (would be replaced by backend data)
  const getCompletionRate = () => {
    return 50;

  return (
    <div className="goal-history-container">
      <h1>Memories & Progress History</h1>
      
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