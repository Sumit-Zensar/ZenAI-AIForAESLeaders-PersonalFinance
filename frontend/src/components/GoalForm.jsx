import React, { useState } from 'react';
import { createGoal } from '../services/api';

const GoalForm = ({ onCreated }) => {
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { name, target_amount: parseFloat(target), deadline: deadline || null };
            await createGoal(payload);
            setName(''); setTarget(''); setDeadline('');
            if (onCreated) onCreated();
        } catch (err) {
            console.error('Error creating goal', err);
        } finally { setLoading(false); }
    };

    return (
        <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Goal name" />
            <input required value={target} onChange={e => setTarget(e.target.value)} placeholder="Target amount" type="number" step="0.01" />
            <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="Deadline" type="date" />
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Goal'}</button>
        </form>
    )
}

export default GoalForm;
