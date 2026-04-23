import os
import json
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
client = None
if api_key:
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Could not init Gemini client: {e}")

app = FastAPI(title="ChainHandler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InventoryItem(BaseModel):
    id: str
    name: str
    count: int
    type: Optional[str] = "General"
    sales: Optional[int] = 0
    status: Optional[str] = "Normal"

class AnalysisRequest(BaseModel):
    items: List[InventoryItem]


def compute_fallback_analysis(inventory_data: list) -> dict:
    """Compute smart analysis from inventory data without AI."""
    items = inventory_data

    # Top seller by sales
    top_seller = max(items, key=lambda x: x.get("sales", 0), default=None)
    if not top_seller:
        top_seller = {"name": "N/A", "sales": 0, "type": "General"}

    # Items needing restock (count < 20)
    restock_needed = [
        {"name": i["name"], "count": i["count"]}
        for i in items if i.get("count", 0) < 20
    ]

    # Efficiency tips: items with high stock but zero sales (overstocked)
    efficiency_tips = [
        {"name": i["name"], "units": i["count"], "reason": "High stock, low turnover. Consider redistributing."}
        for i in items if i.get("count", 0) > 100 and i.get("sales", 0) == 0
    ]

    # Compute aggregate stats for market intelligence
    total_items = len(items)
    total_stock = sum(i.get("count", 0) for i in items)
    total_sales = sum(i.get("sales", 0) for i in items)
    low_stock_count = len(restock_needed)

    # Sentiment based on supply health
    supply_ratio = total_stock / max(total_sales, 1)
    if supply_ratio > 5:
        sentiment = "Positive"
        sentiment_desc = "Inventory levels are well above demand. Supply chain is healthy."
    elif supply_ratio > 2:
        sentiment = "Neutral"
        sentiment_desc = "Supply and demand are balanced. Monitor high-velocity items."
    else:
        sentiment = "Urgent"
        sentiment_desc = "Demand is outpacing supply. Expedite replenishment orders now."

    market_intelligence = [
        {
            "id": "social",
            "title": "Supply Health",
            "value": sentiment,
            "desc": sentiment_desc,
            "color": "text-blue-500",
            "bg": "bg-blue-50",
            "icon": "MessageSquare"
        },
        {
            "id": "news",
            "title": "Stock Coverage",
            "value": f"{total_stock:,} units",
            "desc": f"Total inventory across {total_items} SKUs. {low_stock_count} items need restocking soon.",
            "color": "text-purple-500",
            "bg": "bg-purple-50",
            "icon": "Globe"
        },
        {
            "id": "cost",
            "title": "Sales Velocity",
            "value": f"{total_sales:,}/mo",
            "desc": f"Monthly sales across all categories. Top performer: {top_seller['name']}.",
            "color": "text-amber-500",
            "bg": "bg-amber-50",
            "icon": "DollarSign"
        },
        {
            "id": "demand",
            "title": "Demand Pressure",
            "value": f"{low_stock_count} alerts",
            "desc": f"{low_stock_count} item(s) below safe stock threshold. Immediate action recommended.",
            "color": "text-rose-500",
            "bg": "bg-rose-50",
            "icon": "ShoppingCart"
        }
    ]

    return {
        "marketIntelligence": market_intelligence,
        "topSeller": {"name": top_seller["name"], "sales": top_seller.get("sales", 0), "type": top_seller.get("type", "General")},
        "restockNeeded": restock_needed,
        "efficiencyTips": efficiency_tips,
        "source": "local"   # Flag to indicate fallback was used
    }


@app.get("/")
def read_root():
    return {"message": "Welcome to ChainHandler API with Gemini AI"}


@app.post("/api/ai-analyze")
async def analyze_inventory(request: AnalysisRequest):
    inventory_data = [item.dict() for item in request.items]

    # Try Gemini AI first
    if client:
        prompt = f"""
        Act as a professional Supply Chain Consultant for 'ChainHandler'.
        
        DATA:
        {json.dumps(inventory_data)}
        
        Analyze the inventory and respond ONLY with a JSON block with this exact structure:
        {{
            "marketIntelligence": [
                {{ "id": "social", "title": "Supply Health", "value": "...", "desc": "...", "color": "text-blue-500", "bg": "bg-blue-50", "icon": "MessageSquare" }},
                {{ "id": "news", "title": "Stock Coverage", "value": "...", "desc": "...", "color": "text-purple-500", "bg": "bg-purple-50", "icon": "Globe" }},
                {{ "id": "cost", "title": "Sales Velocity", "value": "...", "desc": "...", "color": "text-amber-500", "bg": "bg-amber-50", "icon": "DollarSign" }},
                {{ "id": "demand", "title": "Demand Pressure", "value": "...", "desc": "...", "color": "text-rose-500", "bg": "bg-rose-50", "icon": "ShoppingCart" }}
            ],
            "topSeller": {{ "name": "...", "sales": 0, "type": "..." }},
            "restockNeeded": [ {{ "name": "...", "count": 0 }} ],
            "efficiencyTips": [ {{ "name": "...", "units": 0, "reason": "..." }} ]
        }}
        
        Be realistic, data-driven, and professional. Respond ONLY with the JSON.
        """

        # Try multiple models in order of preference
        models_to_try = [
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash-8b",
            "gemini-2.0-flash",
        ]

        for model_name in models_to_try:
            try:
                print(f"Trying model: {model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                text = response.text
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].strip()

                result = json.loads(text)
                result["source"] = "gemini"
                print(f"Success with model: {model_name}")
                return result

            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    print(f"Rate limited on {model_name}, trying next...")
                    continue
                else:
                    print(f"Non-quota error on {model_name}: {err_str}")
                    break  # Non-quota error, fall through to fallback

    # Fallback: compute analysis locally from inventory data
    print("Using local fallback analysis (no AI quota available).")
    return compute_fallback_analysis(inventory_data)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "ai_ready": client is not None}
