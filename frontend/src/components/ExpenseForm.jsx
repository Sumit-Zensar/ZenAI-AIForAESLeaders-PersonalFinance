import React, { useState, useEffect } from 'react';
import { createExpense, updateExpense, getCategories, createCategory, predictCategory } from '../services/api';

const ExpenseForm = ({ onExpenseAdded, editingExpense, onCancelEdit }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState('');
    const [merchant, setMerchant] = useState('');
    const [notes, setNotes] = useState('');
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (editingExpense) {
            setAmount(editingExpense.amount);
            setDate(editingExpense.date);
            setCategoryId(editingExpense.category_id);
            setMerchant(editingExpense.merchant || '');
            setNotes(editingExpense.notes || '');
        } else {
            resetForm();
        }
    }, [editingExpense]);

    const resetForm = () => {
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setCategoryId('');
        setMerchant('');
        setNotes('');
    };

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory) return;
        try {
            const response = await createCategory({ name: newCategory, type: 'expense' });
            setCategories([...categories, response.data]);
            setCategoryId(response.data.id);
            setNewCategory('');
            setShowNewCategory(false);
        } catch (error) {
            console.error("Error creating category", error);
        }
    };

    const handleMerchantChange = async (e) => {
        const value = e.target.value;
        setMerchant(value);

        if (!editingExpense && value.length > 2) {
            try {
                const response = await predictCategory({ merchant: value });
                if (response.data.category) {
                    const cat = categories.find(c => c.name.toLowerCase() === response.data.category.toLowerCase());
                    if (cat) {
                        setCategoryId(cat.id);
                    }
                }
            } catch (error) {
                console.error("Error predicting category", error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const expenseData = {
                amount: parseFloat(amount),
                date,
                category_id: parseInt(categoryId),
                merchant,
                notes
            };

            if (editingExpense) {
                await updateExpense(editingExpense.id, expenseData);
                onCancelEdit();
            } else {
                await createExpense(expenseData);
                resetForm();
            }
            onExpenseAdded();
        } catch (error) {
            console.error("Error saving expense", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            <h2 className="page-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <div className="grid-2">
                <div className="form-group">
                    <label className="form-label">Amount</label>
                    <input type="number" step="0.01" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Category</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required={!showNewCategory}>
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <button type="button" className="btn" onClick={() => setShowNewCategory(!showNewCategory)}>
                        {showNewCategory ? 'Cancel' : '+'}
                    </button>
                </div>
                {showNewCategory && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="New Category Name"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button type="button" className="btn btn-primary" onClick={handleCreateCategory}>Save</button>
                    </div>
                )}
            </div>

            <div className="form-group">
                <label className="form-label">Merchant</label>
                <input type="text" className="form-input" value={merchant} onChange={handleMerchantChange} />
            </div>
            <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
                {editingExpense && (
                    <button type="button" className="btn" onClick={onCancelEdit} style={{ flex: 1 }}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default ExpenseForm;
