from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routes import expenses, income, categories, reports, ai, budgets, goals, anomalies, reminders

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personal Finance API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expenses.router)
app.include_router(income.router)
app.include_router(categories.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(budgets.router)
app.include_router(goals.router)
app.include_router(anomalies.router)
app.include_router(reminders.router)


# Seed default categories if none exist (simple, idempotent)
def seed_default_categories():
    from sqlalchemy.orm import Session
    db = None
    try:
        db = Session(bind=engine)
        count = db.query(models.Category).count()
        if count == 0:
            defaults = [
                ("Groceries", "expense"),
                ("Rent", "expense"),
                ("Utilities", "expense"),
                ("Transport", "expense"),
                ("Food & Drink", "expense"),
                ("Shopping", "expense"),
                ("Salary", "income"),
                ("Interest", "income"),
            ]
            for name, typ in defaults:
                db.add(models.Category(name=name, type=typ))
            db.commit()
    except Exception:
        pass
    finally:
        if db:
            db.close()


seed_default_categories()


# Backfill existing goals created_at: set to earliest contribution date if present, otherwise today
def backfill_goals_created_at():
    from sqlalchemy.orm import Session
    db = None
    try:
        db = Session(bind=engine)
        goals = db.query(models.Goal).all()
        for g in goals:
            if g.created_at is None:
                # find earliest contribution
                contrib = db.query(models.GoalContribution).filter(models.GoalContribution.goal_id == g.id).order_by(models.GoalContribution.date).first()
                if contrib and contrib.date:
                    g.created_at = contrib.date
                else:
                    g.created_at = datetime.utcnow()
        db.commit()
    except Exception:
        pass
    finally:
        if db:
            db.close()


backfill_goals_created_at()

@app.get("/")
def read_root():
    return {"message": "Welcome to Personal Finance API"}
