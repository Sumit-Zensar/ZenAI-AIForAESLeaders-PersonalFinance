import React, { useState, useEffect } from 'react';
import { getIncome, deleteIncome, getCategories } from '../services/api';
import IncomeForm from './IncomeForm';
import CategoryManager from './CategoryManager';
import { useCurrency } from '../context/CurrencyContext';

const Income = () => {
    const [income, setIncome] = useState([]);
    const [editingIncome, setEditingIncome] = useState(null);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const { currency } = useCurrency();

    // Filters
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        category_id: '',
        source: ''
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, [showCategoryManager]);

    useEffect(() => {
        fetchIncome();
    }, [filters, showCategoryManager]);

    const fetchCategories = async () => {
        try {
            const response = await getCategories('income');
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    const fetchIncome = async () => {
        try {
            const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            const response = await getIncome(params);
            setIncome(response.data);
        } catch (error) {
            console.error("Error fetching income", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this income?")) {
            try {
                await deleteIncome(id);
                fetchIncome();
            } catch (error) {
                console.error("Error deleting income", error);
            }
        }
    };

    const handleEdit = (inc) => {
        setEditingIncome(inc);
    };

    const handleCancelEdit = () => {
        setEditingIncome(null);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Income</h1>
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
                        {categories.filter(c => c.type === 'income').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name="source"
                        className="form-input"
                        style={{ flex: 1, minWidth: '200px' }}
                        value={filters.source}
                        onChange={handleFilterChange}
                        placeholder="Search Source..."
                    />
                </div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
                <IncomeForm
                    onIncomeAdded={fetchIncome}
                    editingIncome={editingIncome}
                    onCancelEdit={handleCancelEdit}
                />

                <div className="card">
                    <h2 className="page-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Income</h2>
                    {income.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>No income found.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Source</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {income.map(inc => (
                                    <tr key={inc.id}>
                                        <td>{inc.date}</td>
                                        <td>{inc.category ? inc.category.name : '-'}</td>
                                        <td>{inc.source}</td>
                                        <td style={{ fontWeight: 'bold', color: '#10b981' }}>{currency}{inc.amount.toFixed(2)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => handleEdit(inc)}>Edit</button>
                                                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => handleDelete(inc.id)}>Delete</button>
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

export default Income;
