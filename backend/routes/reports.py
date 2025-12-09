from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from database import get_db

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total_expense = db.query(func.sum(models.Expense.amount)).scalar() or 0.0
    total_income = db.query(func.sum(models.Income.amount)).scalar() or 0.0
    balance = total_income - total_expense
    return {
        "total_expense": total_expense,
        "total_income": total_income,
        "balance": balance
    }
