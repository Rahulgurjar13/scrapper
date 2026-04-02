import asyncio
from backend.scraper.category_fetcher import fetch_categories

async def main():
    cats = await fetch_categories()
    print("Fetched cats: ", len(cats))

asyncio.run(main())
