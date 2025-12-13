import React, { useState, useEffect } from 'react';
import { getSummary, getProjectedEOMSpend, getDueReminders, dismissReminder, snoozeReminder, getMonthlyReport } from '../services/api';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, zoomPlugin);
import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import Goals from './Goals';

const Dashboard = () => {
    const [summary, setSummary] = useState({ total_expense: 0, total_income: 0, balance: 0 });
    const { currency } = useCurrency();
    const [projected, setProjected] = useState({ projected_total: 0 });
    const [reminders, setReminders] = useState([]);
    const [dailyTrend, setDailyTrend] = useState(null);
    const dailyRef = React.useRef();

    useEffect(() => {
        fetchSummary();
        fetchProjected();
        fetchReminders();
        fetchDailyTrend();
    }, []);

    const fetchSummary = async () => {
        try {
            const response = await getSummary();
            setSummary(response.data);
        } catch (error) {
            console.error("Error fetching summary", error);
        }
    };

    const fetchDailyTrend = async () => {
        try {
            const today = new Date();
            const resp = await getMonthlyReport({ year: today.getFullYear(), month: today.getMonth() + 1 });
            const data = resp.data;
            if (data && data.daily_trend) {
                const labels = data.daily_trend.map(d => d.date.split('T')[0]);
                const values = data.daily_trend.map(d => d.total);
                setDailyTrend({ labels, datasets: [{ label: 'Daily Spend', data: values, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.3 }] });
            }
        } catch (e) {
            console.error('Error fetching daily trend', e);
        }
    };

    const resetDailyZoom = () => {
        try { if (dailyRef && dailyRef.current && dailyRef.current.resetZoom) dailyRef.current.resetZoom(); } catch (e) {}
    }

    const fetchProjected = async () => {
        try {
            // default to current month - backend will use current month if params omitted
            const response = await getProjectedEOMSpend();
            setProjected(response.data || { projected_total: 0 });
        } catch (error) {
            console.error('Error fetching projected EOM spend', error);
        }
    };

    const fetchReminders = async () => {
        try {
            const resp = await getDueReminders({ within_days: 3 });
            setReminders(resp.data || []);
        } catch (err) {
            console.error('Error fetching reminders', err);
        }
    };

    const handleDismiss = async (id) => {
        try {
            await dismissReminder(id);
            fetchReminders();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSnooze = async (id) => {
        try {
            // snooze 1 day
            await snoozeReminder(id, 1);
            fetchReminders();
        } catch (e) {
            console.error(e);
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
                <div className="card summary-card">
                    <div className="summary-label">Projected EOM Spend</div>
                    <div className="summary-value" style={{ color: '#ef4444' }}>
                        {currency}{(projected.projected_total || 0).toFixed(2)}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Monthly Spend (daily)</h3>
                    {dailyTrend ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <button className="btn" onClick={() => { try { const base = dailyRef.current && (dailyRef.current.toBase64Image ? dailyRef.current.toBase64Image() : (dailyRef.current.chartInstance && dailyRef.current.chartInstance.toBase64Image && dailyRef.current.chartInstance.toBase64Image())); if (base) { const a = document.createElement('a'); a.href = base; a.download = `dashboard_daily.png`; document.body.appendChild(a); a.click(); a.remove(); } } catch (e) { console.error(e); } }}>Download</button>
                                <button className="btn" onClick={resetDailyZoom}>Reset Zoom</button>
                            </div>
                            <div style={{ height: 180 }}>
                                <Line ref={dailyRef} data={dailyTrend} options={{ plugins: { zoom: { pan: { enabled: true, mode: 'x' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } } }, maintainAspectRatio: false }} />
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: '#6b7280' }}>No trend data available.</div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/expenses" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Add Expense</Link>
                    <Link to="/income" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block', backgroundColor: '#10b981' }}>Add Income</Link>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <Goals />
            </div>
            <div style={{ marginTop: '2rem' }}>
                <h2 className="page-title" style={{ fontSize: '1.25rem' }}>Reminders</h2>
                {reminders.length === 0 ? (
                    <div className="card">No reminders due soon.</div>
                ) : (
                    reminders.map(r => (
                        <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>{r.title}</div>
                                <div style={{ fontSize: '0.9rem' }}>{r.note || ''}</div>
                                <div style={{ fontSize: '0.85rem', color: '#666' }}>Due: {r.due_date}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn" onClick={() => handleSnooze(r.id)}>Snooze</button>
                                <button className="btn btn-danger" onClick={() => handleDismiss(r.id)}>Dismiss</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Dashboard;
