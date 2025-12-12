import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getMonthlyReport, exportReport } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, zoomPlugin);

const Reports = () => {
    const { currency } = useCurrency();
    const [report, setReport] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        fetchReport();
    }, [year, month]);

    const fetchReport = async () => {
        try {
            const resp = await getMonthlyReport({ year, month });
            setReport(resp.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleExport = async (format) => {
        try {
            const resp = await exportReport({ year, month, format });
            const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${year}_${month}.${format === 'xlsx' ? 'xlsx' : (format === 'html' ? 'html' : 'csv')}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
        }
    };

    const categoryChart = useMemo(() => {
        if (!report) return null;
        const labels = report.categories.map(c => c.category);
        const data = report.categories.map(c => c.total);
        return {
            labels,
            datasets: [
                {
                    label: 'Category Spend',
                    data,
                    backgroundColor: labels.map((_, i) => `hsl(${(i * 45) % 360} 70% 50%)`),
                }
            ]
        };
    }, [report]);

    const merchantChart = useMemo(() => {
        if (!report) return null;
        const labels = report.top_merchants.map(m => m.merchant || 'Unknown');
        const data = report.top_merchants.map(m => m.total);
        return { labels, datasets: [{ label: 'Top Merchants', data, backgroundColor: labels.map((_, i) => `hsl(${(i * 60) % 360} 65% 45%)`) }] };
    }, [report]);

    const dailyChart = useMemo(() => {
        if (!report) return null;
        const labels = report.daily_trend.map(d => d.date.split('T')[0]);
        const data = report.daily_trend.map(d => d.total);
        return { labels, datasets: [{ label: 'Daily Spend', data, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.2 }] };
    }, [report]);

    const categoryRef = useRef();
    const merchantRef = useRef();
    const dailyRef = useRef();

    const chartOptions = {
        plugins: {
            legend: { position: 'bottom' },
            tooltip: { mode: 'index', intersect: false },
            zoom: {
                pan: { enabled: true, mode: 'x' },
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
            }
        },
        maintainAspectRatio: false,
        scales: { x: { ticks: { maxRotation: 0 } }, y: { beginAtZero: true } }
    };

    const downloadChart = (ref, filename) => {
        if (!ref || !ref.current) return;
        try {
            const base64 = ref.current.toBase64Image ? ref.current.toBase64Image() : (ref.current.chartInstance && ref.current.chartInstance.toBase64Image && ref.current.chartInstance.toBase64Image());
            if (!base64) return;
            const a = document.createElement('a');
            a.href = base64;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            console.error('Download failed', e);
        }
    };

    const resetZoom = (ref) => {
        try {
            if (ref && ref.current && ref.current.resetZoom) {
                ref.current.resetZoom();
            } else if (ref && ref.current && ref.current.chartInstance && ref.current.chartInstance.resetZoom) {
                ref.current.chartInstance.resetZoom();
            }
        } catch (e) { /* ignore */ }
    };

    return (
        <div>
            <h1 className="page-title">Reports</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label>Year</label>
                <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value || 0))} />
                <label>Month</label>
                <input type="number" min={1} max={12} value={month} onChange={e => setMonth(parseInt(e.target.value || 0))} />
                <button className="btn" onClick={() => fetchReport()}>Refresh</button>
                <button className="btn" onClick={() => handleExport('csv')}>Export CSV</button>
                <button className="btn" onClick={() => handleExport('xlsx')}>Export Excel</button>
                <button className="btn" onClick={() => handleExport('html')}>Export HTML</button>
            </div>

            {report && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="card">
                            <h3>Category Totals</h3>
                            <Bar data={categoryChart} />
                        </div>
                        <div className="card">
                            <h3>Top Merchants</h3>
                            <Doughnut data={merchantChart} />
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '1rem' }}>
                        <h3>Daily Trend</h3>
                        <Line data={dailyChart} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
