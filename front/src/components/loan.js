import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loan, getProfile } from '../services/api';
import './loan.css';

const Loan = () => {
  const [amount, setAmount] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await getProfile();
        console.log('Loan Profile Response:', response.data);
        setCurrentBalance(Number(response.data.loan_balance) || 0);
      } catch (err) {
        console.error('Error fetching loan balance:', err);
        setError('Failed to fetch loan balance');
      }
    };
    fetchBalance();
  }, []);

  const validateTransfer = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be greater than zero');
      return false;
    }
    
    if (amountNum > 1000000) { // Maximum transfer limit of 1,000,000
      setError('Loan amount exceeds maximum limit of 1,000,000');
      return false;
    }
   
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Replace 'deposit' with your loan request function, e.g., 'requestLoan'
      const response = await loan({ 
        amount: parseFloat(amount), 
        description 
      });

      if (response.data.status === 'success') {
        alert(response.data.message || 'Loan request submitted successfully!');
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Failed to submit loan request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while submitting your loan request');
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="transfer-form-container">
      <h2>Request Loan</h2>
      <div className="current-balance">
        Unpaid Loan: {currentBalance.toFixed(2)} FCFA
      </div>
      <form className="transfer-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Amount (FCFA)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            max="1000000"
            required
            placeholder="Enter amount"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Reason for Loan</label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add a note (optional)"
            maxLength="255"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button className="submit-button" type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Request Loan'}
        </button>
        <button className="back-button" type="button" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </form>

      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <h3>Confirm Request</h3>
            <p>You requested {parseFloat(amount).toFixed(2)} FCFA to account {recipientAccount}?</p>
            <div className="confirmation-buttons">
              <button onClick={handleSubmit} className="confirm-button">
                Confirm Request
              </button>
              <button onClick={() => setShowConfirmation(false)} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loan; 