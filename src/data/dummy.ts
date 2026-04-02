export interface Category {
  id: string;
  name: string;
  products: number;
  lastScraped: string;
  status: "active" | "idle";
  children: Category[];
}

export interface Product {
  id: string;
  asin: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  scrapedAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
}

export interface Job {
  id: string;
  category: string;
  timestamp: string;
  status: "Done" | "Running" | "Failed";
}

export const categories: Category[] = [
  {
    id: "1", name: "Electronics", products: 1247, lastScraped: "2 hours ago", status: "active",
    children: [
      { id: "1a", name: "Headphones", products: 342, lastScraped: "2 hours ago", status: "active", children: [] },
      { id: "1b", name: "Speakers", products: 189, lastScraped: "5 hours ago", status: "active", children: [] },
      { id: "1c", name: "Cameras", products: 267, lastScraped: "1 day ago", status: "idle", children: [] },
      { id: "1d", name: "Wearables", products: 449, lastScraped: "3 hours ago", status: "active", children: [] },
    ],
  },
  {
    id: "2", name: "Mobiles", products: 892, lastScraped: "1 hour ago", status: "active",
    children: [
      { id: "2a", name: "Smartphones", products: 534, lastScraped: "1 hour ago", status: "active", children: [] },
      { id: "2b", name: "Feature Phones", products: 87, lastScraped: "2 days ago", status: "idle", children: [] },
      { id: "2c", name: "Cases & Covers", products: 271, lastScraped: "4 hours ago", status: "active", children: [] },
    ],
  },
  {
    id: "3", name: "Laptops", products: 645, lastScraped: "30 min ago", status: "active",
    children: [
      { id: "3a", name: "Gaming Laptops", products: 198, lastScraped: "30 min ago", status: "active", children: [] },
      { id: "3b", name: "Ultrabooks", products: 156, lastScraped: "2 hours ago", status: "active", children: [] },
      { id: "3c", name: "Chromebooks", products: 89, lastScraped: "1 day ago", status: "idle", children: [] },
      { id: "3d", name: "Workstations", products: 67, lastScraped: "6 hours ago", status: "active", children: [] },
      { id: "3e", name: "Accessories", products: 135, lastScraped: "3 hours ago", status: "active", children: [] },
    ],
  },
  {
    id: "4", name: "Fashion", products: 2134, lastScraped: "4 hours ago", status: "active",
    children: [
      { id: "4a", name: "Men's Clothing", products: 876, lastScraped: "4 hours ago", status: "active", children: [] },
      { id: "4b", name: "Women's Clothing", products: 945, lastScraped: "5 hours ago", status: "active", children: [] },
      { id: "4c", name: "Footwear", products: 313, lastScraped: "8 hours ago", status: "idle", children: [] },
    ],
  },
  {
    id: "5", name: "Books", products: 3421, lastScraped: "6 hours ago", status: "active",
    children: [
      { id: "5a", name: "Fiction", products: 1245, lastScraped: "6 hours ago", status: "active", children: [] },
      { id: "5b", name: "Non-Fiction", products: 987, lastScraped: "8 hours ago", status: "active", children: [] },
      { id: "5c", name: "Technical", products: 654, lastScraped: "12 hours ago", status: "idle", children: [] },
      { id: "5d", name: "Comics & Manga", products: 535, lastScraped: "1 day ago", status: "idle", children: [] },
    ],
  },
  {
    id: "6", name: "Home & Kitchen", products: 1567, lastScraped: "3 hours ago", status: "active",
    children: [
      { id: "6a", name: "Appliances", products: 423, lastScraped: "3 hours ago", status: "active", children: [] },
      { id: "6b", name: "Furniture", products: 567, lastScraped: "5 hours ago", status: "active", children: [] },
      { id: "6c", name: "Kitchenware", products: 345, lastScraped: "7 hours ago", status: "active", children: [] },
      { id: "6d", name: "Décor", products: 232, lastScraped: "1 day ago", status: "idle", children: [] },
    ],
  },
  {
    id: "7", name: "Sports", products: 978, lastScraped: "5 hours ago", status: "active",
    children: [
      { id: "7a", name: "Fitness", products: 345, lastScraped: "5 hours ago", status: "active", children: [] },
      { id: "7b", name: "Outdoor", products: 289, lastScraped: "8 hours ago", status: "idle", children: [] },
      { id: "7c", name: "Team Sports", products: 344, lastScraped: "6 hours ago", status: "active", children: [] },
    ],
  },
  {
    id: "8", name: "Beauty", products: 1123, lastScraped: "2 hours ago", status: "active",
    children: [
      { id: "8a", name: "Skincare", products: 456, lastScraped: "2 hours ago", status: "active", children: [] },
      { id: "8b", name: "Haircare", products: 312, lastScraped: "4 hours ago", status: "active", children: [] },
      { id: "8c", name: "Fragrances", products: 198, lastScraped: "1 day ago", status: "idle", children: [] },
      { id: "8d", name: "Makeup", products: 157, lastScraped: "3 hours ago", status: "active", children: [] },
    ],
  },
];

