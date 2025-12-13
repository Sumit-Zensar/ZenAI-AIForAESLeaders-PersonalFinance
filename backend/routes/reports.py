from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from database import get_db
from datetime import date, datetime
import calendar
from fastapi.responses import StreamingResponse, HTMLResponse
import io
import csv
import pandas as pd
from typing import List, Optional

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


@router.get('/projected_eom')
def projected_eom_spend(year: int = None, month: int = None, db: Session = Depends(get_db)):
    """Project end-of-month spend based on month-to-date trend.

    If no year/month provided, uses current month. For past months returns actual total (no projection).
    Returns total_so_far, days_elapsed, total_days, projected_total and per-category breakdown.
    """
    today = date.today()
    if year is None or month is None:
        year = today.year
        month = today.month

    # compute month start and end
    month_start = date(year, month, 1)
    _, total_days = calendar.monthrange(year, month)
    month_end = date(year, month, total_days)

    # if requested month is current
    is_current_month = (year == today.year and month == today.month)

    # sum of expenses from month_start up to either today (if current) or month_end (if past)
    end_date_for_sum = today if is_current_month else month_end

    total_so_far = db.query(func.sum(models.Expense.amount)).filter(models.Expense.date >= month_start, models.Expense.date <= end_date_for_sum).scalar() or 0.0

    # days elapsed in period used for trend
    if is_current_month:
        days_elapsed = (today - month_start).days + 1
    else:
        days_elapsed = total_days

    # projected total: if current month, scale by days; if past month, actual is final
    if is_current_month and days_elapsed > 0:
        projected_total = (total_so_far / days_elapsed) * total_days
    else:
        projected_total = total_so_far

    # per-category breakdown
    cat_rows = db.query(models.Category.name, func.sum(models.Expense.amount)).join(models.Expense, models.Expense.category_id == models.Category.id).filter(models.Expense.date >= month_start, models.Expense.date <= end_date_for_sum).group_by(models.Category.name).all()
    per_category = []
    for cat_name, cat_sum in cat_rows:
        cat_sum = cat_sum or 0.0
        if is_current_month and days_elapsed > 0:
            projected_cat = (cat_sum / days_elapsed) * total_days
        else:
            projected_cat = cat_sum
        per_category.append({"category": cat_name, "so_far": cat_sum, "projected": projected_cat})

    return {
        "year": year,
        "month": month,
        "total_so_far": total_so_far,
        "days_elapsed": days_elapsed,
        "total_days": total_days,
        "projected_total": projected_total,
        "per_category": per_category
    }


