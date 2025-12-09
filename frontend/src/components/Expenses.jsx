import React, { useState, useEffect } from 'react';
import { getExpenses, deleteExpense, getCategories } from '../services/api';
import ExpenseForm from './ExpenseForm';
import CategoryManager from './CategoryManager';
import { useCurrency } from '../context/CurrencyContext';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const { currency } = useCurrency();

    // Filters
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        category_id: '',
        merchant: ''
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, [showCategoryManager]);

    useEffect(() => {
        fetchExpenses();
    }, [filters, showCategoryManager]);

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    const fetchExpenses = async () => {
        try {
            // Remove empty filters
            const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            const response = await getExpenses(params);
            setExpenses(response.data);
        } catch (error) {
            console.error("Error fetching expenses", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            try {
                await deleteExpense(id);
                fetchExpenses();
            } catch (error) {
                console.error("Error deleting expense", error);
            }
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
    };

    const handleCancelEdit = () => {
        setEditingExpense(null);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Expenses</h1>
                <button className="btn" onClick={() => setShowCategoryManager(true)}>Manage Categories</button>
            </div>

            {showCategoryManager && <CategoryManager onClose={() => setShowCategoryManager(false)} />}

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>Filters</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="date"
                        name="start_date"
                        className="form-input"
                        style={{ width: 'auto' }}
                        value={filters.start_date}
                        onChange={handleFilterChange}
                        placeholder="Start Date"
                    />
                    <input
                        type="date"
                        name="end_date"
                        className="form-input"
                        style={{ width: 'auto' }}
                        value={filters.end_date}
                        onChange={handleFilterChange}
                        placeholder="End Date"
                    />
                    <select
                        name="category_id"
                        className="form-input"
                        style={{ width: 'auto' }}
                        value={filters.category_id}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Categories</option>
                        {categories.filter(c => c.type === 'expense').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name="merchant"
                        className="form-input"
                        style={{ flex: 1, minWidth: '200px' }}
                        value={filters.merchant}
                        onChange={handleFilterChange}
                        placeholder="Search Merchant..."
                    />
                </div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
                <ExpenseForm
                    onExpenseAdded={fetchExpenses}
                    editingExpense={editingExpense}
                    onCancelEdit={handleCancelEdit}
                />

                <div className="card">
                    <h2 className="page-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Expenses</h2>
                    {expenses.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>No expenses found.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Merchant</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(expense => (
                                    <tr key={expense.id}>
                                        <td>{expense.date}</td>
                                        <td>{expense.category ? expense.category.name : '-'}</td>
                                        <td>{expense.merchant}</td>
                                        <td style={{ fontWeight: 'bold' }}>{currency}{expense.amount.toFixed(2)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => handleEdit(expense)}>Edit</button>
                                                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => handleDelete(expense.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Expenses;
