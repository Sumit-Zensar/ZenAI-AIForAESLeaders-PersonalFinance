from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import ai_service

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
)

class PredictionRequest(BaseModel):
    merchant: str
    notes: Optional[str] = None

class PredictionResponse(BaseModel):
    category: Optional[str]

@router.post("/predict_category", response_model=PredictionResponse)
def predict_category(request: PredictionRequest):
    category = ai_service.predict_category(request.merchant, request.notes or "")
    return {"category": category}
