from database import SessionLocal
import models

db = SessionLocal()

# Create test categories
import time
timestamp = int(time.time())
cat_a = models.Category(name=f"MergeSource_{timestamp}", type="expense")
cat_b = models.Category(name=f"MergeTarget_{timestamp}", type="expense")
db.add(cat_a)
db.add(cat_b)
db.commit()
db.refresh(cat_a)
db.refresh(cat_b)

print(f"Created Source: {cat_a.id}, Target: {cat_b.id}")

from datetime import date

# Create test expense
exp = models.Expense(amount=100, category_id=cat_a.id, merchant="TestMerge", date=date(2023, 1, 1))
db.add(exp)
db.commit()
db.refresh(exp)

print(f"Created Expense: {exp.id} with Category: {exp.category_id}")

# Perform Merge Logic (Simulating the endpoint)
source_id = cat_a.id
target_id = cat_b.id

# Move expenses
db.query(models.Expense).filter(models.Expense.category_id == source_id).update({"category_id": target_id})
# Delete source
db.query(models.Category).filter(models.Category.id == source_id).delete()

db.commit()

# Verify
exp_updated = db.query(models.Expense).filter(models.Expense.id == exp.id).first()
cat_a_check = db.query(models.Category).filter(models.Category.id == source_id).first()

print(f"Updated Expense Category: {exp_updated.category_id} (Expected: {target_id})")
print(f"Source Category Exists: {cat_a_check is not None} (Expected: False)")

# Cleanup
db.delete(exp_updated)
db.delete(cat_b)
db.commit()
db.close()
