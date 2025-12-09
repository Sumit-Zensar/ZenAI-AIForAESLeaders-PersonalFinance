import React, { useState, useEffect } from 'react';
import { getBudgetsStatus, deleteBudget } from '../services/api';
import BudgetForm from '../components/BudgetForm';
import { useCurrency } from '../context/CurrencyContext';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';

const Budgets = () => {
  const [budgetStatuses, setBudgetStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(null);
  const { currency } = useCurrency();

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await getBudgetsStatus();
      setBudgetStatuses(response.data);
    } catch (error) {
      console.error("Error fetching budget statuses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      try {
        await deleteBudget(id);
        fetchBudgets();
      } catch (error) {
        console.error("Error deleting budget", error);
      }
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
  };

  const formatCurrency = (amount) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  return (
    <div>
      <h1 className="page-title">Budgets & Alerts</h1>

      <BudgetForm
        onBudgetAdded={() => { fetchBudgets(); setEditingBudget(null); }}
        editingBudget={editingBudget}
        onCancelEdit={handleCancelEdit}
      />

      <div className="card">
        <h2 className="page-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Your Budgets</h2>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '1.5rem' }}>Loading budgets...</div>
        ) : budgetStatuses.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '1.5rem' }}>No budgets set. Create one to get started!</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Period</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                  <th>Projected</th>
                  <th style={{ width: '30%' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgetStatuses.map((status) => {
                  const { budget, spent, remaining, utilization_pct, projected_spent, is_over_budget } = status;
                  let progressBarColor = "#10b981"; // Green
                  if (utilization_pct > 100) progressBarColor = "#ef4444"; // Red
                  else if (utilization_pct > 80) progressBarColor = "#f59e0b"; // Amber

                  return (
                    <tr key={budget.id}>
                      <td style={{ fontWeight: '500' }}>
                        {budget.category ? budget.category.name : "Overall Budget"}
                      </td>
                      <td style={{ textTransform: 'capitalize', color: '#4b5563' }}>{budget.period_type}</td>
                      <td style={{ fontWeight: '500' }}>{formatCurrency(budget.amount)}</td>
                      <td style={{ color: '#4b5563' }}>{formatCurrency(spent)}</td>
                      <td style={{ fontWeight: '500', color: remaining < 0 ? '#ef4444' : '#10b981' }}>
                        {formatCurrency(remaining)}
                      </td>
                      <td style={{ color: '#4b5563' }}>
                        {formatCurrency(projected_spent)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{utilization_pct.toFixed(1)}%</span>
                          {is_over_budget && (
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center animate-pulse shadow-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#dc2626', color: 'white', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                              <AlertTriangle size={12} /> Over Budget
                            </span>
                          )}
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.5rem' }}>
                          <div
                            style={{
                              height: '0.5rem',
                              borderRadius: '9999px',
                              backgroundColor: progressBarColor,
                              width: `${Math.min(utilization_pct, 100)}%`
                            }}
                          ></div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEdit(budget)}
                            className="btn"
                            style={{ color: '#2563eb', padding: '0.25rem', backgroundColor: 'transparent' }}
                            title="Edit Budget"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="btn"
                            style={{ color: '#dc2626', padding: '0.25rem', backgroundColor: 'transparent' }}
                            title="Delete Budget"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budgets;