export const products: Product[] = [
  { id: "p1", asin: "B0BSHF7WHW", title: "boAt Rockerz 450 Bluetooth Headphones", price: 1299, rating: 4.1, reviews: 156432, category: "Electronics", scrapedAt: "2026-04-02 10:23:45" },
  { id: "p2", asin: "B09G9HD6PD", title: "Samsung Galaxy S23 Ultra 256GB", price: 74999, rating: 4.6, reviews: 42187, category: "Mobiles", scrapedAt: "2026-04-02 09:15:30" },
  { id: "p3", asin: "B0CHX3TW6G", title: "Apple MacBook Air M3 15-inch", price: 134900, rating: 4.8, reviews: 8934, category: "Laptops", scrapedAt: "2026-04-02 11:02:18" },
  { id: "p4", asin: "B0C9JFH7R2", title: "Nike Air Max 270 Running Shoes", price: 8995, rating: 4.3, reviews: 23456, category: "Fashion", scrapedAt: "2026-04-02 08:45:12" },
  { id: "p5", asin: "B0BT9CXXXX", title: 'Atomic Habits by James Clear', price: 399, rating: 4.7, reviews: 198234, category: "Books", scrapedAt: "2026-04-02 07:30:00" },
  { id: "p6", asin: "B0DGXXR4JT", title: "Prestige Iris 750W Mixer Grinder", price: 2899, rating: 4.2, reviews: 34521, category: "Home & Kitchen", scrapedAt: "2026-04-02 10:55:33" },
  { id: "p7", asin: "B0CQXXL8MN", title: "Boldfit Resistance Bands Set", price: 449, rating: 4.0, reviews: 12876, category: "Sports", scrapedAt: "2026-04-02 06:20:45" },
  { id: "p8", asin: "B0CS7XXXHD", title: "Minimalist SPF 50 Sunscreen", price: 399, rating: 4.4, reviews: 67890, category: "Beauty", scrapedAt: "2026-04-02 09:40:22" },
  { id: "p9", asin: "B0BTXXXXXXQ", title: "Sony WH-1000XM5 Wireless NC Headphones", price: 24990, rating: 4.7, reviews: 31245, category: "Electronics", scrapedAt: "2026-04-02 10:10:10" },
  { id: "p10", asin: "B0D2XXXXR7", title: "OnePlus 12R 256GB Midnight", price: 39999, rating: 4.5, reviews: 18923, category: "Mobiles", scrapedAt: "2026-04-02 09:05:55" },
  { id: "p11", asin: "B0CK3XXXJP", title: "ASUS ROG Strix G16 Gaming Laptop", price: 104990, rating: 4.4, reviews: 5672, category: "Laptops", scrapedAt: "2026-04-02 11:15:08" },
  { id: "p12", asin: "B0DXXXXXXTK", title: "Levi's 511 Slim Fit Jeans", price: 2499, rating: 4.2, reviews: 45678, category: "Fashion", scrapedAt: "2026-04-02 08:30:44" },
  { id: "p13", asin: "B0BNXXXXM3", title: "The Psychology of Money", price: 299, rating: 4.6, reviews: 134567, category: "Books", scrapedAt: "2026-04-02 07:45:30" },
  { id: "p14", asin: "B0CSXXXXNR", title: "Philips Air Fryer HD9200", price: 6499, rating: 4.3, reviews: 28934, category: "Home & Kitchen", scrapedAt: "2026-04-02 10:30:15" },
  { id: "p15", asin: "B0CTXXXXQ2", title: "Nivia Storm Football Size 5", price: 599, rating: 4.1, reviews: 8765, category: "Sports", scrapedAt: "2026-04-02 06:50:30" },
  { id: "p16", asin: "B0DPXXXXW8", title: "Maybelline Fit Me Foundation", price: 549, rating: 4.3, reviews: 89012, category: "Beauty", scrapedAt: "2026-04-02 09:25:18" },
  { id: "p17", asin: "B0CMXXXXHQ", title: "JBL Charge 5 Portable Speaker", price: 12999, rating: 4.5, reviews: 21345, category: "Electronics", scrapedAt: "2026-04-02 10:05:42" },
  { id: "p18", asin: "B0DQXXXXR1", title: "Samsung Galaxy A55 5G 128GB", price: 26999, rating: 4.3, reviews: 15678, category: "Mobiles", scrapedAt: "2026-04-02 09:00:10" },
  { id: "p19", asin: "B0CNXXXXVT", title: "HP Pavilion x360 14 Convertible", price: 64990, rating: 4.2, reviews: 7823, category: "Laptops", scrapedAt: "2026-04-02 11:20:55" },
  { id: "p20", asin: "B0DRXXXXJ5", title: "Adidas Ultraboost Light Running", price: 11999, rating: 4.6, reviews: 19876, category: "Fashion", scrapedAt: "2026-04-02 08:15:30" },
  { id: "p21", asin: "B0BPXXXXZ9", title: "Sapiens by Yuval Noah Harari", price: 449, rating: 4.5, reviews: 112345, category: "Books", scrapedAt: "2026-04-02 07:55:12" },
  { id: "p22", asin: "B0CTXXXXL4", title: "Crompton Silent Pro Ceiling Fan", price: 3299, rating: 4.1, reviews: 15432, category: "Home & Kitchen", scrapedAt: "2026-04-02 10:45:20" },
  { id: "p23", asin: "B0CVXXXXM7", title: "Decathlon Domyos 10kg Dumbbells", price: 1499, rating: 4.4, reviews: 6543, category: "Sports", scrapedAt: "2026-04-02 06:35:45" },
  { id: "p24", asin: "B0DSXXXXT3", title: "L'Oreal Paris Hyaluronic Acid Serum", price: 699, rating: 4.2, reviews: 45678, category: "Beauty", scrapedAt: "2026-04-02 09:35:08" },
  { id: "p25", asin: "B0CNXXXXP6", title: "Apple AirPods Pro 2nd Gen", price: 24900, rating: 4.7, reviews: 56789, category: "Electronics", scrapedAt: "2026-04-02 10:00:30" },
  { id: "p26", asin: "B0DRXXXXU2", title: "Xiaomi 14 Ultra 512GB", price: 89999, rating: 4.4, reviews: 3456, category: "Mobiles", scrapedAt: "2026-04-02 08:55:40" },
  { id: "p27", asin: "B0CPXXXXW9", title: "Lenovo IdeaPad Slim 5 16", price: 54990, rating: 4.3, reviews: 9876, category: "Laptops", scrapedAt: "2026-04-02 11:25:15" },
  { id: "p28", asin: "B0DTXXXXK8", title: "US Polo Assn Oxford Shirt", price: 1599, rating: 4.0, reviews: 23456, category: "Fashion", scrapedAt: "2026-04-02 08:00:22" },
  { id: "p29", asin: "B0BQXXXXN1", title: "Ikigai by Hector Garcia", price: 299, rating: 4.4, reviews: 87654, category: "Books", scrapedAt: "2026-04-02 07:40:50" },
  { id: "p30", asin: "B0CUXXXXR5", title: "Bosch 7kg Front Load Washer", price: 29990, rating: 4.5, reviews: 11234, category: "Home & Kitchen", scrapedAt: "2026-04-02 10:35:40" },
  { id: "p31", asin: "B0CWXXXXS3", title: "Yonex Nanoray Light 18i Racket", price: 1890, rating: 4.3, reviews: 4567, category: "Sports", scrapedAt: "2026-04-02 06:45:20" },
  { id: "p32", asin: "B0DUXXXXV6", title: "Cetaphil Gentle Skin Cleanser 500ml", price: 799, rating: 4.5, reviews: 78901, category: "Beauty", scrapedAt: "2026-04-02 09:30:35" },
  { id: "p33", asin: "B0COXXXXQ4", title: "Bose QuietComfort Ultra Earbuds", price: 29900, rating: 4.6, reviews: 12345, category: "Electronics", scrapedAt: "2026-04-02 09:55:18" },
  { id: "p34", asin: "B0DSXXXXW7", title: "Realme GT 6T 256GB", price: 27999, rating: 4.2, reviews: 8765, category: "Mobiles", scrapedAt: "2026-04-02 08:50:05" },
  { id: "p35", asin: "B0CQXXXXZ2", title: "Dell XPS 15 OLED i7 Laptop", price: 149990, rating: 4.5, reviews: 4321, category: "Laptops", scrapedAt: "2026-04-02 11:30:42" },
  { id: "p36", asin: "B0DVXXXXL9", title: "Puma RS-X Running Shoes", price: 5999, rating: 4.1, reviews: 34567, category: "Fashion", scrapedAt: "2026-04-02 07:50:15" },
  { id: "p37", asin: "B0BRXXXXO5", title: "Deep Work by Cal Newport", price: 349, rating: 4.3, reviews: 65432, category: "Books", scrapedAt: "2026-04-02 07:35:28" },
  { id: "p38", asin: "B0CVXXXXU8", title: "IFB 30L Convection Microwave", price: 14990, rating: 4.4, reviews: 18765, category: "Home & Kitchen", scrapedAt: "2026-04-02 10:40:55" },
  { id: "p39", asin: "B0CXXXXXN1", title: "Fitbit Charge 6 Fitness Tracker", price: 14999, rating: 4.2, reviews: 7654, category: "Sports", scrapedAt: "2026-04-02 06:40:10" },
  { id: "p40", asin: "B0DWXXXXP4", title: "The Ordinary Niacinamide 10%", price: 590, rating: 4.3, reviews: 123456, category: "Beauty", scrapedAt: "2026-04-02 09:20:45" },
  { id: "p41", asin: "B0CPXXXXS7", title: "Marshall Stanmore III BT Speaker", price: 36999, rating: 4.6, reviews: 5678, category: "Electronics", scrapedAt: "2026-04-02 09:50:30" },
  { id: "p42", asin: "B0DTXXXXZ3", title: "iQOO Neo 9 Pro 5G 256GB", price: 34999, rating: 4.3, reviews: 6789, category: "Mobiles", scrapedAt: "2026-04-02 08:45:50" },
  { id: "p43", asin: "B0CRXXXXB5", title: "Acer Nitro V Gaming Laptop i5", price: 69990, rating: 4.1, reviews: 3456, category: "Laptops", scrapedAt: "2026-04-02 11:35:20" },
  { id: "p44", asin: "B0DXXXXXM2", title: "H&M Regular Fit Cotton T-Shirt", price: 699, rating: 3.9, reviews: 56789, category: "Fashion", scrapedAt: "2026-04-02 07:45:08" },
  { id: "p45", asin: "B0BSXXXXP8", title: "Thinking, Fast and Slow", price: 499, rating: 4.5, reviews: 98765, category: "Books", scrapedAt: "2026-04-02 07:30:40" },
  { id: "p46", asin: "B0CWXXXXV1", title: "Dyson V12 Detect Slim Vacuum", price: 52900, rating: 4.6, reviews: 8765, category: "Home & Kitchen", scrapedAt: "2026-04-02 10:25:10" },
  { id: "p47", asin: "B0CYXXXXQ6", title: "Cosco All Court Tennis Ball 3pk", price: 299, rating: 4.0, reviews: 2345, category: "Sports", scrapedAt: "2026-04-02 06:30:55" },
  { id: "p48", asin: "B0DXXXXXXR9", title: "Biotique Bio Morning Nectar Cream", price: 249, rating: 3.8, reviews: 34567, category: "Beauty", scrapedAt: "2026-04-02 09:15:22" },
  { id: "p49", asin: "B0CQXXXXU3", title: "Anker PowerCore 20000mAh", price: 1999, rating: 4.4, reviews: 43210, category: "Electronics", scrapedAt: "2026-04-02 09:45:15" },
  { id: "p50", asin: "B0DUXXXXB8", title: "Noise ColorFit Ultra 3 Smartwatch", price: 2999, rating: 4.1, reviews: 21345, category: "Electronics", scrapedAt: "2026-04-02 09:40:00" },
  { id: "p51", asin: "B0DVXXXXC1", title: "Samsung 55\" Crystal 4K Smart TV", price: 42990, rating: 4.4, reviews: 15678, category: "Electronics", scrapedAt: "2026-04-02 09:35:30" },
  { id: "p52", asin: "B0DWXXXXD4", title: "boAt Airdopes 141 TWS Earbuds", price: 999, rating: 3.9, reviews: 234567, category: "Electronics", scrapedAt: "2026-04-02 09:30:12" },
];

