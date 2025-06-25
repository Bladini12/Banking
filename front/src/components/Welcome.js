import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome to the Bank App</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#555' }}>
          Manage your finances securely and easily.
        </p>
        <button className="auth-button" onClick={() => navigate('/login')} style={{ marginBottom: '1rem' }}>
          Log In
        </button>
        <button className="auth-button" onClick={() => navigate('/register')}>
          Register
        </button>
      </div>
    </div>
  );
};

export default Welcome; 