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

class ChatRequest(BaseModel):
    message: str
    inventory_data: List[InventoryItem]


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

def compute_chat_fallback(message: str, items: list) -> str:
    """Smart rule-based chat when Gemini is rate-limited."""
    msg = message.lower().strip()
    if not items:
        return "No inventory data found. Please register some items first."

    total_items = len(items)
    total_stock = sum(i.get("count", 0) for i in items)
    total_sales = sum(i.get("sales", 0) for i in items)
    out_of_stock = [i for i in items if i.get("count", 0) == 0]
    low_stock = [i for i in items if 0 < i.get("count", 0) <= 10]
    top_seller = max(items, key=lambda x: x.get("sales", 0), default=None)
    most_stock = max(items, key=lambda x: x.get("count", 0), default=None)

    if any(w in msg for w in ["hello", "hi", "hey", "help"]):
        return (f"Hello! I'm ChainHandler AI. You have {total_items} items with "
                f"{total_stock:,} total units in stock. Ask me about low stock, top sellers, or inventory health!")

    if any(w in msg for w in ["low stock", "running low", "restock", "replenish", "shortage"]):
        if low_stock:
            names = ", ".join(i["name"] for i in low_stock[:5])
            return f"⚠️ {len(low_stock)} item(s) are low on stock: {names}. Recommend placing restock orders immediately."
        return "✅ All items are above the low-stock threshold (>10 units). Inventory looks healthy!"

    if any(w in msg for w in ["out of stock", "zero", "empty", "critical"]):
        if out_of_stock:
            names = ", ".join(i["name"] for i in out_of_stock[:5])
            return f"🚨 Critical: {len(out_of_stock)} item(s) are completely out of stock: {names}. Urgent restocking required!"
        return "✅ No items are out of stock. All SKUs have inventory available."

    if any(w in msg for w in ["top seller", "best seller", "most sold", "highest sales"]):
        if top_seller and top_seller.get("sales", 0) > 0:
            return (f"📈 Top seller is '{top_seller['name']}' with {top_seller['sales']:,} units sold. "
                    f"Ensure sufficient stock levels to meet demand.")
        return "No sales data recorded yet. Add sales figures to your inventory items for insights."

    if any(w in msg for w in ["summary", "overview", "status", "health", "report"]):
        health = "🟢 Healthy" if not out_of_stock and len(low_stock) <= 2 else "🟡 Needs Attention" if not out_of_stock else "🔴 Critical"
        return (f"📊 Inventory Summary — {health}\n"
                f"• {total_items} SKUs | {total_stock:,} units | {total_sales:,} sales\n"
                f"• {len(out_of_stock)} out of stock | {len(low_stock)} low stock\n"
                f"• Top seller: {top_seller['name'] if top_seller else 'N/A'}")

    if any(w in msg for w in ["how many", "count", "total", "quantity", "units"]):
        return (f"You have {total_items} registered items with {total_stock:,} total units across all locations. "
                f"Total recorded sales: {total_sales:,} units.")

    if any(w in msg for w in ["most stock", "highest", "largest"]):
        if most_stock:
            return f"'{most_stock['name']}' has the highest stock with {most_stock['count']:,} units at {most_stock.get('location', 'N/A')}."

    return (f"Based on your inventory: {total_items} items, {total_stock:,} total units, "
            f"{len(low_stock)} low-stock alerts. "
            f"Try asking about 'low stock', 'top seller', 'out of stock', or 'summary' for detailed insights.")


@app.post("/api/chat")
async def chat_assistant(request: ChatRequest):
    inventory_data = [item.dict() for item in request.inventory_data]

    if client:
        inventory_context = json.dumps(inventory_data)
        prompt = f"""
    You are 'ChainHandler AI', a professional Supply Chain Assistant.
    Answer the user's query based on the following current inventory data:
    {inventory_context}

    User Query: {request.message}

    Provide a concise, actionable, and professional response. Keep it brief (under 100 words if possible). Use plain text.
    """
        models_to_try = ["gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-2.0-flash"]
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(model=model_name, contents=prompt)
                return {"reply": response.text.strip()}
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    continue
                print(f"Chat error with {model_name}: {err_str}")
                break

    # Smart local fallback — works without API or when rate-limited
    return {"reply": compute_chat_fallback(request.message, inventory_data)}

