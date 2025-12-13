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

export const getCategories = (type) => api.get('/categories/', { params: type ? { type } : {} });
export const createCategory = (category) => api.post('/categories/', category);
export const updateCategory = (id, category) => api.put(`/categories/${id}`, category);
export const mergeCategories = (sourceId, targetId) => api.post('/categories/merge', { source_id: sourceId, target_id: targetId });

export const getSummary = () => api.get('/reports/summary');
export const getProjectedEOMSpend = (params) => api.get('/reports/projected_eom', { params });
export const getMonthlyReport = (params) => api.get('/reports/month', { params });
export const exportReport = (params) => api.get('/reports/export', { params, responseType: 'blob' });

export const getBudgets = () => api.get('/budgets/');
export const createBudget = (budget) => api.post('/budgets/', budget);
export const updateBudget = (id, budget) => api.put(`/budgets/${id}`, budget);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);
export const getBudgetsStatus = () => api.get('/budgets/status');

export const getGoals = () => api.get('/goals/');
export const createGoal = (goal) => api.post('/goals/', goal);
export const updateGoal = (id, goal) => api.put(`/goals/${id}`, goal);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);
export const addToGoal = (id, amount) => api.post(`/goals/${id}/add`, amount);
export const getGoalProgress = (id) => api.get(`/goals/${id}/progress`);

export const predictCategory = (data) => api.post('/ai/predict_category', data);
export const confirmCategory = (data) => api.post('/ai/confirm_category', data);
export const checkRecurring = (data) => api.post('/ai/recurring_check', data);
export const confirmRecurring = (data) => api.post('/ai/recurring_confirm', data);

export const scanAnomalies = (params) => api.post('/anomalies/scan', null, { params });
export const listAnomalies = (params) => api.get('/anomalies/', { params });
export const dismissAnomaly = (id) => api.post(`/anomalies/${id}/dismiss`);
export const snoozeAnomaly = (id, days) => api.post(`/anomalies/${id}/snooze`, null, { params: { days } });

export const createReminder = (data) => api.post('/reminders/', data);
export const listReminders = (params) => api.get('/reminders/', { params });
export const dismissReminder = (id) => api.post(`/reminders/${id}/dismiss`);
export const snoozeReminder = (id, days) => api.post(`/reminders/${id}/snooze`, null, { params: { days } });
export const getDueReminders = (params) => api.get('/reminders/due', { params });

export default api;
