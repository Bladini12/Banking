import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, getTransactions } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch profile data
                const profileResponse = await getProfile();
                console.log('Profile Response:', profileResponse.data);
                if (profileResponse.data) {
                    setUserData(profileResponse.data);
                }

                // Fetch transactions data
                const transactionsResponse = await getTransactions();
                console.log('Transactions response:', transactionsResponse);
                if (transactionsResponse.data) {
                    setTransactions(Array.isArray(transactionsResponse.data) ? transactionsResponse.data : []);
                }
            } catch (err) {
                console.error('Dashboard data fetch error:', err);
                if (err.response?.status === 401) {
                    logoutUser();
                    navigate('/login');
                } else {
                    setError('Failed to load dashboard data. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, logoutUser]);

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    const handleDeposit = () => {
        navigate('/deposit');
    };

    const formatAmount = (amount) => {
        if (amount === null || amount === undefined) return '0.0';
        const numAmount = parseFloat(amount);
        return isNaN(numAmount) ? '0.000' : numAmount.toFixed(2);
    };

    const visibleTransactions = expanded ? transactions : transactions.slice(0, 3);

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading">Loading dashboard data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard">
                <div className="error-message">{error}</div>
                <button onClick={() => window.location.reload()} className="retry-button">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="welcome-message">
                    Welcome, {userData?.first_name || userData?.username || 'User'}!
                </div>
                <div className="nav-buttons">
                    <button onClick={() => navigate('/deposit')} className="deposit-button">
                        Make Deposit
                    </button>
                    <button onClick={() => navigate('/transfer')} className="transfer-button">
                        Transfer Funds
                    </button>
                    <button onClick={() => navigate('/loan')} className="loan-button">
                        Request Loan
                    </button>
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="user-info">
                    <h2>Account Information</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Account Number:</label>
                            <span>{userData?.account_number || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>Current Balance:</label>
                            <span>{formatAmount(userData?.balance)}FCFA</span>
                        </div>
                        <div className="info-item">
                            <label>Loan Balance:</label>
                            <span className={userData?.loan_balance > 0 ? 'loan-balance' : 'no-loan'}>
                                {userData?.loan_balance > 0 ? `- ${formatAmount(userData?.loan_balance)} FCFA` : 'No active loan'}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Account Status:</label>
                            <span>{userData?.status || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="recent-transactions">
                    <h2>Transactions</h2>
                    {transactions && transactions.length > 0 ? (
                        <div className="transactions-list">
                            {visibleTransactions.map(transaction => (
                                <div key={transaction.id} className="transaction-item">
                                    <div className="transaction-info">
                                        <span >
                                            {transaction.transaction_type_display}
                                        </span>
                                        <span className="transaction-amount">
                                            {formatAmount(transaction.amount)}FCFA
                                        </span>
                                        <span className={`transaction-status status-${transaction.status.toLowerCase()}`}>
                                            {transaction.status}
                                        </span>
                                    </div>
                                    <div className="transaction-date">
                                        {new Date(transaction.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No transactions found</p>
                    )}
                    {transactions.length > 3 && (
                        <button onClick={() => setExpanded(!expanded)} className="expand-button">
                            {expanded ? 'Hide' : 'Expand'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;