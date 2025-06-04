import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

// It's a good practice to consolidate styles or create a specific one for Auth
// import './Auth.css'; 

function Auth({ onAuthSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true);

  // This function is passed to Login.jsx and is called on successful login
  const handleLoginSuccess = () => {
    if (onAuthSuccess) {
      onAuthSuccess(); // Notifies App.jsx to update auth state and view
    }
  };

  // This function is passed to Register.jsx and is called on successful registration
  const handleRegisterSuccess = () => {
    // After successful registration, switch to the login view within Auth.jsx
    setIsLoginView(true);
    // The Register component itself will display a message like "Registration successful! Please login."
    // No need to call onAuthSuccess here, as the user hasn't logged in yet.
  };

  return (
    <div className="auth-container">
      <h1>{isLoginView ? 'Login' : 'Register'}</h1>
      {isLoginView ? (
        <>
          <Login onLoginSuccess={handleLoginSuccess} />
          <p className="auth-toggle-message">
            Don't have an account?{' '}
            <button onClick={() => setIsLoginView(false)} className="toggle-auth-button">
              Register here
            </button>
          </p>
        </>
      ) : (
        <>
          <Register onRegisterSuccess={handleRegisterSuccess} />
          <p className="auth-toggle-message">
            Already have an account?{' '}
            <button onClick={() => setIsLoginView(true)} className="toggle-auth-button">
              Login here
            </button>
          </p>
        </>
      )}
    </div>
  );
}

export default Auth; 