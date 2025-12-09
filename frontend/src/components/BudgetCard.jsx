import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const BudgetCard = ({ status }) => {
    const { budget, spent, remaining, utilization_pct, projected_spent, is_over_budget } = status;
    const categoryName = budget.category ? budget.category.name : "Overall Budget";
    const { currency } = useCurrency();

    let progressBarColor = "bg-green-500";
    if (utilization_pct > 100) {
        progressBarColor = "bg-red-500";
    } else if (utilization_pct > 80) {
        progressBarColor = "bg-yellow-500";
    }

    const formatCurrency = (amount) => {
        return `${currency}${amount.toFixed(2)}`;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{categoryName}</h3>
                <span className="text-sm text-gray-500 capitalize">{budget.period_type}</span>
            </div>

            <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-600">Spent: {formatCurrency(spent)}</span>
                <span className="font-medium text-gray-800">Budget: {formatCurrency(budget.amount)}</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                    className={`h-2.5 rounded-full ${progressBarColor}`}
                    style={{ width: `${Math.min(utilization_pct, 100)}%` }}
                ></div>
            </div>

            <div className="flex justify-between items-center text-sm mb-4">
                <span className={remaining < 0 ? "text-red-500 font-medium" : "text-green-600"}>
                    {remaining < 0 ? "Overspent: " : "Remaining: "} {formatCurrency(Math.abs(remaining))}
                </span>
                <span className="text-gray-500">{utilization_pct.toFixed(1)}% Used</span>
            </div>

            {is_over_budget && (
                <div className="flex items-center text-red-600 text-sm mb-2 bg-red-50 p-2 rounded">
                    <AlertTriangle size={16} className="mr-2" />
                    <span>You have exceeded your budget!</span>
                </div>
            )}

            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                Projected spend by end of period: <span className="font-medium">{formatCurrency(projected_spent)}</span>
            </div>
        </div>
    );
};

export default BudgetCard;
