import asyncio
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from ..database import (
    get_schedules, save_schedule, delete_schedule,
    get_due_schedules, mark_schedule_ran, get_categories,
)
from ..scraper.core import scrape_category, scrape_job_state, log_action

router = APIRouter()

# Background task reference
_scheduler_task: Optional[asyncio.Task] = None


class ScheduleRequest(BaseModel):
    categoryName: str
    intervalHours: float = 6.0
    maxProducts: int = 100
    enabled: bool = True


@router.get("/schedules")
async def list_schedules():
    return await get_schedules()


@router.post("/schedules")
async def create_schedule(req: ScheduleRequest):
    now = datetime.now(timezone.utc)
    schedule = {
        "categoryName": req.categoryName,
        "intervalHours": req.intervalHours,
        "maxProducts": req.maxProducts,
        "enabled": req.enabled,
        "nextRunAt": now + timedelta(hours=req.intervalHours),
        "lastRunAt": None,
        "createdAt": now,
    }
    result = await save_schedule(schedule)
    return {"message": f"Schedule for '{req.categoryName}' saved", "id": result}


@router.delete("/schedules/{schedule_id}")
async def remove_schedule(schedule_id: str):
    deleted = await delete_schedule(schedule_id)
    if deleted:
        return {"message": "Schedule deleted"}
    return {"message": "Schedule not found"}


# ── Auto-scrape background loop ──

async def scheduler_loop():
    """Check for due schedules every 60 seconds and run them."""
    while True:
        try:
            due = await get_due_schedules()
            for sched in due:
                if scrape_job_state["running"]:
                    break  # Don't overlap with manual scrapes

                cat_name = sched.get("categoryName")
                max_products = sched.get("maxProducts", 100)
                interval = sched.get("intervalHours", 6.0)

                # Find URL for this category
                all_cats = await get_categories()
                target = next((c for c in all_cats if c["name"] == cat_name), None)

                if target and target.get("url"):
                    scrape_job_state["running"] = True
                    scrape_job_state["products_found"] = 0
                    scrape_job_state["errors"] = 0
                    scrape_job_state["pages_done"] = 0
                    scrape_job_state["progress"] = 0.0

                    log_action("INFO", f"[SCHEDULED] Auto-scraping: {cat_name}")
                    await scrape_category(
                        target["url"], cat_name,
                        max_products_override=max_products,
                    )
                    scrape_job_state["running"] = False
                    scrape_job_state["current_category"] = "Idle"
                    log_action("INFO", f"[SCHEDULED] Completed: {cat_name}")

                # Update next run time
                next_run = datetime.now(timezone.utc) + timedelta(hours=interval)
                await mark_schedule_ran(sched["_id"], next_run)

        except Exception as e:
            log_action("ERROR", f"Scheduler error: {str(e)}")

        await asyncio.sleep(60)  # Check every minute


def start_scheduler():
    """Start the background scheduler loop."""
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(scheduler_loop())
        return True
    return False