export const recentJobs: Job[] = [
  { id: "j1", category: "Electronics", timestamp: "10:23 AM", status: "Done" },
  { id: "j2", category: "Mobiles", timestamp: "09:15 AM", status: "Done" },
  { id: "j3", category: "Laptops", timestamp: "11:02 AM", status: "Running" },
  { id: "j4", category: "Fashion", timestamp: "08:45 AM", status: "Done" },
  { id: "j5", category: "Books", timestamp: "07:30 AM", status: "Failed" },
  { id: "j6", category: "Home & Kitchen", timestamp: "10:55 AM", status: "Done" },
  { id: "j7", category: "Sports", timestamp: "06:20 AM", status: "Done" },
  { id: "j8", category: "Beauty", timestamp: "09:40 AM", status: "Running" },
];

export const scrapeActivity = [
  { day: "Mon", count: 1823 },
  { day: "Tue", count: 2145 },
  { day: "Wed", count: 1967 },
  { day: "Thu", count: 2534 },
  { day: "Fri", count: 2876 },
  { day: "Sat", count: 1654 },
  { day: "Sun", count: 2234 },
];

export const logEntries: LogEntry[] = [
  { id: "l1", timestamp: "2026-04-02 11:35:22", level: "INFO", message: "Scraper initialized for category: Electronics" },
  { id: "l2", timestamp: "2026-04-02 11:35:23", level: "INFO", message: "Connected to MongoDB cluster: scraper-prod-01" },
  { id: "l3", timestamp: "2026-04-02 11:35:24", level: "INFO", message: "Starting page 1/50 for Electronics > Headphones" },
  { id: "l4", timestamp: "2026-04-02 11:35:26", level: "INFO", message: "Fetched 48 products from page 1" },
  { id: "l5", timestamp: "2026-04-02 11:35:28", level: "INFO", message: "Starting page 2/50 for Electronics > Headphones" },
  { id: "l6", timestamp: "2026-04-02 11:35:30", level: "WARN", message: "Rate limit approaching — slowing down requests (delay: 2500ms)" },
  { id: "l7", timestamp: "2026-04-02 11:35:33", level: "INFO", message: "Fetched 47 products from page 2" },
  { id: "l8", timestamp: "2026-04-02 11:35:35", level: "INFO", message: "Starting page 3/50 for Electronics > Headphones" },
  { id: "l9", timestamp: "2026-04-02 11:35:37", level: "ERROR", message: "Request timeout on page 3 — retrying in 5s (attempt 1/3)" },
  { id: "l10", timestamp: "2026-04-02 11:35:42", level: "INFO", message: "Retry successful — fetched 46 products from page 3" },
  { id: "l11", timestamp: "2026-04-02 11:35:44", level: "INFO", message: "Starting page 4/50 for Electronics > Headphones" },
  { id: "l12", timestamp: "2026-04-02 11:35:46", level: "INFO", message: "Fetched 48 products from page 4" },
  { id: "l13", timestamp: "2026-04-02 11:35:48", level: "INFO", message: "Category checkpoint saved — 189 products so far" },
  { id: "l14", timestamp: "2026-04-02 11:35:50", level: "WARN", message: "Duplicate ASIN detected: B0BSHF7WHW — skipping" },
  { id: "l15", timestamp: "2026-04-02 11:35:52", level: "INFO", message: "Starting page 5/50 for Electronics > Headphones" },
  { id: "l16", timestamp: "2026-04-02 11:35:54", level: "INFO", message: "Fetched 44 products from page 5" },
  { id: "l17", timestamp: "2026-04-02 11:35:56", level: "INFO", message: "Starting subcategory: Electronics > Speakers" },
  { id: "l18", timestamp: "2026-04-02 11:35:58", level: "INFO", message: "Fetched 48 products from page 1" },
  { id: "l19", timestamp: "2026-04-02 11:36:00", level: "ERROR", message: "CAPTCHA detected on page 2 — rotating proxy" },
  { id: "l20", timestamp: "2026-04-02 11:36:05", level: "INFO", message: "Proxy rotated successfully — resuming scrape" },
  { id: "l21", timestamp: "2026-04-02 11:36:07", level: "INFO", message: "Fetched 45 products from page 2" },
  { id: "l22", timestamp: "2026-04-02 11:36:09", level: "INFO", message: "MongoDB write: batch inserted 93 documents" },
  { id: "l23", timestamp: "2026-04-02 11:36:11", level: "WARN", message: "Price field missing for ASIN B0DGXXR4JT — using fallback" },
  { id: "l24", timestamp: "2026-04-02 11:36:13", level: "INFO", message: "Scrape progress: 342/1247 products (27.4%)" },
  { id: "l25", timestamp: "2026-04-02 11:36:15", level: "INFO", message: "Memory usage: 245MB / 512MB — within limits" },
];
