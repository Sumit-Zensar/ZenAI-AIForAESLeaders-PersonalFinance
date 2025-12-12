from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime, timedelta
from sqlalchemy import func
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/goals",
    tags=["goals"],
)


@router.post("/", response_model=schemas.Goal)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db)):
    db_goal = models.Goal(**goal.dict())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.get("/", response_model=List[schemas.Goal])
def list_goals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    goals = db.query(models.Goal).offset(skip).limit(limit).all()
    return goals


@router.get("/{goal_id}", response_model=schemas.Goal)
def get_goal(goal_id: int, db: Session = Depends(get_db)):
    g = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    return g


@router.put("/{goal_id}", response_model=schemas.Goal)
def update_goal(goal_id: int, goal: schemas.GoalUpdate, db: Session = Depends(get_db)):
    g = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal.name is not None:
        g.name = goal.name
    if goal.target_amount is not None:
        g.target_amount = goal.target_amount
    if goal.current_amount is not None:
        g.current_amount = goal.current_amount
    if goal.deadline is not None:
        g.deadline = goal.deadline

    db.commit()
    db.refresh(g)
    return g


@router.post("/{goal_id}/add")
def add_to_goal(goal_id: int, amount: float = Body(...), db: Session = Depends(get_db)):
    g = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    try:
        amt = float(amount)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid amount")
    g.current_amount = (g.current_amount or 0.0) + amt
    # record contribution
    try:
        contrib = models.GoalContribution(goal_id=g.id, amount=amt)
        db.add(contrib)
    except Exception:
        contrib = None
    db.commit()
    db.refresh(g)
    return {"message": "added", "current_amount": g.current_amount}


@router.get("/{goal_id}/progress", response_model=schemas.GoalProgress)
def goal_progress(goal_id: int, db: Session = Depends(get_db)):
    g = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")

    target = g.target_amount or 0.0
    current = g.current_amount or 0.0
    progress_pct = (current / target) * 100 if target > 0 else 0.0

    days_left = None
    message = None
    is_completed = False
    if g.deadline:
        delta = (g.deadline - date.today()).days
        days_left = delta
    # Compute recent net savings (income - expenses) to estimate completion
    window_days = 90
    since_date = date.today() - timedelta(days=window_days)
    try:
        income_sum = db.query(models.Income).with_entities(func.coalesce(func.sum(models.Income.amount), 0)).filter(models.Income.date >= since_date).scalar() or 0.0
        expense_sum = db.query(models.Expense).with_entities(func.coalesce(func.sum(models.Expense.amount), 0)).filter(models.Expense.date >= since_date).scalar() or 0.0
    except Exception:
        income_sum = 0.0
        expense_sum = 0.0

    total_net = (income_sum or 0.0) - (expense_sum or 0.0)
    monthly_net = (total_net / window_days) * 30 if window_days > 0 else 0.0

    estimated_completion_date = None
    projected_months = None
    if monthly_net and monthly_net > 0:
        remaining = max(0.0, target - current)
        projected_months = remaining / monthly_net if monthly_net > 0 else None
        if projected_months is not None:
            try:
                est_days = int(projected_months * 30)
                estimated_completion_date = date.today() + timedelta(days=est_days)
            except Exception:
                estimated_completion_date = None

    # Time-based expectation to determine if behind schedule
    behind_pct = None
    nudge_message = None
    if g.deadline and g.created_at:
        try:
            created_date = g.created_at.date() if isinstance(g.created_at, datetime) else g.created_at
            total_days = (g.deadline - created_date).days
            elapsed_days = (date.today() - created_date).days
            if total_days > 0 and elapsed_days > 0:
                expected_ratio = min(1.0, max(0.0, elapsed_days / total_days))
                expected_amount = target * expected_ratio
                if target > 0:
                    behind_amount = expected_amount - current
                    behind_pct = (behind_amount / target) if behind_amount > 0 else 0.0
                    # Nudge if behind more than 20%
                    if behind_pct and behind_pct > 0.20:
                        nudge_message = f"You're behind schedule by {round(behind_pct*100,1)}% — consider increasing contributions."
        except Exception:
            behind_pct = None

    if progress_pct >= 100:
        is_completed = True
        message = "Goal reached. Great job!"
    else:
        # Prefer nudge message if behind badly
        if nudge_message:
            message = nudge_message
        else:
            # Nudges near deadline
            if days_left is not None and days_left <= 7:
                message = "Deadline is within a week — consider increasing contributions."
            else:
                message = "Keep going! You're making progress."

    return schemas.GoalProgress(
        id=g.id,
        name=g.name,
        target_amount=target,
        current_amount=current,
        progress_pct=round(progress_pct, 2),
        days_left=days_left,
        is_completed=is_completed,
        message=message,
        estimated_completion_date=estimated_completion_date,
        projected_months_to_complete=(round(projected_months,2) if projected_months is not None else None),
        monthly_net_savings=(round(monthly_net,2) if monthly_net is not None else None),
        behind_pct=(round(behind_pct,3) if behind_pct is not None else None)
    )


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    g = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(g)
    db.commit()
    return {"message": "Goal deleted"}
