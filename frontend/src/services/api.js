import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

export const getExpenses = (params) => api.get('/expenses/', { params });
export const createExpense = (expense) => api.post('/expenses/', expense);
export const updateExpense = (id, expense) => api.put(`/expenses/${id}`, expense);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

export const getIncome = (params) => api.get('/income/', { params });
export const createIncome = (income) => api.post('/income/', income);
export const updateIncome = (id, income) => api.put(`/income/${id}`, income);
export const deleteIncome = (id) => api.delete(`/income/${id}`);

export const getCategories = () => api.get('/categories/');
export const createCategory = (category) => api.post('/categories/', category);
export const updateCategory = (id, category) => api.put(`/categories/${id}`, category);
export const mergeCategories = (sourceId, targetId) => api.post('/categories/merge', { source_id: sourceId, target_id: targetId });

export const getSummary = () => api.get('/reports/summary');

export const getBudgets = () => api.get('/budgets/');
export const createBudget = (budget) => api.post('/budgets/', budget);
export const updateBudget = (id, budget) => api.put(`/budgets/${id}`, budget);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);
export const getBudgetsStatus = () => api.get('/budgets/status');

export const predictCategory = (data) => api.post('/ai/predict_category', data);

export default api;
