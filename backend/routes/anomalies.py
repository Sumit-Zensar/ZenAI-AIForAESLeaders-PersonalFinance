from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models, ai_service
from datetime import date, timedelta
from typing import Optional

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get('/')
def list_anomalies(include_dismissed: Optional[bool] = False, db: Session = Depends(get_db)):
    q = db.query(models.AnomalyLog)
    if not include_dismissed:
        q = q.filter(models.AnomalyLog.dismissed == 0)
    items = q.order_by(models.AnomalyLog.created_at.desc()).all()
    result = []
    for a in items:
        result.append({
            'id': a.id,
            'expense_id': a.expense_id,
            'amount': a.amount,
            'category': a.category,
            'score': a.score,
            'message': a.message,
            'dismissed': bool(a.dismissed),
            'snoozed_until': a.snoozed_until.isoformat() if a.snoozed_until else None,
            'created_at': a.created_at.isoformat() if a.created_at else None
        })
    return result


@router.post('/scan')
def scan_recent_for_anomalies(days: int = 30, db: Session = Depends(get_db)):
    since = date.today() - timedelta(days=days)
    expenses = db.query(models.Expense).filter(models.Expense.date >= since).all()
    created = 0
    for e in expenses:
        score_bool = ai_service.detect_anomaly(e.amount, e.category.name if e.category else None)
        score = 1.0 if score_bool else 0.0
        if score > 0:
            # create an anomaly log if not already exists for this expense
            exists = db.query(models.AnomalyLog).filter(models.AnomalyLog.expense_id == e.id).first()
            if not exists:
                al = models.AnomalyLog(expense_id=e.id, amount=e.amount, category=(e.category.name if e.category else None), score=score, message='Automatic anomaly detection')
                db.add(al)
                created += 1
    db.commit()
    return {"created": created}


@router.post('/{anomaly_id}/dismiss')
def dismiss_anomaly(anomaly_id: int, db: Session = Depends(get_db)):
    a = db.query(models.AnomalyLog).filter(models.AnomalyLog.id == anomaly_id).first()
    if not a:
        raise HTTPException(status_code=404, detail='anomaly not found')
    a.dismissed = 1
    db.commit()
    return {"message": "dismissed"}


@router.post('/{anomaly_id}/snooze')
def snooze_anomaly(anomaly_id: int, days: int = 7, db: Session = Depends(get_db)):
    a = db.query(models.AnomalyLog).filter(models.AnomalyLog.id == anomaly_id).first()
    if not a:
        raise HTTPException(status_code=404, detail='anomaly not found')
    a.snoozed_until = date.today() + timedelta(days=days)
    db.commit()
    return {"message": "snoozed", "until": a.snoozed_until.isoformat()}
