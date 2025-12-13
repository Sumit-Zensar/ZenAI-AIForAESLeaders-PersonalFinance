from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from typing import List

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)

@router.post("/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/", response_model=List[schemas.Category])
def read_categories(type: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.Category)
    if type:
        query = query.filter(models.Category.type == type)
    categories = query.offset(skip).limit(limit).all()
    return categories

@router.put("/{category_id}", response_model=schemas.Category)
def update_category(category_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_category.name = category.name
    db_category.type = category.type
    
    db.commit()
    db.refresh(db_category)
    return db_category

@router.post("/merge")
def merge_categories(merge_data: schemas.CategoryMerge, db: Session = Depends(get_db)):
    print(f"Merging category {merge_data.source_id} into {merge_data.target_id}")
    source_cat = db.query(models.Category).filter(models.Category.id == merge_data.source_id).first()
    target_cat = db.query(models.Category).filter(models.Category.id == merge_data.target_id).first()
    
    if not source_cat or not target_cat:
        print("Source or Target category not found")
        raise HTTPException(status_code=404, detail="One or both categories not found")
    
    # Move expenses
    updated_expenses = db.query(models.Expense).filter(models.Expense.category_id == merge_data.source_id).update({"category_id": merge_data.target_id})
    print(f"Moved {updated_expenses} expenses")
    
    # Move income
    updated_income = db.query(models.Income).filter(models.Income.category_id == merge_data.source_id).update({"category_id": merge_data.target_id})
    print(f"Moved {updated_income} income records")
    
    # Delete source category
    db.delete(source_cat)
    db.commit()
    print("Merge committed successfully")
    
    return {"message": f"Merged '{source_cat.name}' into '{target_cat.name}' successfully"}
