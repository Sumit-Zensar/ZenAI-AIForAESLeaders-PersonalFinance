from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class CategoryBase(BaseModel):
    name: str
    type: str

class CategoryCreate(CategoryBase):
    pass

class CategoryMerge(BaseModel):
    source_id: int
    target_id: int

class Category(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    amount: float
    date: date
    category_id: int
    merchant: Optional[str] = None
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    created_at: datetime
    category: Optional[Category] = None
    class Config:
        from_attributes = True

class IncomeBase(BaseModel):
    amount: float
    date: date
    category_id: int
    source: Optional[str] = None
    notes: Optional[str] = None

class IncomeCreate(IncomeBase):
    pass

class Income(IncomeBase):
    id: int
    created_at: datetime
    category: Optional[Category] = None
    class Config:
        from_attributes = True

class BudgetBase(BaseModel):
    amount: float
    period_type: str = "monthly"
    start_date: date
    category_id: Optional[int] = None

class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: int
    category: Optional[Category] = None
    class Config:
        from_attributes = True

class BudgetStatus(BaseModel):
    budget: Budget
    spent: float
    remaining: float
    utilization_pct: float
    projected_spent: float
    is_over_budget: bool
    class Config:
        from_attributes = True


class GoalBase(BaseModel):
    name: str
    target_amount: float
    deadline: Optional[date] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[date] = None

class Goal(GoalBase):
    id: int
    current_amount: float
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class GoalProgress(BaseModel):
    id: int
    name: str
    target_amount: float
    current_amount: float
    progress_pct: float
    days_left: Optional[int] = None
    is_completed: bool
    message: Optional[str] = None
    estimated_completion_date: Optional[date] = None
    projected_months_to_complete: Optional[float] = None
    monthly_net_savings: Optional[float] = None
    behind_pct: Optional[float] = None
    class Config:
        from_attributes = True


class AIPredictionRequest(BaseModel):
    merchant: str
    notes: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None


class AIPredictionResponse(BaseModel):
    category: Optional[str] = None
    confidence: Optional[float] = None
    normalized_merchant: Optional[str] = None
    is_recurring: Optional[bool] = False
    anomaly: Optional[bool] = False
    explanation: Optional[str] = None
