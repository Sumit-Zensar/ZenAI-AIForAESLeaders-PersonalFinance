from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta, datetime
import calendar
from database import get_db
import models, schemas
from sqlalchemy import func

router = APIRouter(
    prefix="/budgets",
    tags=["budgets"],
)

@router.post("/", response_model=schemas.Budget)
def create_budget(budget: schemas.BudgetCreate, db: Session = Depends(get_db)):
    # Check if budget already exists for this category/period? 
    # For simplicity, we'll allow multiple or overwrite. Let's check for existing active budget for same category.
    # Actually, let's just create a new one for now or update if ID is provided (but this is create).
    # A better approach for MVP: If a budget exists for this category (or overall) with same period_type, update it.
    
    existing_budget = db.query(models.Budget).filter(
        models.Budget.category_id == budget.category_id,
        models.Budget.period_type == budget.period_type
    ).first()

    if existing_budget:
        existing_budget.amount = budget.amount
        existing_budget.start_date = budget.start_date
        db.commit()
        db.refresh(existing_budget)
        return existing_budget

    db_budget = models.Budget(**budget.dict())
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.put("/{budget_id}", response_model=schemas.Budget)
def update_budget(budget_id: int, budget: schemas.BudgetCreate, db: Session = Depends(get_db)):
    db_budget = db.query(models.Budget).filter(models.Budget.id == budget_id).first()
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db_budget.amount = budget.amount
    db_budget.period_type = budget.period_type
    db_budget.start_date = budget.start_date
    db_budget.category_id = budget.category_id
    
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.delete("/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    db_budget = db.query(models.Budget).filter(models.Budget.id == budget_id).first()
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(db_budget)
    db.commit()
    return {"message": "Budget deleted successfully"}

@router.get("/", response_model=List[schemas.Budget])
def read_budgets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    budgets = db.query(models.Budget).offset(skip).limit(limit).all()
    return budgets

def get_date_range(period_type: str, start_date: date):
    today = date.today()
    if period_type == "monthly":
        # Assume budget applies to the current month of the start_date, or just the current month?
        # Requirement: "Set monthly/weekly budgets".
        # Let's assume the budget is recurring. So we look at the current month/week.
        
        # Start of current month
        period_start = date(today.year, today.month, 1)
        # End of current month
        last_day = calendar.monthrange(today.year, today.month)[1]
        period_end = date(today.year, today.month, last_day)
        return period_start, period_end
    elif period_type == "weekly":
        # Start of current week (Monday)
        period_start = today - timedelta(days=today.weekday())
        period_end = period_start + timedelta(days=6)
        return period_start, period_end
    return today, today

@router.get("/status", response_model=List[schemas.BudgetStatus])
def get_budgets_status(db: Session = Depends(get_db)):
    budgets = db.query(models.Budget).all()
    status_list = []
    
    today = date.today()

    for budget in budgets:
        period_start, period_end = get_date_range(budget.period_type, budget.start_date)
        
        # Query expenses
        query = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.date >= period_start,
            models.Expense.date <= period_end
        )
        
        if budget.category_id:
            query = query.filter(models.Expense.category_id == budget.category_id)
        
        spent = query.scalar() or 0.0
        remaining = budget.amount - spent
        utilization_pct = (spent / budget.amount) * 100 if budget.amount > 0 else 0.0
        is_over_budget = spent > budget.amount
        
        # Projection
        days_passed = (today - period_start).days + 1
        total_days = (period_end - period_start).days + 1
        
        if days_passed > 0:
            daily_avg = spent / days_passed
            projected_spent = daily_avg * total_days
        else:
            projected_spent = spent

        status_list.append(schemas.BudgetStatus(
            budget=schemas.Budget.model_validate(budget),
            spent=spent,
            remaining=remaining,
            utilization_pct=utilization_pct,
            projected_spent=projected_spent,
            is_over_budget=is_over_budget
        ))
        
    return status_list
