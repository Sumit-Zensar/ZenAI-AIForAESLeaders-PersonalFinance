def predict_category(merchant: str, notes: str):
    # Mock AI for MVP - Rule based
    merchant = merchant.lower()
    notes = notes.lower() if notes else ""
    
    if "uber" in merchant or "lyft" in merchant or "taxi" in merchant:
        return "Transport"
    if "starbucks" in merchant or "coffee" in merchant or "restaurant" in merchant or "food" in merchant:
        return "Food & Drink"
    if "amazon" in merchant or "shop" in merchant or "store" in merchant:
        return "Shopping"
    if "netflix" in merchant or "spotify" in merchant or "movie" in merchant:
        return "Entertainment"
    if "rent" in merchant or "electric" in merchant or "water" in merchant:
        return "Utilities"
    if "salary" in merchant or "paycheck" in merchant:
        return "Salary" # Though usually income
        
    return None

def detect_anomaly(amount: float, category: str):
    # Mock anomaly detection
    if amount > 1000:
        return True
    return False
