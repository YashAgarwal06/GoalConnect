import React, { useState, useEffect } from 'react';

const Home = ({ onGetStarted }) => {
  const [currentQuote, setCurrentQuote] = useState(0);

  const motivationalQuotes = [
    "Small daily improvements lead to staggering long-term results.",
    "The best time to start was yesterday. The second best time is now.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Your future self will thank you for what you do today.",
    "Progress, not perfection, is the goal."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Goal<span className="brand-accent">Connect</span>
          </h1>
          <p className="hero-tagline">
            Turn Today's Small Steps Into Tomorrow's Big Wins
          </p>
          <p className="hero-description">
            Build lasting habits, track your progress, and celebrate every achievement on your journey to becoming your best self.
          </p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Goals Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">95%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>

          <button className="hero-cta" onClick={onGetStarted}>
            <span>Start Your Journey</span>
            <span className="cta-arrow">→</span>
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>Your Path to Success in 3 Simple Steps</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-icon">📱</div>
            <h3>Choose Your Goal</h3>
            <p>Select from curated daily goals or create your own. From fitness to mindfulness, we've got you covered.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-card">
            <div className="step-icon">✅</div>
            <h3>Take Action</h3>
            <p>Complete your goal and capture the moment. Upload photos as proof of your achievements.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-card">
            <div className="step-icon">🏆</div>
            <h3>Celebrate Progress</h3>
            <p>Track streaks, view your calendar, and watch your consistency build unstoppable momentum.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Everything You Need to Succeed</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Smart Goal Selection</h3>
            <p>Choose from 10+ proven goal categories designed to improve your daily life and well-being.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Visual Progress</h3>
            <p>Upload photos to document your journey and create a visual timeline of your achievements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Calendar View</h3>
            <p>Visualize your consistency with an intuitive calendar that shows your daily progress at a glance.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔥</div>
            <h3>Streak Tracking</h3>
            <p>Build momentum with streak counters that motivate you to maintain your positive habits.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Insights & Analytics</h3>
            <p>Get detailed insights into your progress with completion rates and milestone achievements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌟</div>
            <h3>Milestone Rewards</h3>
            <p>Celebrate major achievements and unlock milestones as you build lasting positive habits.</p>
          </div>
        </div>
      </section>

      {/* Motivational Quote Section */}
      <section className="quote-section">
        <div className="quote-container">
          <div className="quote-mark">"</div>
          <p className="rotating-quote">{motivationalQuotes[currentQuote]}</p>
          <div className="quote-dots">
            {motivationalQuotes.map((_, index) => (
              <span 
                key={index} 
                className={`quote-dot ${index === currentQuote ? 'active' : ''}`}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* Goal Categories Preview */}
      <section className="categories-preview">
        <h2>Popular Goal Categories</h2>
        <div className="categories-grid">
          <div className="category-chip">💪 Exercise & Fitness</div>
          <div className="category-chip">🧘 Mindfulness & Meditation</div>
          <div className="category-chip">📚 Learning & Reading</div>
          <div className="category-chip">🥗 Healthy Eating</div>
          <div className="category-chip">💼 Personal Projects</div>
          <div className="category-chip">🤝 Social Connection</div>
          <div className="category-chip">😴 Sleep & Rest</div>
          <div className="category-chip">📱 Digital Wellness</div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to Transform Your Life?</h2>
          <p>Join thousands of users who are already building better habits and achieving their goals.</p>
          <button className="cta-button-large" onClick={onGetStarted}>
            Get Started Today
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home; 