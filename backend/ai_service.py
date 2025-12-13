def predict_category(merchant: str, notes: str):
    # Mock AI for MVP - Rule based
    merchant = merchant.lower()
    notes = notes.lower() if notes else ""
    
    # heuristics with confidence
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
    if amount is None:
        return False
    # Simple heuristic: amounts significantly larger than a threshold
    if amount > 1000:
        return True
    return False


def predict_with_confidence(merchant: str, notes: str):
    """Return (category, confidence, explanation)"""
    merchant_l = merchant.lower() if merchant else ""
    notes_l = notes.lower() if notes else ""

    # Run same heuristics but with confidence scores
    if "uber" in merchant_l or "lyft" in merchant_l or "taxi" in merchant_l:
        return ("Transport", 0.95, "Matched transport keywords in merchant")
    if "starbucks" in merchant_l or "coffee" in merchant_l:
        return ("Food & Drink", 0.9, "Matched coffee/restaurant keywords")
    if "amazon" in merchant_l or "shop" in merchant_l or "store" in merchant_l:
        return ("Shopping", 0.85, "Matched shopping keywords")
    if "netflix" in merchant_l or "spotify" in merchant_l or "movie" in merchant_l:
        return ("Entertainment", 0.9, "Matched streaming/entertainment keywords")
    if "rent" in merchant_l:
        return ("Rent", 0.95, "Matched rent keyword")
    if "electric" in merchant_l or "water" in merchant_l:
        return ("Utilities", 0.9, "Matched utilities keywords")
    if "salary" in merchant_l or "paycheck" in merchant_l:
        return ("Salary", 0.95, "Matched salary/paycheck keyword")

    # fallback: try notes
    if "grocery" in notes_l or "supermarket" in notes_l:
        return ("Groceries", 0.75, "Matched grocery in notes")

    # low confidence fallback using simple heuristics
    tokens = merchant_l.split()
    if len(tokens) > 0:
        # pick shopping as a generic low confidence
        return ("Shopping", 0.4, "Generic fallback based on merchant tokens")

    return (None, 0.0, "No prediction")
