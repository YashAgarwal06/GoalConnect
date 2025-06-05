import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

// It's a good practice to consolidate styles or create a specific one for Auth
// import './Auth.css'; 

function Auth({ onAuthSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true);

  // This function is passed to Login.jsx and Register.jsx and is called on successful authentication
  const handleLoginSuccess = () => {
    if (onAuthSuccess) {
      onAuthSuccess(); // Notifies App.jsx to update auth state and view
    }
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
          <Register onLoginSuccess={handleLoginSuccess} />
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