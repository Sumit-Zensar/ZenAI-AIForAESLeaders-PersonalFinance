import requests
from datetime import date

BASE_URL = "http://127.0.0.1:8000"

def test_budgets():
    # 1. Create Category
    print("Creating Category...")
    cat_res = requests.post(f"{BASE_URL}/categories/", json={"name": "Food", "type": "expense"})
    if cat_res.status_code != 200:
        print("Failed to create category:", cat_res.text)
        return
    cat_id = cat_res.json()["id"]
    print(f"Category created: {cat_id}")

    # 2. Create Budget
    print("Creating Budget...")
    budget_data = {
        "amount": 500.0,
        "period_type": "monthly",
        "start_date": str(date.today()),
        "category_id": cat_id
    }
    budget_res = requests.post(f"{BASE_URL}/budgets/", json=budget_data)
    if budget_res.status_code != 200:
        print("Failed to create budget:", budget_res.text)
        return
    print("Budget created:", budget_res.json())

    # 3. Add Expense
    print("Adding Expense...")
    expense_data = {
        "amount": 150.0,
        "date": str(date.today()),
        "category_id": cat_id,
        "merchant": "Grocery Store",
        "notes": "Weekly groceries"
    }
    exp_res = requests.post(f"{BASE_URL}/expenses/", json=expense_data)
    if exp_res.status_code != 200:
        print("Failed to add expense:", exp_res.text)
        return
    print("Expense added.")

    # 4. Check Status
    print("Checking Status...")
    status_res = requests.get(f"{BASE_URL}/budgets/status")
    if status_res.status_code != 200:
        print("Failed to get status:", status_res.text)
        return
    
    statuses = status_res.json()
    for s in statuses:
        print(f"Budget Status: Spent={s['spent']}, Remaining={s['remaining']}, Utilization={s['utilization_pct']}%, Projected={s['projected_spent']}")
        if s['spent'] == 150.0 and s['remaining'] == 350.0:
            print("SUCCESS: Budget calculations are correct.")
        else:
            print("FAILURE: Budget calculations are incorrect.")

if __name__ == "__main__":
    test_budgets()
