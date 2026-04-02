"""
Amazon product scraper engine.

Parses Amazon.in search-result pages to extract product listings.
Uses curl_cffi with Chrome TLS-fingerprint impersonation to bypass
basic bot detection.  Implements exponential backoff, CAPTCHA detection,
and robust multi-selector parsing.
"""

import asyncio
import random
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from curl_cffi.requests import AsyncSession

from ..config import settings
from ..database import save_products, save_scrape_job, update_scrape_job
from .category_fetcher import USER_AGENTS

# ---------------------------------------------------------------------------
# Global scraper state (shared across the running process)
# ---------------------------------------------------------------------------
scrape_job_state = {
    "running": False,
    "current_category": "",
    "products_found": 0,
    "pages_done": 0,
    "errors": 0,
    "progress": 0.0,
    "logs": [],
}


def log_action(level: str, message: str):
    """Append a timestamped log entry to the global state."""
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "id": f"l{len(scrape_job_state['logs']) + 1}_{ts.replace(' ', '_')}",
        "timestamp": ts,
        "level": level,
        "message": message,
    }
    scrape_job_state["logs"].append(log_entry)
    # Keep bounded to prevent memory leaks
    if len(scrape_job_state["logs"]) > 300:
        scrape_job_state["logs"] = scrape_job_state["logs"][-200:]


# ---------------------------------------------------------------------------
# HTML Parsing helpers — multiple fallback selectors for resilience
# ---------------------------------------------------------------------------

def _parse_title(card) -> str:
    """Extract product title from a card."""
    for sel in [
        "h2 a span",
        "h2 span",
        "span.a-text-normal",
        "[data-cy='title-recipe'] h2 span",
    ]:
        el = card.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            if text:
                return text
    return ""


def _parse_price(card) -> int:
    """Extract price as integer (₹)."""
    for sel in [
        "span.a-price span.a-offscreen",
        "span.a-price-whole",
        "span.a-color-price",
    ]:
        el = card.select_one(sel)
        if el:
            raw = el.get_text(strip=True)
            # Remove ₹, commas, decimals
            cleaned = raw.replace("₹", "").replace(",", "").replace(".", "").strip()
            try:
                return int(cleaned)
            except ValueError:
                continue
    return 0


def _parse_rating(card) -> float:
    """Extract star rating."""
    for sel in ["span.a-icon-alt", "i.a-icon-star-small span.a-icon-alt"]:
        el = card.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            try:
                return float(text.split(" ")[0])
            except (ValueError, IndexError):
                continue
    return 0.0


def _parse_reviews(card) -> int:
    """Extract review count."""
    # The review count usually lives in a link or span near the rating
    for sel in [
        "span.a-size-base.s-underline-text",
        "a.s-underline-text span",
        '[data-cy="reviews-block"] span.a-size-base',
        "a[href*='customerReviews'] span",
    ]:
        el = card.select_one(sel)
        if el:
            raw = el.get_text(strip=True).replace(",", "").replace("(", "").replace(")", "")
            try:
                return int(raw)
            except ValueError:
                continue
    return 0


def _parse_image(card) -> str:
    """Extract product image URL."""
    el = card.select_one("img.s-image")
    if el:
        return el.get("src", "")
    return ""


def _parse_link(card) -> str:
    """Extract product detail page URL."""
    for sel in ["h2 a.a-link-normal", "h2 a", "a.a-link-normal.s-no-outline"]:
        el = card.select_one(sel)
        if el:
            href = el.get("href", "")
            if href and href.startswith("/"):
                return settings.BASE_URL + href
            return href
    return ""


# ---------------------------------------------------------------------------
# Core scraping logic
# ---------------------------------------------------------------------------

