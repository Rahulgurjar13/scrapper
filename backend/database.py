from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import logging
import pymongo

from .config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Global MongoDB handles
# ---------------------------------------------------------------------------
client: AsyncIOMotorClient | None = None
db = None


async def init_db():
    """Connect to MongoDB and ensure indexes exist."""
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")
        db = client[settings.DB_NAME]

        # Products
        await db.products.create_index([("asin", ASCENDING)], unique=True)
        await db.products.create_index([("category", ASCENDING)])
        await db.products.create_index([("scrapedAt", DESCENDING)])
        await db.products.create_index([("price", ASCENDING)])
        await db.products.create_index([("rating", DESCENDING)])

        # Categories
        await db.categories.create_index([("url", ASCENDING)], unique=True)

        # Scrape jobs
        await db.scrape_jobs.create_index([("startedAt", DESCENDING)])

        # Price history
        await db.price_history.create_index([("asin", ASCENDING), ("recordedAt", DESCENDING)])
        await db.price_history.create_index([("recordedAt", DESCENDING)])

        # Schedules
        await db.schedules.create_index([("categoryName", ASCENDING)], unique=True)

        logger.info("MongoDB connected and indexes created.")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise


async def close_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")


# ═══════════════════════════════════════════════════════════════════════════
# PRODUCTS
# ═══════════════════════════════════════════════════════════════════════════

async def get_products(page: int = 1, limit: int = 20, search: str = "", category: str = ""):
    query: dict = {}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"asin": {"$regex": search, "$options": "i"}},
        ]
    if category:
        query["category"] = category

    skip = (page - 1) * limit
    cursor = db.products.find(query).sort("scrapedAt", DESCENDING).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)

    for p in products:
        p["id"] = str(p["_id"])
        del p["_id"]
        if isinstance(p.get("scrapedAt"), datetime):
            p["scrapedAt"] = p["scrapedAt"].strftime("%Y-%m-%d %H:%M:%S")

    total = await db.products.count_documents(query)
    return {"data": products, "total": total, "page": page, "limit": limit}


async def save_products(products_list: list):
    """Upsert products by ASIN and record price history snapshots."""
    if not products_list:
        return 0

    price_snapshots = []
    operations = []

    for p in products_list:
        # Check if product already exists to detect price changes
        existing = await db.products.find_one({"asin": p["asin"]}, {"price": 1})
        old_price = existing["price"] if existing else None

        # Record price snapshot for history
        price_snapshots.append({
            "asin": p["asin"],
            "price": p["price"],
            "oldPrice": old_price,
            "recordedAt": p.get("scrapedAt", datetime.now(timezone.utc)),
            "category": p.get("category", ""),
        })

        # Calculate price change
        product_data = dict(p)
        if old_price is not None and old_price > 0 and p["price"] > 0:
            change = p["price"] - old_price
            pct = round((change / old_price) * 100, 1)
            product_data["priceChange"] = change
            product_data["priceChangePct"] = pct
        elif old_price is None:
            product_data["priceChange"] = 0
            product_data["priceChangePct"] = 0.0

        operations.append(
            pymongo.UpdateOne(
                {"asin": p["asin"]},
                {"$set": product_data},
                upsert=True,
            )
        )

    if operations:
        result = await db.products.bulk_write(operations, ordered=False)

    # Save price history snapshots
    if price_snapshots:
        await db.price_history.insert_many(price_snapshots, ordered=False)

    return len(operations)


async def delete_product(asin: str):
    result = await db.products.delete_one({"asin": asin})
    await db.price_history.delete_many({"asin": asin})
    return result.deleted_count


async def delete_all_products():
    result = await db.products.delete_many({})
    await db.price_history.delete_many({})
    return result.deleted_count


# ═══════════════════════════════════════════════════════════════════════════
# PRICE HISTORY
# ═══════════════════════════════════════════════════════════════════════════

