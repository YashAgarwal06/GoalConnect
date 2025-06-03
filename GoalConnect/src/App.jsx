import { useState } from 'react'
import Home from './Home';
import Login from './Login';
import Register from './Register';
import GoalSelection from './GoalSelection';
import GoalHistory from './GoalHistory';
import './App.css'

function App() {
  const [view, setView] = useState('home');

  const renderView = () => {
    switch(view) {
      case 'home':
        return <Home onGetStarted={() => setView('login')} />;
      case 'login':
        return (
          <>
            <Login onLoginSuccess={setView} />
            <button onClick={() => setView('register')}>Switch to Register</button>
          </>
        );
      case 'register':
        return (
          <>
            <Register />
            <button onClick={() => setView('login')}>Switch to Login</button>
          </>
        );
      case 'goalSelection':
        return <GoalSelection />;
      case 'goalHistory':
        return <GoalHistory />;
      default:
        return <Home onGetStarted={() => setView('login')} />;
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
            <li className={view === 'login' ? 'active' : ''}>
              <button onClick={() => setView('login')}>Login</button>
            </li>
            <li className={view === 'register' ? 'active' : ''}>
              <button onClick={() => setView('register')}>Register</button>
            </li>
            <li className={view === 'goalSelection' ? 'active' : ''}>
              <button onClick={() => setView('goalSelection')}>Goal Selection</button>
            </li>
            <li className={view === 'goalHistory' ? 'active' : ''}>
              <button onClick={() => setView('goalHistory')}>Goal History</button>
            </li>
          </ul>
        </div>
      </nav>
      <main className="app-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App
