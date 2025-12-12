from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from datetime import date, timedelta
from pydantic import BaseModel

router = APIRouter(prefix='/reminders', tags=['reminders'])


class ReminderIn(BaseModel):
    title: str
    note: str = None
    due_date: date


@router.post('/')
def create_reminder(r: ReminderIn, db: Session = Depends(get_db)):
    rem = models.Reminder(title=r.title, note=r.note, due_date=r.due_date)
    db.add(rem)
    db.commit()
    db.refresh(rem)
    return {"id": rem.id, "message": "created"}


@router.get('/')
def list_reminders(include_dismissed: bool = False, db: Session = Depends(get_db)):
    q = db.query(models.Reminder)
    if not include_dismissed:
        q = q.filter(models.Reminder.dismissed == 0)
    items = q.order_by(models.Reminder.due_date.asc()).all()
    out = []
    for i in items:
        out.append({"id": i.id, "title": i.title, "note": i.note, "due_date": i.due_date.isoformat(), "dismissed": bool(i.dismissed), "snoozed_until": i.snoozed_until.isoformat() if i.snoozed_until else None})
    return out


@router.post('/{reminder_id}/dismiss')
def dismiss_reminder(reminder_id: int, db: Session = Depends(get_db)):
    r = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not r:
        raise HTTPException(status_code=404, detail='not found')
    r.dismissed = 1
    db.commit()
    return {"message": "dismissed"}


@router.post('/{reminder_id}/snooze')
def snooze_reminder(reminder_id: int, days: int = 1, db: Session = Depends(get_db)):
    r = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not r:
        raise HTTPException(status_code=404, detail='not found')
    r.snoozed_until = date.today() + timedelta(days=days)
    db.commit()
    return {"message": "snoozed", "until": r.snoozed_until.isoformat()}


@router.get('/due')
def due_reminders(within_days: int = 3, db: Session = Depends(get_db)):
    today = date.today()
    until = today + timedelta(days=within_days)
    items = db.query(models.Reminder).filter(models.Reminder.dismissed == 0).filter(models.Reminder.due_date <= until).all()
    out = []
    for i in items:
        out.append({"id": i.id, "title": i.title, "note": i.note, "due_date": i.due_date.isoformat(), "snoozed_until": i.snoozed_until.isoformat() if i.snoozed_until else None})
    return out
