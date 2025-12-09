import React, { useState, useEffect } from 'react';
import { getSummary } from '../services/api';
import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

const Dashboard = () => {
    const [summary, setSummary] = useState({ total_expense: 0, total_income: 0, balance: 0 });
    const { currency } = useCurrency();

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const response = await getSummary();
            setSummary(response.data);
        } catch (error) {
            console.error("Error fetching summary", error);
        }
    };

    return (
        <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="card summary-card">
                    <div className="summary-label">Total Balance</div>
                    <div className="summary-value" style={{ color: summary.balance >= 0 ? '#10b981' : '#ef4444' }}>
                        {currency}{summary.balance.toFixed(2)}
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="summary-label">Total Income</div>
                    <div className="summary-value" style={{ color: '#10b981' }}>
                        {currency}{summary.total_income.toFixed(2)}
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="summary-label">Total Expenses</div>
                    <div className="summary-value" style={{ color: '#ef4444' }}>
                        {currency}{summary.total_expense.toFixed(2)}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/expenses" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Add Expense</Link>
                    <Link to="/income" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block', backgroundColor: '#10b981' }}>Add Income</Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
