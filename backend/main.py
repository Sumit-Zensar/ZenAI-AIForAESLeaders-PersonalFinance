from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routes import expenses, income, categories, reports, ai, budgets

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

@app.get("/")
def read_root():
    return {"message": "Welcome to Personal Finance API"}
