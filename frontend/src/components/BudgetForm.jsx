import React, { useState, useEffect } from 'react';
import { createBudget, updateBudget, getCategories } from '../services/api';

const BudgetForm = ({ onBudgetAdded, editingBudget, onCancelEdit }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    period_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    category_id: '' // Empty string for Overall
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        amount: editingBudget.amount,
        period_type: editingBudget.period_type,
        start_date: editingBudget.start_date,
        category_id: editingBudget.category_id || ''
      });
    } else {
      setFormData({
        amount: '',
        period_type: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        category_id: ''
      });
    }
  }, [editingBudget]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const budgetData = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, budgetData);
      } else {
        await createBudget(budgetData);
      }

      onBudgetAdded();
      if (!editingBudget) {
        setFormData({
          amount: '',
          period_type: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          category_id: ''
        });
      }
    } catch (error) {
      console.error("Error saving budget", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>{editingBudget ? 'Edit Budget' : 'Set New Budget'}</h3>
      <div className="grid-2" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Overall Budget</option>
            {categories.filter(cat => cat.type === 'expense').map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Period</label>
          <select
            name="period_type"
            value={formData.period_type}
            onChange={handleChange}
            className="form-input"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          {editingBudget ? 'Update Budget' : 'Set Budget'}
        </button>
        {editingBudget && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="btn"
            style={{ flex: 1, backgroundColor: '#e5e7eb', color: '#374151' }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default BudgetForm;
