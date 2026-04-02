from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import List

from ..scraper.core import scrape_job_state, scrape_category, log_action
from ..database import get_categories, save_scrape_job, update_scrape_job

router = APIRouter()


class ScrapeRequest(BaseModel):
    categories: List[str]
    max_products: int = 100
    delay: float = 2.0


async def run_scrape_jobs(categories: List[str], max_products: int, delay: float, job_id: str):
    """Background task that runs scrape jobs sequentially."""
    # Retrieve actual URLs for the requested category names
    all_cats = await get_categories()

    # Flatten (include children)
    flat_cats = []
    for c in all_cats:
        flat_cats.append(c)
        flat_cats.extend(c.get("children", []))

    total_categories = len(categories)
    completed = 0
    total_products = 0

    for cat_name in categories:
        if not scrape_job_state["running"]:
            log_action("WARN", "Scraper stopped by user.")
            break

        target = next((c for c in flat_cats if c["name"] == cat_name), None)
        if target:
            url = target.get("url")
            if url:
                products = await scrape_category(
                    url, cat_name, max_products_override=max_products
                )
                total_products += len(products)
                completed += 1
            else:
                log_action("WARN", f"Category '{cat_name}' has no URL — skipped.")
        else:
            log_action("WARN", f"Category '{cat_name}' not found in database — skipped.")

    # Finalise
    scrape_job_state["running"] = False
    scrape_job_state["current_category"] = "Idle"
    scrape_job_state["progress"] = 100.0

    status = "completed" if completed == total_categories else "partial"
    if scrape_job_state["errors"] > 0 and completed == 0:
        status = "failed"

    log_action("INFO", f"All jobs finished. {total_products} products scraped across {completed} categories.")

    # Update job record
    await update_scrape_job(job_id, {
        "status": status,
        "completedAt": datetime.now(timezone.utc),
        "productsScraped": total_products,
        "errors": scrape_job_state["errors"],
    })


@router.post("/scraper/start")
async def start_scraper(req: ScrapeRequest, background_tasks: BackgroundTasks):
    if scrape_job_state["running"]:
        return {"message": "Scraper is already running", "job_id": None}

    # Reset state
    scrape_job_state["running"] = True
    scrape_job_state["products_found"] = 0
    scrape_job_state["errors"] = 0
    scrape_job_state["pages_done"] = 0
    scrape_job_state["progress"] = 0.0
    scrape_job_state["current_category"] = "Starting..."

    # Override delay in settings
    from ..config import settings
    settings.REQUEST_DELAY = req.delay

    log_action("INFO", f"Scraper started. Targets: {len(req.categories)} categories.")

    # Record the job
    job_id = await save_scrape_job({
        "categories": req.categories,
        "maxProducts": req.max_products,
        "delay": req.delay,
        "status": "running",
        "startedAt": datetime.now(timezone.utc),
        "category": ", ".join(req.categories),
    })

    background_tasks.add_task(run_scrape_jobs, req.categories, req.max_products, req.delay, job_id)

    return {"message": "Scraper started", "job_id": job_id}


@router.post("/scraper/stop")
async def stop_scraper():
    scrape_job_state["running"] = False
    log_action("WARN", "Stop signal received. Halting after current page.")
    return {"message": "Stopping scraper"}


@router.get("/scraper/status")
async def get_scraper_status():
    return scrape_job_state
