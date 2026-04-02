from fastapi import APIRouter
from ..database import get_analytics, get_price_history, get_top_price_drops

router = APIRouter()


@router.get("/analytics")
async def analytics():
    data = await get_analytics()
    return data


@router.get("/analytics/price-history/{asin}")
async def price_history(asin: str, days: int = 30):
    history = await get_price_history(asin, days)
    return history


@router.get("/analytics/price-drops")
async def price_drops(limit: int = 8):
    drops = await get_top_price_drops(limit)
    return drops