async def get_price_history(asin: str, days: int = 30):
    """Get price history for a product over the last N days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cursor = db.price_history.find(
        {"asin": asin, "recordedAt": {"$gte": cutoff}},
        {"_id": 0, "price": 1, "recordedAt": 1},
    ).sort("recordedAt", ASCENDING)
    records = await cursor.to_list(length=500)

    for r in records:
        if isinstance(r.get("recordedAt"), datetime):
            r["date"] = r["recordedAt"].strftime("%b %d")
            r["recordedAt"] = r["recordedAt"].isoformat()

    return records


async def get_top_price_drops(limit: int = 8):
    """Get products with the biggest recent price drops."""
    cursor = db.products.find(
        {"priceChange": {"$lt": 0}, "price": {"$gt": 0}},
        {"asin": 1, "title": 1, "price": 1, "priceChange": 1, "priceChangePct": 1, "category": 1, "image_url": 1},
    ).sort("priceChange", ASCENDING).limit(limit)

    drops = await cursor.to_list(length=limit)
    for d in drops:
        d["id"] = str(d["_id"])
        del d["_id"]
    return drops


# ═══════════════════════════════════════════════════════════════════════════
# CATEGORIES
# ═══════════════════════════════════════════════════════════════════════════

async def get_categories():
    cursor = db.categories.find()
    categories = await cursor.to_list(length=None)

    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    counts = await db.products.aggregate(pipeline).to_list(length=None)
    count_map = {item["_id"]: item["count"] for item in counts}

    result = []
    for c in categories:
        c["id"] = str(c["_id"])
        del c["_id"]
        c["products"] = count_map.get(c.get("name"), 0)
        c.setdefault("lastScraped", "Never")
        c.setdefault("status", "idle")
        c.setdefault("children", [])
        result.append(c)

    return result


async def save_categories(categories_list: list):
    if not categories_list:
        return
    operations = []
    for c in categories_list:
        operations.append(
            pymongo.UpdateOne(
                {"url": c["url"]},
                {"$set": c},
                upsert=True,
            )
        )
    if operations:
        await db.categories.bulk_write(operations, ordered=False)


async def delete_category(category_id: str):
    result = await db.categories.delete_one({"_id": ObjectId(category_id)})
    return result.deleted_count


# ═══════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════

async def get_dashboard_stats():
    total_products = await db.products.count_documents({})
    total_cats = await db.categories.count_documents({})

    latest = await db.products.find_one(sort=[("scrapedAt", DESCENDING)])
    if latest and isinstance(latest.get("scrapedAt"), datetime):
        last_scrape = latest["scrapedAt"].strftime("%Y-%m-%d %H:%M")
    elif latest and isinstance(latest.get("scrapedAt"), str):
        last_scrape = latest["scrapedAt"]
    else:
        last_scrape = "N/A"

    recent_jobs = await db.scrape_jobs.find().sort("startedAt", DESCENDING).to_list(length=20)
    if recent_jobs:
        successful = sum(1 for j in recent_jobs if j.get("status") == "completed")
        success_rate = f"{int((successful / len(recent_jobs)) * 100)}%"
    else:
        success_rate = "N/A"

    # Next scheduled scrape
    next_schedule = await db.schedules.find_one(
        {"enabled": True},
        sort=[("nextRunAt", ASCENDING)],
    )
    if next_schedule and isinstance(next_schedule.get("nextRunAt"), datetime):
        next_scrape = next_schedule["nextRunAt"].strftime("%H:%M today")
    else:
        next_scrape = None

    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8},
    ]
    top_cats = await db.products.aggregate(pipeline).to_list(length=None)
    top_8 = [{"name": c["_id"], "count": c["count"]} for c in top_cats if c["_id"]]

    return {
        "metrics": [
            {"label": "Total Products", "value": f"{total_products:,}", "change": ""},
            {"label": "Categories Tracked", "value": str(total_cats), "change": ""},
            {"label": "Last Scrape", "value": last_scrape, "mono": True},
            {"label": "Success Rate", "value": success_rate, "change": ""},
        ],
        "top_categories": top_8,
        "next_scrape": next_scrape,
    }


async def get_scrape_activity():
    activity = []
    now = datetime.now(timezone.utc)
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%a")
        start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        count = await db.products.count_documents({"scrapedAt": {"$gte": start, "$lte": end}})
        activity.append({"day": day_str, "count": count})
    return activity


# ═══════════════════════════════════════════════════════════════════════════
# SCRAPE JOBS
# ═══════════════════════════════════════════════════════════════════════════

async def save_scrape_job(job: dict):
    result = await db.scrape_jobs.insert_one(job)
    return str(result.inserted_id)


async def update_scrape_job(job_id: str, update: dict):
    await db.scrape_jobs.update_one({"_id": ObjectId(job_id)}, {"$set": update})


async def get_recent_jobs(limit: int = 10):
    cursor = db.scrape_jobs.find().sort("startedAt", DESCENDING).limit(limit)
    jobs = await cursor.to_list(length=limit)
    for j in jobs:
        j["id"] = str(j["_id"])
        del j["_id"]
        if isinstance(j.get("startedAt"), datetime):
            j["timestamp"] = j["startedAt"].strftime("%Y-%m-%d %H:%M:%S")
        else:
            j["timestamp"] = str(j.get("startedAt", ""))
    return jobs


# ═══════════════════════════════════════════════════════════════════════════
# ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════

async def get_analytics():
    """Compute analytics aggregations."""

    # Average price per category
    avg_pipeline = [
        {"$match": {"price": {"$gt": 0}}},
        {"$group": {"_id": "$category", "avgPrice": {"$avg": "$price"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15},
    ]
    avg_by_cat = await db.products.aggregate(avg_pipeline).to_list(length=None)
    for a in avg_by_cat:
        a["category"] = a["_id"]
        a["avgPrice"] = round(a["avgPrice"])
        del a["_id"]

    # Price distribution (buckets)
    bucket_pipeline = [
        {"$match": {"price": {"$gt": 0}}},
        {"$bucket": {
            "groupBy": "$price",
            "boundaries": [0, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 500000],
            "default": "500000+",
            "output": {"count": {"$sum": 1}},
        }},
    ]
    try:
        price_dist = await db.products.aggregate(bucket_pipeline).to_list(length=None)
        for p in price_dist:
            if isinstance(p["_id"], int):
                p["range"] = f"₹{p['_id']:,}+"
            else:
                p["range"] = f"₹{p['_id']}"
    except Exception:
        price_dist = []

    # Best deals: high rating, low price
    deals_pipeline = [
        {"$match": {"rating": {"$gte": 4.0}, "price": {"$gt": 0}}},
        {"$sort": {"price": 1}},
        {"$limit": 12},
    ]
    best_deals = await db.products.aggregate(deals_pipeline).to_list(length=None)
    for d in best_deals:
        d["id"] = str(d["_id"])
        del d["_id"]
        if isinstance(d.get("scrapedAt"), datetime):
            d["scrapedAt"] = d["scrapedAt"].strftime("%Y-%m-%d %H:%M:%S")

    # Top rated
    top_rated = await db.products.find(
        {"rating": {"$gte": 4.0}, "reviews": {"$gte": 100}},
    ).sort("rating", DESCENDING).limit(10).to_list(length=10)
    for t in top_rated:
        t["id"] = str(t["_id"])
        del t["_id"]
        if isinstance(t.get("scrapedAt"), datetime):
            t["scrapedAt"] = t["scrapedAt"].strftime("%Y-%m-%d %H:%M:%S")

    # Overall stats
    total = await db.products.count_documents({})
    avg_all = await db.products.aggregate([
        {"$match": {"price": {"$gt": 0}}},
        {"$group": {"_id": None, "avg": {"$avg": "$price"}, "min": {"$min": "$price"}, "max": {"$max": "$price"}}},
    ]).to_list(length=1)
    overall = avg_all[0] if avg_all else {"avg": 0, "min": 0, "max": 0}

    return {
        "totalProducts": total,
        "avgPrice": round(overall.get("avg", 0)),
        "minPrice": overall.get("min", 0),
        "maxPrice": overall.get("max", 0),
        "avgByCategory": avg_by_cat,
        "priceDistribution": price_dist,
        "bestDeals": best_deals,
        "topRated": top_rated,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SCHEDULES
# ═══════════════════════════════════════════════════════════════════════════

async def get_schedules():
    cursor = db.schedules.find().sort("categoryName", ASCENDING)
    schedules = await cursor.to_list(length=None)
    for s in schedules:
        s["id"] = str(s["_id"])
        del s["_id"]
        if isinstance(s.get("nextRunAt"), datetime):
            s["nextRunAt"] = s["nextRunAt"].isoformat()
        if isinstance(s.get("lastRunAt"), datetime):
            s["lastRunAt"] = s["lastRunAt"].isoformat()
        if isinstance(s.get("createdAt"), datetime):
            s["createdAt"] = s["createdAt"].isoformat()
    return schedules


async def save_schedule(schedule: dict):
    result = await db.schedules.update_one(
        {"categoryName": schedule["categoryName"]},
        {"$set": schedule},
        upsert=True,
    )
    return str(result.upserted_id) if result.upserted_id else "updated"


async def delete_schedule(schedule_id: str):
    result = await db.schedules.delete_one({"_id": ObjectId(schedule_id)})
    return result.deleted_count


async def get_due_schedules():
    """Get all schedules that are due to run."""
    now = datetime.now(timezone.utc)
    cursor = db.schedules.find({
        "enabled": True,
        "nextRunAt": {"$lte": now},
    })
    return await cursor.to_list(length=None)


async def mark_schedule_ran(schedule_id, next_run: datetime):
    await db.schedules.update_one(
        {"_id": schedule_id},
        {"$set": {"lastRunAt": datetime.now(timezone.utc), "nextRunAt": next_run}},
    )
