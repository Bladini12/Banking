import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deposit, getProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Deposit.css';

const Deposit = () => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await getProfile();
        setCurrentBalance(Number(response.data.balance) || 0);
      } catch (err) {
        console.error('Error fetching balance:', err);
        setCurrentBalance(0);
      }
    };

    fetchBalance();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await deposit({ amount: parseFloat(amount) });
      
      if (response.data.status === 'success') {
        // Update user balance in context
        const newBalance = Number(response.data.new_balance) || 0;
        updateUser({
          ...user,
          balance: newBalance
        });
        setCurrentBalance(newBalance);
        
        // Show success message and redirect to dashboard
        alert('Deposit successful!');
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Failed to process deposit');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while processing your deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deposit-container">
      <div className="deposit-card">
        <h2>Make a Deposit</h2>
        <p className="current-balance">
          Current Balance: {currentBalance.toFixed(2)}fCFA
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="amount">Amount to Deposit (FCFA)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              required
              placeholder="Enter amount"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button 
              type="submit" 
              className="deposit-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Make Deposit'}
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Deposit; 