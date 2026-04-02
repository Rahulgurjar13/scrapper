from fastapi import APIRouter, HTTPException, Query
from ..database import get_products, delete_product, delete_all_products, get_price_history, db

router = APIRouter()


@router.get("/products")
async def read_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = "",
    category: str = "",
):
    return await get_products(page, limit, search, category)


@router.get("/products/{asin}")
async def read_product_single(asin: str):
    product = await db.products.find_one({"asin": asin})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["id"] = str(product["_id"])
    del product["_id"]
    from datetime import datetime
    if isinstance(product.get("scrapedAt"), datetime):
        product["scrapedAt"] = product["scrapedAt"].strftime("%Y-%m-%d %H:%M:%S")
    return product


@router.delete("/products/{asin}")
async def remove_product(asin: str):
    deleted = await delete_product(asin)
    if deleted:
        return {"message": f"Product {asin} deleted"}
    raise HTTPException(status_code=404, detail="Product not found")


@router.delete("/products")
async def remove_all_products():
    count = await delete_all_products()
    return {"message": f"Deleted {count} products"}
