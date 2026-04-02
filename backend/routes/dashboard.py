from fastapi import APIRouter
from ..database import get_dashboard_stats, get_scrape_activity, get_recent_jobs, get_top_price_drops

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard():
    stats = await get_dashboard_stats()
    activity = await get_scrape_activity()
    recent_jobs = await get_recent_jobs(limit=10)
    price_drops = await get_top_price_drops(limit=5)

    return {
        "metrics": stats["metrics"],
        "categoryBarData": stats["top_categories"],
        "scrapeActivity": activity,
        "recentJobs": recent_jobs,
        "priceDrops": price_drops,
        "nextScrape": stats.get("next_scrape"),
    }
