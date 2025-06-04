import React, { useState, useEffect } from 'react'
import Home from './Home';
import Auth from './Auth';
import GoalSelection from './GoalSelection';
import GoalHistory from './GoalHistory';
import Journal from './Journal';
import './App.css'

function App() {
  const [view, setView] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSuccess = (nextView = 'goalSelection') => {
    setIsAuthenticated(true);
    setView(nextView);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setView('home');
  };

  const renderView = () => {
    switch(view) {
      case 'home':
        return <Home onGetStarted={() => setView(isAuthenticated ? 'goalSelection' : 'auth')} />;
      case 'auth':
        return <Auth onAuthSuccess={handleAuthSuccess} />;
      case 'goalSelection':
        return isAuthenticated ? <GoalSelection /> : <Auth onAuthSuccess={handleAuthSuccess} />;
      case 'goalHistory':
        return isAuthenticated ? <GoalHistory /> : <Auth onAuthSuccess={handleAuthSuccess} />;
      case 'journal':
        return isAuthenticated ? <Journal /> : <Auth onAuthSuccess={handleAuthSuccess} />;
      default:
        return <Home onGetStarted={() => setView(isAuthenticated ? 'goalSelection' : 'auth')} />;
    }
  };

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-container">
          <div className="brand-logo" onClick={() => setView('home')}>
            <span className="brand-name">Goal<span className="brand-accent">Connect</span></span>
          </div>
          <ul className="nav-links">
            <li className={view === 'home' ? 'active' : ''}>
              <button onClick={() => setView('home')}>Home</button>
            </li>
            {!isAuthenticated ? (
              <li className={view === 'auth' ? 'active' : ''}>
                <button onClick={() => setView('auth')}>Login / Register</button>
              </li>
            ) : (
              <>
                <li className={view === 'goalSelection' ? 'active' : ''}>
                  <button onClick={() => setView('goalSelection')}>Goal Selection</button>
                </li>
                <li className={view === 'goalHistory' ? 'active' : ''}>
                  <button onClick={() => setView('goalHistory')}>Goal History</button>
                </li>
                <li className={view === 'journal' ? 'active' : ''}>
                  <button onClick={() => setView('journal')}>Journal</button>
                </li>
              </>
            )}
          </ul>
          {isAuthenticated && (
            <div className="nav-logout">
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
          )}
        </div>
      </nav>
      <main className="app-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App
