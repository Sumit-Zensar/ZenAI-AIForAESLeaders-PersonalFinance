import React, { useEffect, useState } from 'react';
import { getGoals, deleteGoal, getGoalProgress, addToGoal } from '../services/api';
import GoalForm from './GoalForm';
import { useCurrency } from '../context/CurrencyContext';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currency } = useCurrency();

    const fetchGoals = async () => {
        setLoading(true);
        try {
            const res = await getGoals();
            setGoals(res.data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchGoals(); }, []);

    const remove = async (id) => {
        if (!window.confirm('Delete this goal?')) return;
        await deleteGoal(id);
        fetchGoals();
    };

    const deposit = async (id) => {
        const v = window.prompt('Amount to add');
        if (!v) return;
        await addToGoal(id, parseFloat(v));
        fetchGoals();
    };

    return (
        <div>
            <h2 className="page-title">Savings Goals</h2>
            <GoalForm onCreated={fetchGoals} />

            <div style={{ marginTop: '1rem' }}>
                {loading && <div>Loading...</div>}
                {!loading && goals.length === 0 && <div>No goals yet.</div>}
                {!loading && goals.map(g => (
                    <div key={g.id} className="card" style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <b>{g.name}</b>
                                <div>{currency}{g.current_amount?.toFixed(2)} / {currency}{g.target_amount?.toFixed(2)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <button className="btn" onClick={() => deposit(g.id)}>Add</button>
                                <button className="btn" onClick={() => remove(g.id)}>Delete</button>
                            </div>
                        </div>
                        <GoalProgressPreview id={g.id} />
                    </div>
                ))}
            </div>
        </div>
    )
}

const GoalProgressPreview = ({ id }) => {
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await getGoalProgress(id);
                if (mounted) setProgress(res.data);
            } catch (err) { console.error(err); }
        };
        load();
        return () => { mounted = false; }
    }, [id]);

    if (!progress) return null;

    return (
        <div style={{ marginTop: '0.5rem' }}>
            <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(progress.progress_pct,100)}%`, height: '100%', background: '#10b981' }}></div>
            </div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {progress.progress_pct}% — {progress.message}
                {progress.estimated_completion_date && (
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Est. completion: {progress.estimated_completion_date}</div>
                )}
                {progress.monthly_net_savings !== null && (
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>Monthly net savings: {currency}{progress.monthly_net_savings}</div>
                )}
                {progress.behind_pct !== null && progress.behind_pct > 0 && (
                    <div style={{ color: '#dc2626', fontSize: '0.85rem' }}>Behind schedule by {Math.round(progress.behind_pct * 100)}%</div>
                )}
            </div>
        </div>
    )
}

export default Goals;
