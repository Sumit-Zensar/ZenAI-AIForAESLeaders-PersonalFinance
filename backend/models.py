from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String) # "expense" or "income"

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category")
    merchant = Column(String)
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Income(Base):
    __tablename__ = "income"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category")
    source = Column(String)
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category = relationship("Category")
    amount = Column(Float, nullable=False)
    period_type = Column(String, default="monthly") # "monthly", "weekly"
    start_date = Column(Date, nullable=False)

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    deadline = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)


class MerchantMapping(Base):
    __tablename__ = "merchant_mappings"
    id = Column(Integer, primary_key=True, index=True)
    merchant = Column(String, unique=True, index=True)  # normalized merchant string
    canonical = Column(String, nullable=True)  # canonical merchant name
    category = Column(String, nullable=True)  # suggested/forced category
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class GoalContribution(Base):
    __tablename__ = "goal_contributions"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecurringTag(Base):
    __tablename__ = "recurring_tags"
    id = Column(Integer, primary_key=True, index=True)
    merchant = Column(String, nullable=True)
    category = Column(String, nullable=True)
    average_amount = Column(Float, nullable=True)
    interval_days = Column(Integer, nullable=True)
    next_expected = Column(Date, nullable=True)
    confirmed = Column(Integer, default=0)  # 0 not confirmed, 1 confirmed
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, nullable=True)
    amount = Column(Float, nullable=True)
    category = Column(String, nullable=True)
    score = Column(Float, nullable=True)
    message = Column(String, nullable=True)
    dismissed = Column(Integer, default=0)
    snoozed_until = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    note = Column(String, nullable=True)
    due_date = Column(Date, nullable=False)
    dismissed = Column(Integer, default=0)
    snoozed_until = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
