import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const GoalHistory = () => {
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
  // Function to handle date change in calendar
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  

  return (
    <div className="goal-history-container">
      <h1>Goal History</h1>
      <p>This is the Goal History screen where users will be able to see their past goals and progress.</p>
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
          <div className="progress-label">
            <span>50%</span>
            <span>Time Period: {
              selectedTimeMetric === '7days' ? 'Last 7 Days' : 
              selectedTimeMetric === 'month' ? 'Last Month' : 'Last Year'
            }</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '50%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalHistory; 