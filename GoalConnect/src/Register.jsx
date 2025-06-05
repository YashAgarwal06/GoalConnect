import React, { useState } from 'react';

const Register = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:3001/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        // Store token and automatically log in
        localStorage.setItem('token', data.token);
        setMessage('Registration successful! Logging you in...');
        
        // Call onLoginSuccess to automatically log in the user
        if (onLoginSuccess) {
          setTimeout(() => {
            onLoginSuccess();
          }, 1000); // Small delay to show the success message
        }
      } else {
        setMessage(data.error || 'Registration failed.');
      }
    } catch (error) {
      setMessage('Network error during registration. Please try again.');
      console.error("Register error:", error);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
        <button type="submit">Register</button>
      </form>
      {message && <p className={`register-message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</p>}
    </div>
  );
};

export default Register;