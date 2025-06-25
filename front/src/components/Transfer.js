import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transfer, getProfile } from '../services/api';
import './loan.css';

const Transfer = () => {
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
        setCurrentBalance(Number(response.data.balance) || 0);
      } catch (err) {
        console.error('Error fetching balance:', err);
        setError('Failed to fetch current balance');
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
    if (amountNum > currentBalance) {
      setError('Insufficient balance');
      return false;
    }
    if (amountNum > 1000000) { // Maximum transfer limit of 1,000,000
      setError('Transfer amount exceeds maximum limit of 1,000,000');
      return false;
    }
    if (!recipientAccount || recipientAccount.length !== 10) {
      setError('Please enter a valid 10-digit account number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateTransfer()) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmTransfer = async () => {
    setLoading(true);
    try {
      const response = await transfer({
        amount: parseFloat(amount),
        recipient_account_number: recipientAccount,
        description,
      });
      setSuccess(response.data.message);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.non_field_errors?.[0] ||
        'Transfer failed. Please check the details and try again.'
      );
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="transfer-form-container">
      <h2>Transfer Funds</h2>
      <div className="current-balance">
        Current Balance: {currentBalance.toFixed(2)} FCFA
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
          <label htmlFor="recipientAccount">Recipient Account Number</label>
          <input
            type="text"
            id="recipientAccount"
            value={recipientAccount}
            onChange={e => setRecipientAccount(e.target.value)}
            required
            pattern="[0-9]{10}"
            title="Please enter a valid 10-digit account number"
            placeholder="Enter recipient's account number"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
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
          {loading ? 'Processing...' : 'Transfer'}
        </button>
        <button className="back-button" type="button" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </form>

      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <h3>Confirm Transfer</h3>
            <p>Are you sure you want to transfer {parseFloat(amount).toFixed(2)} FCFA to account {recipientAccount}?</p>
            <div className="confirmation-buttons">
              <button onClick={handleConfirmTransfer} className="confirm-button">
                Confirm Transfer
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

export default Transfer; 