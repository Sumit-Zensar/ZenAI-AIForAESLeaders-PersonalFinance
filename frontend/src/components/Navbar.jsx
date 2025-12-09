import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, DollarSign, PieChart, Target } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import '../App.css';

const Navbar = () => {
    const { currency, updateCurrency } = useCurrency();
    const currencies = ['₹', '$', '€', '£', 'C$'];

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-brand">
                    <DollarSign size={28} />
                    FinanceTracker
                </Link>
                <div className="nav-links" style={{ alignItems: 'center' }}>
                    <Link to="/" className="nav-link">
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link to="/expenses" className="nav-link">
                        <DollarSign size={20} /> Expenses
                    </Link>
                    <Link to="/income" className="nav-link">
                        <PieChart size={20} /> Income
                    </Link>
                    <Link to="/budgets" className="nav-link">
                        <Target size={20} /> Budgets
                    </Link>

                    <select
                        value={currency}
                        onChange={(e) => updateCurrency(e.target.value)}
                        className="form-input"
                        style={{ width: 'auto', padding: '0.25rem 0.5rem', marginLeft: '1rem' }}
                    >
                        {currencies.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
