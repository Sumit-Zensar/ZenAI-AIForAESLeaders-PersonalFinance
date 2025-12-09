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
