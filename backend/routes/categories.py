import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..database import get_categories, save_categories, delete_category
from ..scraper.category_fetcher import fetch_categories
from ..config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class CustomCategoryRequest(BaseModel):
    name: str
    searchTerm: Optional[str] = None
    url: Optional[str] = None


@router.get("/categories")
async def read_categories():
    return await get_categories()


@router.post("/categories/fetch")
async def trigger_fetch_categories():
    logger.info("Fetching categories...")
    new_categories = await fetch_categories()
    if new_categories:
        await save_categories(new_categories)
    return {"message": f"Successfully loaded {len(new_categories)} categories"}


@router.post("/categories/custom")
async def add_custom_category(req: CustomCategoryRequest):
    """Add a custom category from a search term or URL."""
    if req.url:
        url = req.url
    elif req.searchTerm:
        # Generate Amazon search URL from search term
        term = req.searchTerm.replace(" ", "+")
        url = f"{settings.BASE_URL}/s?k={term}&ref=nb_sb_noss"
    else:
        raise HTTPException(status_code=400, detail="Provide either searchTerm or url")

    category = {
        "name": req.name,
        "url": url,
        "parent": None,
        "subcategories": [],
        "status": "idle",
        "custom": True,
    }
    await save_categories([category])
    return {"message": f"Category '{req.name}' added", "url": url}


@router.delete("/categories/{category_id}")
async def remove_category(category_id: str):
    deleted = await delete_category(category_id)
    if deleted:
        return {"message": "Category deleted"}
    raise HTTPException(status_code=404, detail="Category not found")