async def scrape_category(
    category_url: str,
    category_name: str,
    max_pages_override: int | None = None,
    max_products_override: int | None = None,
) -> list[dict]:
    """
    Scrape a single Amazon.in category/search-results page.
    Returns the list of parsed products.
    """
    log_action("INFO", f"Starting scrape for: {category_name}")
    scrape_job_state["current_category"] = category_name

    max_pages = max_pages_override or settings.MAX_PAGES
    max_products = max_products_override or settings.MAX_PRODUCTS_PER_CATEGORY
    all_products: list[dict] = []
    current_url = category_url
    pages_done = 0
    consecutive_errors = 0

    try:
        async with AsyncSession(
            impersonate="chrome124",
            timeout=settings.SCRAPER_TIMEOUT,
        ) as session:
            while (
                current_url
                and scrape_job_state["running"]
                and pages_done < max_pages
                and len(all_products) < max_products
            ):
                # Randomize user-agent each request
                ua = random.choice(USER_AGENTS)
                session.headers.update({"User-Agent": ua})

                log_action("INFO", f"Fetching page {pages_done + 1} for {category_name}...")

                try:
                    response = await session.get(current_url, allow_redirects=True)
                except Exception as req_err:
                    log_action("ERROR", f"Request failed: {req_err}")
                    consecutive_errors += 1
                    scrape_job_state["errors"] += 1
                    if consecutive_errors >= 3:
                        log_action("ERROR", "3 consecutive errors — aborting category.")
                        break
                    # Exponential backoff
                    wait = settings.REQUEST_DELAY * (2 ** consecutive_errors)
                    log_action("WARN", f"Retrying in {wait:.1f}s...")
                    await asyncio.sleep(wait)
                    continue

                # ── CAPTCHA / block detection ──
                if "Enter the characters" in response.text or "captcha" in response.text.lower():
                    log_action("ERROR", f"CAPTCHA detected on {category_name}")
                    scrape_job_state["errors"] += 1
                    break

                if response.status_code == 503:
                    log_action("ERROR", f"503 Service Unavailable on {category_name}")
                    scrape_job_state["errors"] += 1
                    consecutive_errors += 1
                    if consecutive_errors >= 3:
                        break
                    await asyncio.sleep(settings.REQUEST_DELAY * 2)
                    continue

                if response.status_code != 200:
                    log_action("WARN", f"HTTP {response.status_code} on {category_name}")
                    scrape_job_state["errors"] += 1
                    break

                # ── Parse HTML ──
                consecutive_errors = 0  # reset on success
                soup = BeautifulSoup(response.text, "lxml")

                # Amazon wraps each product in a div with data-asin
                cards = soup.select('div[data-asin][data-component-type="s-search-result"]')
                if not cards:
                    # Fallback: try the broader selector
                    cards = soup.select("div[data-asin]")

                page_products = []
                for card in cards:
                    asin = card.get("data-asin", "").strip()
                    if not asin:
                        continue

                    title = _parse_title(card)
                    if not title:
                        continue  # Skip sponsored/empty cards

                    page_products.append({
                        "asin": asin,
                        "title": title,
                        "price": _parse_price(card),
                        "rating": _parse_rating(card),
                        "reviews": _parse_reviews(card),
                        "image_url": _parse_image(card),
                        "product_url": _parse_link(card),
                        "category": category_name,
                        "scrapedAt": datetime.now(timezone.utc),
                    })

                all_products.extend(page_products)
                pages_done += 1
                scrape_job_state["products_found"] += len(page_products)
                scrape_job_state["pages_done"] = pages_done

                log_action(
                    "INFO",
                    f"Page {pages_done}: found {len(page_products)} products "
                    f"(total: {len(all_products)})",
                )

                # Update progress
                progress = (pages_done / max_pages) * 100
                scrape_job_state["progress"] = min(progress, 100.0)

                # ── Pagination ──
                next_btn = soup.select_one("a.s-pagination-next")
                if next_btn and next_btn.get("href"):
                    current_url = settings.BASE_URL + next_btn["href"]
                else:
                    log_action("INFO", f"No more pages for {category_name}.")
                    current_url = None

                # Polite delay with jitter
                delay = settings.REQUEST_DELAY + random.uniform(0.5, 1.5)
                await asyncio.sleep(delay)

        # ── Persist products ──
        if all_products:
            saved = await save_products(all_products)
            log_action("INFO", f"Saved {saved} products for {category_name} to database.")

    except Exception as e:
        log_action("ERROR", f"Unexpected error in {category_name}: {str(e)}")
        scrape_job_state["errors"] += 1

    return all_products
