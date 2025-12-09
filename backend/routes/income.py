from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/income",
    tags=["income"],
)

@router.post("/", response_model=schemas.Income)
def create_income(income: schemas.IncomeCreate, db: Session = Depends(get_db)):
    db_income = models.Income(**income.dict())
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

@router.get("/", response_model=List[schemas.Income])
def read_income(
    skip: int = 0, 
    limit: int = 100, 
    start_date: str = None, 
    end_date: str = None, 
    category_id: int = None, 
    source: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Income)
    
    if start_date:
        query = query.filter(models.Income.date >= start_date)
    if end_date:
        query = query.filter(models.Income.date <= end_date)
    if category_id:
        query = query.filter(models.Income.category_id == category_id)
    if source:
        query = query.filter(models.Income.source.ilike(f"%{source}%"))
        
    income = query.order_by(models.Income.date.desc()).offset(skip).limit(limit).all()
    return income

@router.delete("/{income_id}")
def delete_income(income_id: int, db: Session = Depends(get_db)):
    db_income = db.query(models.Income).filter(models.Income.id == income_id).first()
    if db_income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    db.delete(db_income)
    db.commit()
    return {"ok": True}

@router.put("/{income_id}", response_model=schemas.Income)
def update_income(income_id: int, income: schemas.IncomeCreate, db: Session = Depends(get_db)):
    db_income = db.query(models.Income).filter(models.Income.id == income_id).first()
    if db_income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    
    for key, value in income.dict().items():
        setattr(db_income, key, value)
    
    db.commit()
    db.refresh(db_income)
    return db_income
