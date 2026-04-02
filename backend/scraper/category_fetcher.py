"""
Reliable Amazon.in category list.

Amazon's navigation menu is loaded via JavaScript/AJAX and is never available
in the initial HTML response.  Attempting to scrape it dynamically is
fundamentally unreliable.  Instead, we maintain a curated list of real,
working Amazon.in Best-Sellers / department landing pages.
"""

import asyncio
from curl_cffi.requests import AsyncSession
from bs4 import BeautifulSoup
from ..config import settings

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

# ── Curated Amazon.in category URLs ─────────────────────────────────────
# These are real, working search/browse URLs that return product listings.
# Using /s?k= (search) URLs is the most reliable method – they always
# return the standard search-results grid that our scraper can parse.
DEFAULT_CATEGORIES = [
    {
        "name": "Mobiles",
        "url": "https://www.amazon.in/s?k=mobile+phones&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Laptops",
        "url": "https://www.amazon.in/s?k=laptops&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Headphones",
        "url": "https://www.amazon.in/s?k=headphones&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Watches",
        "url": "https://www.amazon.in/s?k=watches&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Shoes",
        "url": "https://www.amazon.in/s?k=shoes&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "T-Shirts",
        "url": "https://www.amazon.in/s?k=t-shirts&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Books",
        "url": "https://www.amazon.in/s?k=books&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Cameras",
        "url": "https://www.amazon.in/s?k=cameras&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Backpacks",
        "url": "https://www.amazon.in/s?k=backpacks&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Keyboards",
        "url": "https://www.amazon.in/s?k=keyboards&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Speakers",
        "url": "https://www.amazon.in/s?k=bluetooth+speakers&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Mouse",
        "url": "https://www.amazon.in/s?k=mouse&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Tablets",
        "url": "https://www.amazon.in/s?k=tablets&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Smart TVs",
        "url": "https://www.amazon.in/s?k=smart+tv&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
    {
        "name": "Power Banks",
        "url": "https://www.amazon.in/s?k=power+bank&ref=nb_sb_noss",
        "parent": None,
        "subcategories": [],
        "status": "idle",
    },
]


async def fetch_categories() -> list[dict]:
    """
    Return the curated category list.

    We also attempt a quick connectivity test to Amazon.in.  If it succeeds
    we mark all categories as verified; if it fails we still return the list
    (they'll work when the scrape actually runs).
    """
    categories = [dict(c) for c in DEFAULT_CATEGORIES]  # deep-copy defaults

    # Quick connectivity test
    try:
        async with AsyncSession(impersonate="chrome124", timeout=10) as session:
            resp = await session.get(settings.BASE_URL, allow_redirects=True)
            if resp.status_code == 200:
                for c in categories:
                    c["verified"] = True
    except Exception:
        pass  # Connectivity check failed — categories still usable

    return categories
