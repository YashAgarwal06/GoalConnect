import { useState } from 'react'
import Register from './Register';
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState('login');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('Login successful:', data);
        // You can store the token or navigate to another page
        alert('Login successful');
      } else {
        console.error('Login failed:', data.error);
        alert('Login failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Login failed: Network error');
    }
  };

  if (view === 'register') {
    return (
      <>
        <Register />
        <button onClick={() => setView('login')}>Switch to Login</button>
      </>
    );
  }

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Log In</button>
      </form>
      <button onClick={() => setView('register')}>Switch to Register</button>
    </div>
  );
}

export default App
