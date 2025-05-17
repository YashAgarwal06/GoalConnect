import { useState } from 'react'
import Login from './Login';
import Register from './Register';
import GoalSelection from './GoalSelection';
import GoalHistory from './GoalHistory';
import './App.css'

function App() {
  const [view, setView] = useState('login');

  const renderView = () => {
    switch(view) {
      case 'login':
        return (
          <>
            <Login />
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
        return <Login />;
    }
  };

  return (
    <div className="app-container">
      <nav className="app-nav">
        <ul>
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
      </nav>
      <main className="app-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App
