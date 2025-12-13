from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from database import get_db
from sqlalchemy.orm import Session
import ai_service, models, schemas
from datetime import date, timedelta
from sqlalchemy import func
import difflib
import re
from fastapi import Body
from typing import Optional

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
)

class PredictionRequest(BaseModel):
    merchant: str
    notes: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None


@router.post("/predict_category", response_model=schemas.AIPredictionResponse)
def predict_category(request: PredictionRequest, db: Session = Depends(get_db)):
    merchant = (request.merchant or "").strip()
    notes = request.notes or ""

    def normalize(s: str) -> str:
        if not s:
            return ""
        s = s.lower().strip()
        s = re.sub(r"#\d+", "", s)
        s = re.sub(r"\bno\.?\s*\d+\b", "", s)
        s = re.sub(r"[^a-z0-9\s]", "", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def similarity(a: str, b: str) -> float:
        if not a or not b:
            return 0.0
        return difflib.SequenceMatcher(None, a, b).ratio()

    normalized = normalize(merchant)

    # Check exact persisted mapping first
    mapping = db.query(models.MerchantMapping).filter(models.MerchantMapping.merchant == normalized).first()
    if mapping and mapping.category:
        return schemas.AIPredictionResponse(
            category=mapping.category,
            confidence=0.98,
            normalized_merchant=mapping.canonical or mapping.merchant,
            is_recurring=False,
            anomaly=ai_service.detect_anomaly(request.amount, mapping.category),
            explanation="User-corrected mapping"
        )

    # Fuzzy match against existing mappings
    FUZZY_THRESHOLD = 0.8
    best = None
    best_score = 0.0
    for m in db.query(models.MerchantMapping).all():
        score = max(similarity(normalized, normalize(m.merchant or "")), similarity(normalized, normalize(m.canonical or "")))
        if score > best_score:
            best_score = score
            best = m

    if best and best_score >= FUZZY_THRESHOLD and best.category:
        conf = round(0.9 * best_score, 2)
        return schemas.AIPredictionResponse(
            category=best.category,
            confidence=conf,
            normalized_merchant=best.canonical or best.merchant,
            is_recurring=False,
            anomaly=ai_service.detect_anomaly(request.amount, best.category),
            explanation=f"Matched saved mapping (similarity={round(best_score,2)})"
        )

    # Ask ai_service for prediction + confidence
    pred_category, confidence, explanation = ai_service.predict_with_confidence(merchant, notes)

    # Detect recurring: simple heuristic - count similar merchant occurrences in recent expenses
    is_recurring = False
    try:
        recent_count = db.query(func.count(models.Expense.id)).filter(
            models.Expense.merchant != None,
            func.lower(models.Expense.merchant) == normalized,
            models.Expense.date >= (date.today() - timedelta(days=90))
        ).scalar()
        is_recurring = (recent_count or 0) >= 2
    except Exception:
        is_recurring = False

    anomaly = ai_service.detect_anomaly(request.amount, pred_category)

    return schemas.AIPredictionResponse(
        category=pred_category,
        confidence=confidence,
        normalized_merchant=normalized,
        is_recurring=is_recurring,
        anomaly=anomaly,
        explanation=explanation
    )



class RecurringCheckIn(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None


@router.post('/recurring_check')
def recurring_check(payload: RecurringCheckIn, db: Session = Depends(get_db)):
    """Check if the provided merchant/amount looks recurring; returns confidence and suggested next date."""
    m = (payload.merchant or '').strip()
    amt = payload.amount
    d = payload.date or date.today()

    def normalize(s: str) -> str:
        if not s:
            return ""
        s = s.lower().strip()
        s = re.sub(r"[^a-z0-9\s]", "", s)
        s = re.sub(r"\s+", " ", s)
        return s

    nm = normalize(m)
    # find similar merchants in the last 365 days
    rows = db.query(models.Expense).filter(models.Expense.merchant != None).all()
    candidates = []
    for e in rows:
        if not e.merchant:
            continue
        em = normalize(e.merchant)
        if nm and em and (difflib.SequenceMatcher(None, nm, em).ratio() >= 0.7):
            candidates.append(e)

    if len(candidates) < 2:
        return {"is_recurring": False, "confidence": 0.0}

    # compute intervals between occurrences (sorted by date)
    dates = sorted([c.date for c in candidates if c.date])
    intervals = []
    for i in range(1, len(dates)):
        intervals.append((dates[i] - dates[i-1]).days)

    if not intervals:
        return {"is_recurring": False, "confidence": 0.0}

    avg_interval = sum(intervals) / len(intervals)
    # measure regularity: low stddev means regular
    import statistics
    try:
        stdev = statistics.pstdev(intervals)
    except Exception:
        stdev = 0.0

    # confidence function: more samples and lower stdev increases confidence
    confidence = min(1.0, max(0.0, (len(intervals) / 12) * (1.0 - (stdev / (avg_interval + 1)))))

    suggested_next = (dates[-1] + timedelta(days=round(avg_interval))) if dates else None

    return {"is_recurring": confidence >= 0.7, "confidence": round(confidence, 2), "avg_interval_days": round(avg_interval, 1), "next_expected": suggested_next.isoformat() if suggested_next else None}


@router.post('/recurring_confirm')
def recurring_confirm(merchant: str = Body(...), category: str = Body(None), average_amount: float = Body(None), interval_days: int = Body(None), db: Session = Depends(get_db)):
    # create or update a RecurringTag
    def normalize(s: str) -> str:
        if not s:
            return ""
        s = s.lower().strip()
        s = re.sub(r"[^a-z0-9\s]", "", s)
        s = re.sub(r"\s+", " ", s)
        return s

    nm = normalize(merchant)
    if not nm:
        return {"error": "merchant required"}

    from datetime import date
    next_dt = (date.today() + timedelta(days=interval_days)) if interval_days else None
    tag = models.RecurringTag(merchant=nm, category=category, average_amount=average_amount, interval_days=interval_days, next_expected=next_dt, confirmed=1)
    db.add(tag)
    db.commit()
    return {"message": "recurring tag created", "merchant": nm}


class ConfirmRequest(BaseModel):
    merchant: str
    category: str
    canonical: Optional[str] = None


@router.post("/confirm_category")
def confirm_category(req: ConfirmRequest, db: Session = Depends(get_db)):
    def normalize(s: str) -> str:
        if not s:
            return ""
        s = s.lower().strip()
        s = re.sub(r"#\d+", "", s)
        s = re.sub(r"\bno\.?\s*\d+\b", "", s)
        s = re.sub(r"[^a-z0-9\s]", "", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def similarity(a: str, b: str) -> float:
        if not a or not b:
            return 0.0
        return difflib.SequenceMatcher(None, a, b).ratio()

    merchant = normalize(req.merchant)
    if not merchant or not req.category:
        raise HTTPException(status_code=400, detail="merchant and category required")

    # If exact mapping exists, update it
    mapping = db.query(models.MerchantMapping).filter(models.MerchantMapping.merchant == merchant).first()
    if mapping:
        mapping.category = req.category
        if req.canonical:
            mapping.canonical = req.canonical
        db.commit()
        return {"message": "mapping updated", "merchant": merchant, "category": req.category}

    # Otherwise, try to find a similar existing mapping and create an alias
    FUZZY_THRESHOLD = 0.8
    best = None
    best_score = 0.0
    for m in db.query(models.MerchantMapping).all():
        score = max(similarity(merchant, normalize(m.merchant or "")), similarity(merchant, normalize(m.canonical or "")))
        if score > best_score:
            best_score = score
            best = m

    if best and best_score >= FUZZY_THRESHOLD:
        # create alias row pointing to the existing canonical and category
        alias_canonical = best.canonical or best.merchant
        alias = models.MerchantMapping(merchant=merchant, canonical=alias_canonical, category=req.category)
        db.add(alias)
        db.commit()
        return {"message": f"alias created (mapped to existing canonical, similarity={round(best_score,2)})", "merchant": merchant, "mapped_to": alias_canonical}

    # No similar mapping found -> create new mapping
    mapping = models.MerchantMapping(merchant=merchant, canonical=(req.canonical or merchant), category=req.category, notes=None)
    db.add(mapping)
    db.commit()
    return {"message": "mapping saved", "merchant": merchant, "category": req.category}