@router.get('/month')
def monthly_report(year: int = None, month: int = None, category_ids: Optional[str] = None, merchant: Optional[str] = None, min_amount: Optional[float] = None, max_amount: Optional[float] = None, db: Session = Depends(get_db)):
    """Return category totals, top merchants and daily trend for a given month and optional filters.
    `category_ids` is comma separated list of category ids to include.
    """
    today = date.today()
    if year is None or month is None:
        year = today.year
        month = today.month

    month_start = date(year, month, 1)
    _, total_days = calendar.monthrange(year, month)
    month_end = date(year, month, total_days)

    q = db.query(models.Expense).filter(models.Expense.date >= month_start, models.Expense.date <= month_end)
    if category_ids:
        ids = [int(x) for x in category_ids.split(',') if x.strip().isdigit()]
        if ids:
            q = q.filter(models.Expense.category_id.in_(ids))
    if merchant:
        q = q.filter(models.Expense.merchant.ilike(f"%{merchant}%"))
    if min_amount is not None:
        q = q.filter(models.Expense.amount >= min_amount)
    if max_amount is not None:
        q = q.filter(models.Expense.amount <= max_amount)

    expenses = q.all()

    # category totals
    cat_totals = db.query(models.Category.name, func.sum(models.Expense.amount)).join(models.Expense, models.Expense.category_id == models.Category.id).filter(models.Expense.date >= month_start, models.Expense.date <= month_end)
    if category_ids:
        ids = [int(x) for x in category_ids.split(',') if x.strip().isdigit()]
        if ids:
            cat_totals = cat_totals.filter(models.Expense.category_id.in_(ids))
    cat_totals = cat_totals.group_by(models.Category.name).all()
    categories = [{"category": name, "total": total or 0.0} for name, total in cat_totals]

    # top merchants
    merchant_rows = db.query(models.Expense.merchant, func.sum(models.Expense.amount)).filter(models.Expense.date >= month_start, models.Expense.date <= month_end)
    if merchant:
        merchant_rows = merchant_rows.filter(models.Expense.merchant.ilike(f"%{merchant}%"))
    merchant_rows = merchant_rows.group_by(models.Expense.merchant).order_by(func.sum(models.Expense.amount).desc()).limit(10).all()
    top_merchants = [{"merchant": m or "", "total": s or 0.0} for m, s in merchant_rows]

    # daily trend
    daily = []
    for d in range(1, total_days + 1):
        day = date(year, month, d)
        day_sum = db.query(func.sum(models.Expense.amount)).filter(models.Expense.date == day)
        if category_ids:
            ids = [int(x) for x in category_ids.split(',') if x.strip().isdigit()]
            if ids:
                day_sum = day_sum.filter(models.Expense.category_id.in_(ids))
        s = day_sum.scalar() or 0.0
        daily.append({"date": day.isoformat(), "total": s})

    return {
        "year": year,
        "month": month,
        "categories": categories,
        "top_merchants": top_merchants,
        "daily_trend": daily,
        "expenses_count": len(expenses)
    }


@router.get('/export')
def export_report(format: str = 'csv', year: int = None, month: int = None, category_ids: Optional[str] = None, merchant: Optional[str] = None, min_amount: Optional[float] = None, max_amount: Optional[float] = None, db: Session = Depends(get_db)):
    # reuse monthly_report logic to collect rows
    report = monthly_report(year=year, month=month, category_ids=category_ids, merchant=merchant, min_amount=min_amount, max_amount=max_amount, db=db)

    # Build flat rows for export: date, merchant, category, amount
    month = report.get('month')
    year = report.get('year')
    month_start = date(year, month, 1)
    _, total_days = calendar.monthrange(year, month)
    month_end = date(year, month, total_days)

    q = db.query(models.Expense).filter(models.Expense.date >= month_start, models.Expense.date <= month_end)
    if category_ids:
        ids = [int(x) for x in category_ids.split(',') if x.strip().isdigit()]
        if ids:
            q = q.filter(models.Expense.category_id.in_(ids))
    if merchant:
        q = q.filter(models.Expense.merchant.ilike(f"%{merchant}%"))
    if min_amount is not None:
        q = q.filter(models.Expense.amount >= min_amount)
    if max_amount is not None:
        q = q.filter(models.Expense.amount <= max_amount)

    rows = []
    for e in q.all():
        rows.append({
            "date": e.date.isoformat(),
            "merchant": e.merchant,
            "category": (e.category.name if e.category else None),
            "amount": e.amount,
            "notes": e.notes
        })

    df = pd.DataFrame(rows)

    if format == 'csv':
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        stream.seek(0)
        return StreamingResponse(io.BytesIO(stream.getvalue().encode('utf-8')), media_type='text/csv', headers={"Content-Disposition": f"attachment; filename=report_{year}_{month}.csv"})
    elif format in ('xlsx', 'excel'):
        out = io.BytesIO()
        with pd.ExcelWriter(out, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Report')
        out.seek(0)
        return StreamingResponse(out, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={"Content-Disposition": f"attachment; filename=report_{year}_{month}.xlsx"})
    else:
        # return simple HTML table (printable for PDF)
        html = df.to_html(index=False)
        return HTMLResponse(content=f"<html><body><h1>Report {year}-{month}</h1>{html}</body></html>")
