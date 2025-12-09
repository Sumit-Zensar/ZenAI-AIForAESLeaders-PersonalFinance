import React, { useState, useEffect } from 'react';
import { getCategories, updateCategory, mergeCategories } from '../services/api';

const CategoryManager = ({ onClose }) => {
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [mergingId, setMergingId] = useState(null);
    const [targetMergeId, setTargetMergeId] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    const startEdit = (category) => {
        setEditingId(category.id);
        setEditName(category.name);
        setMergingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = async (category) => {
        try {
            await updateCategory(category.id, { ...category, name: editName });
            setEditingId(null);
            fetchCategories();
        } catch (error) {
            console.error("Error updating category", error);
        }
    };

    const startMerge = (category) => {
        setMergingId(category.id);
        setEditingId(null);
        setTargetMergeId('');
    };

    const cancelMerge = () => {
        setMergingId(null);
        setTargetMergeId('');
    };

    const confirmMerge = async (sourceCategory) => {
        if (!targetMergeId) return;
        if (window.confirm(`Are you sure you want to merge "${sourceCategory.name}" into the selected category? This cannot be undone.`)) {
            try {
                await mergeCategories(sourceCategory.id, parseInt(targetMergeId));
                setMergingId(null);
                fetchCategories();
            } catch (error) {
                console.error("Error merging categories", error);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 className="page-title" style={{ marginBottom: 0, fontSize: '1.5rem' }}>Manage Categories</h2>
                    <button className="btn" onClick={onClose}>Close</button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(category => (
                            <tr key={category.id}>
                                <td>
                                    {editingId === category.id ? (
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                    ) : (
                                        category.name
                                    )}
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>{category.type}</td>
                                <td>
                                    {editingId === category.id ? (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary" onClick={() => saveEdit(category)}>Save</button>
                                            <button className="btn" onClick={cancelEdit}>Cancel</button>
                                        </div>
                                    ) : mergingId === category.id ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.875rem' }}>Merge into:</span>
                                            <select
                                                className="form-input"
                                                style={{ width: 'auto', padding: '0.25rem' }}
                                                value={targetMergeId}
                                                onChange={(e) => setTargetMergeId(e.target.value)}
                                            >
                                                <option value="">Select...</option>
                                                {categories.filter(c => c.id !== category.id && c.type === category.type).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <button className="btn btn-primary" onClick={() => confirmMerge(category)}>Confirm</button>
                                            <button className="btn" onClick={cancelMerge}>Cancel</button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-success" onClick={() => startEdit(category)}>Edit</button>
                                            <button className="btn btn-warning" onClick={() => startMerge(category)}>Merge</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategoryManager;
