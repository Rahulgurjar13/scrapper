import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, X, FolderTree, Trash2, TrendingDown, TrendingUp, GitCompareArrows } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { fetchProducts, fetchCategories, deleteProduct, deleteAllProducts, fetchPriceHistory } from "@/lib/api";
import { toast } from "sonner";

const PER_PAGE = 15;

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<any | null>(null);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const { data: categoriesData = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const uniqueCategories = categoriesData.map((c: any) => c.name);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", page, search, catFilter],
    queryFn: () => fetchProducts(page, PER_PAGE, search, catFilter),
  });

  const products = productsData?.data || [];
  const totalItems = productsData?.total || 0;
  const totalPages = Math.ceil(totalItems / PER_PAGE) || 1;

  // Price history for drawer
  const { data: priceHistory } = useQuery({
    queryKey: ["priceHistory", drawer?.asin],
    queryFn: () => fetchPriceHistory(drawer.asin),
    enabled: !!drawer?.asin,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted.");
      setDrawer(null);
    },
    onError: () => toast.error("Failed to delete product."),
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllProducts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(data?.message || "All products deleted.");
    },
    onError: () => toast.error("Failed to delete products."),
  });

  const handleExport = () => {
    if (products.length === 0) { toast.warning("No products to export."); return; }
    const headers = ["ASIN", "Title", "Price (₹)", "Rating", "Reviews", "Category", "Scraped At", "Product URL"];
    const rows = products.map((p: any) => [p.asin, `"${(p.title || "").replace(/"/g, '""')}"`, p.price || 0, p.rating || 0, p.reviews || 0, p.category || "", p.scrapedAt || "", p.product_url || ""]);
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scraper-nexus-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${products.length} products to CSV!`);
  };

  const toggleCompare = (asin: string) => {
    setCompareSet((prev) => { const n = new Set(prev); n.has(asin) ? n.delete(asin) : n.add(asin); return n; });
  };

  const compareProducts = products.filter((p: any) => compareSet.has(p.asin));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-foreground">Products</h1>
        <p className="text-xs text-muted-foreground mt-1">Search, filter, compare, and export your scraped Amazon products.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title or ASIN..."
            className="w-full bg-card border border-border rounded pl-9 pr-3 py-2 text-sm font-mono text-foreground placeholder:text-tertiary focus:border-foreground focus:outline-none" />
        </div>
        <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none appearance-none cursor-pointer">
          <option value="">All Categories</option>
          {uniqueCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={handleExport}
          className="flex items-center gap-2 border border-border text-foreground text-sm px-4 py-2 rounded hover:bg-primary hover:text-primary-foreground transition-colors btn-press">
          <Download size={14} /> Export CSV
        </button>
        {totalItems > 0 && (
          <button onClick={() => { if (confirm("Delete ALL products? This cannot be undone.")) deleteAllMutation.mutate(); }}
            className="flex items-center gap-2 border border-border text-muted-foreground text-sm px-3 py-2 rounded hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors btn-press">
            <Trash2 size={14} /> Clear All
          </button>
        )}
        <span className="text-xs font-mono text-muted-foreground ml-auto">{totalItems.toLocaleString()} products</span>
      </div>

      {/* Empty State */}
      {!isLoading && products.length === 0 && !search && !catFilter ? (
        <div className="bg-card border border-border rounded p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center"><FolderTree size={20} className="text-muted-foreground" /></div>
          <p className="text-sm font-medium text-foreground">No products scraped yet</p>
          <p className="text-xs text-muted-foreground">Go to Categories and click <strong>"Scrape"</strong> to start collecting products.</p>
          <button onClick={() => navigate("/categories")} className="bg-primary text-primary-foreground text-sm px-6 py-2.5 rounded btn-press hover:opacity-90">Go to Categories</button>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="grid grid-cols-[40px_70px_1fr_90px_60px_80px_90px_100px] gap-3 px-4 py-3 border-b border-border">
              {["", "ASIN", "Title", "Price", "Rating", "Reviews", "Category", ""].map((h, i) => (
                <span key={i} className="text-[10px] uppercase tracking-widest text-muted-foreground">{h}</span>
              ))}
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No products match your search.</div>
            ) : (
              products.map((p: any, i: number) => (
                <div key={p.id || p.asin}
                  className={`grid grid-cols-[40px_70px_1fr_90px_60px_80px_90px_100px] gap-3 px-4 py-2.5 items-center border-b border-border ${i % 2 === 0 ? "bg-background" : "bg-card"}`}>
                  {/* Compare checkbox */}
                  <button onClick={() => toggleCompare(p.asin)}
                    className="w-4 h-4 rounded-sm border border-border bg-background flex items-center justify-center shrink-0 hover:border-foreground/50">
                    {compareSet.has(p.asin) && <div className="w-2 h-2 bg-foreground rounded-sm" />}
                  </button>
                  <span className="text-xs font-mono text-muted-foreground">{p.asin}</span>
                  <span onClick={() => setDrawer(p)} className="text-sm text-foreground truncate cursor-pointer hover:underline">{p.title}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-mono text-foreground">₹{(p.price || 0).toLocaleString()}</span>
                    {/* Price change badge */}
                    {p.priceChange && p.priceChange < 0 && (
                      <TrendingDown size={12} className="text-green-400" />
                    )}
                    {p.priceChange && p.priceChange > 0 && (
                      <TrendingUp size={12} className="text-red-400" />
                    )}
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{(p.rating || 0).toFixed(1)}</span>
                  <span className="text-xs font-mono text-muted-foreground">{(p.reviews || 0).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground truncate">{p.category}</span>
                  <span className="text-[10px] font-mono text-tertiary">{(p.scrapedAt || "").split(" ")[1] || ""}</span>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1 disabled:text-tertiary btn-press">Previous</button>
              <span className="text-sm text-foreground mx-4">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1 disabled:text-tertiary btn-press">Next</button>
            </div>
          )}
        </>
      )}

      {/* ── Compare Bar ── */}
      {compareSet.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card-elevated border border-border rounded px-6 py-3 flex items-center gap-4 shadow-2xl z-50">
          <GitCompareArrows size={16} className="text-foreground" />
          <span className="text-sm text-muted-foreground">{compareSet.size} products selected</span>
          <button onClick={() => setShowCompare(true)} className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded btn-press hover:opacity-90">Compare</button>
          <button onClick={() => setCompareSet(new Set())} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      {/* ── Comparison View ── */}
      <AnimatePresence>
        {showCompare && compareProducts.length >= 2 && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/70 z-50" onClick={() => setShowCompare(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-medium text-foreground">Product Comparison</h2>
                <button onClick={() => setShowCompare(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: `120px repeat(${compareProducts.length}, 1fr)` }}>
                {/* Headers */}
                <div className="text-xs text-muted-foreground py-2" />
                {compareProducts.map((p: any) => (
                  <div key={p.asin} className="text-center">
                    {p.image_url && <img src={p.image_url} alt="" className="h-20 mx-auto object-contain mb-2" />}
                    <p className="text-xs text-foreground font-medium line-clamp-2">{p.title}</p>
                  </div>
                ))}
                {/* Rows */}
                {[
                  ["Price", (p: any) => `₹${(p.price || 0).toLocaleString()}`],
                  ["Rating", (p: any) => `${(p.rating || 0).toFixed(1)} ★`],
                  ["Reviews", (p: any) => (p.reviews || 0).toLocaleString()],
                  ["Category", (p: any) => p.category || "—"],
                  ["ASIN", (p: any) => p.asin],
                ].map(([label, fn]) => (
                  <div key={label as string} className="contents">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider py-3 border-t border-border flex items-center">{label as string}</div>
                    {compareProducts.map((p: any) => {
                      const val = (fn as (p: any) => string)(p);
                      // Highlight best value
                      let isBest = false;
                      if (label === "Price") {
                        const prices = compareProducts.map((cp: any) => cp.price || Infinity);
                        isBest = p.price === Math.min(...prices);
                      }
                      if (label === "Rating") {
                        const ratings = compareProducts.map((cp: any) => cp.rating || 0);
                        isBest = p.rating === Math.max(...ratings);
                      }
                      return (
                        <div key={p.asin} className={`text-sm font-mono text-center py-3 border-t border-border ${isBest ? "text-green-400 font-semibold" : "text-foreground"}`}>{val}</div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Product Drawer ── */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 z-40" onClick={() => setDrawer(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed right-0 top-0 bottom-0 w-[420px] bg-card border-l border-border z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-medium text-foreground">Product Details</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(drawer.asin); }}
                    className="text-muted-foreground hover:text-red-400 p-1 rounded"><Trash2 size={16} /></button>
                  <button onClick={() => setDrawer(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                </div>
              </div>
              {drawer.image_url ? (
                <div className="w-full h-48 bg-background border border-border rounded mb-6 flex items-center justify-center overflow-hidden">
                  <img src={drawer.image_url} alt={drawer.title} className="object-contain h-full w-full" />
                </div>
              ) : (
                <div className="w-full h-48 bg-background border border-border rounded mb-6 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No image</span>
                </div>
              )}
              <h3 className="text-lg font-medium text-foreground mb-4">{drawer.title}</h3>

              {/* Price change badge */}
              {drawer.priceChange && drawer.priceChange !== 0 && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded mb-4 text-sm ${drawer.priceChange < 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {drawer.priceChange < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  Price {drawer.priceChange < 0 ? "dropped" : "increased"} by ₹{Math.abs(drawer.priceChange).toLocaleString()} ({drawer.priceChangePct > 0 ? "+" : ""}{drawer.priceChangePct}%)
                </div>
              )}

              {/* Price History Chart */}
              {priceHistory && priceHistory.length > 1 && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Price History</p>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={priceHistory}>
                      <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 4, fontSize: 11 }}
                        formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Price"]} />
                      <Line type="monotone" dataKey="price" stroke="#F5F5F5" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="space-y-4">
                {[["ASIN", drawer.asin], ["Price", `₹${(drawer.price || 0).toLocaleString()}`], ["Rating", `${(drawer.rating || 0).toFixed(1)} ★`], ["Reviews", (drawer.reviews || 0).toLocaleString()], ["Category", drawer.category], ["Scraped At", drawer.scrapedAt]].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-border">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
                    <span className="text-sm font-mono text-foreground text-right ml-4 break-words">{val}</span>
                  </div>
                ))}
              </div>
              <a href={drawer.product_url || `https://amazon.in/dp/${drawer.asin}`} target="_blank" rel="noreferrer"
                className="block mt-8 text-sm text-center bg-primary text-primary-foreground py-2.5 rounded hover:opacity-90 btn-press">View on Amazon →</a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
