// Use environment variables for API URLs (set in .env or Vercel dashboard)
// In development: defaults to localhost:8000
// In production: set VITE_API_URL to your Render backend URL

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";
export const WS_BASE_URL = (import.meta.env.VITE_WS_URL || "ws://localhost:8000");

// ── Dashboard ──

export interface DashboardResponse {
  metrics: { label: string; value: string; change?: string; mono?: boolean }[];
  categoryBarData: { name: string; count: number }[];
  scrapeActivity: { day: string; count: number }[];
  recentJobs: any[];
  priceDrops: any[];
  nextScrape: string | null;
}

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  const res = await fetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
};

// ── Categories ──

export const fetchCategories = async () => {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
};

export const triggerCategoriesFetch = async () => {
  const res = await fetch(`${BASE_URL}/categories/fetch`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger categories fetch");
  return res.json();
};

export const addCustomCategory = async (data: { name: string; searchTerm?: string; url?: string }) => {
  const res = await fetch(`${BASE_URL}/categories/custom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add custom category");
  return res.json();
};

export const deleteCategory = async (id: string) => {
  const res = await fetch(`${BASE_URL}/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete category");
  return res.json();
};

// ── Products ──

export const fetchProducts = async (page: number, limit: number, search: string, category: string) => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search, category });
  const res = await fetch(`${BASE_URL}/products?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

export const fetchProduct = async (asin: string) => {
  const res = await fetch(`${BASE_URL}/products/${asin}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
};

export const deleteProduct = async (asin: string) => {
  const res = await fetch(`${BASE_URL}/products/${asin}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete product");
  return res.json();
};

export const deleteAllProducts = async () => {
  const res = await fetch(`${BASE_URL}/products`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete products");
  return res.json();
};

// ── Scraper ──

export const fetchScraperStatus = async () => {
  const res = await fetch(`${BASE_URL}/scraper/status`);
  if (!res.ok) throw new Error("Failed to fetch scraper status");
  return res.json();
};

export const startScraper = async (config: { categories: string[]; max_products: number; delay: number }) => {
  const res = await fetch(`${BASE_URL}/scraper/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to start scraper");
  return res.json();
};

export const stopScraper = async () => {
  const res = await fetch(`${BASE_URL}/scraper/stop`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to stop scraper");
  return res.json();
};

// ── Logs ──

export const fetchLogs = async () => {
  const res = await fetch(`${BASE_URL}/logs`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
};

// ── Analytics ──

export const fetchAnalytics = async () => {
  const res = await fetch(`${BASE_URL}/analytics`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
};

export const fetchPriceHistory = async (asin: string, days: number = 30) => {
  const res = await fetch(`${BASE_URL}/analytics/price-history/${asin}?days=${days}`);
  if (!res.ok) throw new Error("Failed to fetch price history");
  return res.json();
};

export const fetchPriceDrops = async () => {
  const res = await fetch(`${BASE_URL}/analytics/price-drops`);
  if (!res.ok) throw new Error("Failed to fetch price drops");
  return res.json();
};

// ── Schedules ──

export const fetchSchedules = async () => {
  const res = await fetch(`${BASE_URL}/schedules`);
  if (!res.ok) throw new Error("Failed to fetch schedules");
  return res.json();
};

export const createSchedule = async (data: { categoryName: string; intervalHours: number; maxProducts: number; enabled: boolean }) => {
  const res = await fetch(`${BASE_URL}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create schedule");
  return res.json();
};

export const removeSchedule = async (id: string) => {
  const res = await fetch(`${BASE_URL}/schedules/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete schedule");
  return res.json();
};
