import React, { useState } from 'react';

const GoalHistory = () => {
  const [selectedTimeMetric, setSelectedTimeMetric] = useState('7days');
  
  // Function to handle time metric selection
  const handleTimeMetricChange = (metric) => {
    setSelectedTimeMetric(metric);
  };

  return (
    <div className="goal-history-container">
      <h1>Goal History</h1>
      <p>This is the Goal History screen where users will be able to see their past goals and progress.</p>
      
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