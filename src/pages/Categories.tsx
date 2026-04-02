import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, RefreshCw, Play, Loader2, Trash2, Plus, X, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCategories, triggerCategoriesFetch, startScraper, fetchScraperStatus, deleteCategory, addCustomCategory } from "@/lib/api";
import { toast } from "sonner";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scrapingCategory, setScrapingCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customSearch, setCustomSearch] = useState("");

  const { data: categories = [], isLoading, isFetching } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: scraperStatus } = useQuery({
    queryKey: ["scraperStatus"],
    queryFn: fetchScraperStatus,
    refetchInterval: 3000,
  });
  const scraperRunning = scraperStatus?.running || false;

  const fetchMutation = useMutation({
    mutationFn: triggerCategoriesFetch,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(data?.message || "Categories loaded successfully!");
    },
    onError: () => toast.error("Failed to fetch categories."),
  });

  const scrapeSingleMutation = useMutation({
    mutationFn: (categoryName: string) =>
      startScraper({ categories: [categoryName], max_products: 100, delay: 2.0 }),
    onSuccess: (_data, categoryName) => {
      toast.success(`Scraping "${categoryName}" started!`, {
        action: { label: "View Logs", onClick: () => navigate("/logs") },
      });
      queryClient.invalidateQueries({ queryKey: ["scraperStatus"] });
      setScrapingCategory(null);
    },
    onError: () => { toast.error("Failed to start scraping."); setScrapingCategory(null); },
  });

  const bulkScrapeMutation = useMutation({
    mutationFn: (names: string[]) =>
      startScraper({ categories: names, max_products: 100, delay: 2.0 }),
    onSuccess: (_data, names) => {
      toast.success(`Scraping ${names.length} categories started!`, {
        action: { label: "View Logs", onClick: () => navigate("/logs") },
      });
      queryClient.invalidateQueries({ queryKey: ["scraperStatus"] });
      setSelected(new Set());
    },
    onError: () => toast.error("Failed to start bulk scraping."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted.");
    },
    onError: () => toast.error("Failed to delete category."),
  });

  const addCustomMutation = useMutation({
    mutationFn: addCustomCategory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(data?.message || "Custom category added!");
      setShowAddModal(false);
      setCustomName("");
      setCustomSearch("");
    },
    onError: () => toast.error("Failed to add category."),
  });

  const toggleExpand = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const toggleSelect = (name: string) => {
    setSelected((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  };

  const handleScrapeOne = (name: string) => {
    if (scraperRunning) { toast.warning("Scraper is already running."); return; }
    setScrapingCategory(name); scrapeSingleMutation.mutate(name);
  };
  const handleBulkScrape = () => {
    if (scraperRunning) { toast.warning("Scraper is already running."); return; }
    bulkScrapeMutation.mutate(Array.from(selected));
  };
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete category "${name}"? Products in this category will NOT be deleted.`)) {
      deleteMutation.mutate(id);
    }
  };
  const handleAddCustom = () => {
    if (!customName.trim()) { toast.warning("Enter a category name."); return; }
    if (!customSearch.trim()) { toast.warning("Enter a search term."); return; }
    addCustomMutation.mutate({ name: customName.trim(), searchTerm: customSearch.trim() });
  };

  if (isLoading) return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-card rounded" /><div className="h-96 w-full bg-card rounded" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-foreground">Categories</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Click <strong>"Scrape"</strong> to collect products from any category. Use <strong>"+ Add Custom"</strong> to search for anything on Amazon.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-sm border border-border text-foreground px-4 py-2 rounded hover:bg-surface-hover transition-colors btn-press">
            <Plus size={14} /> Add Custom
          </button>
          <button onClick={() => fetchMutation.mutate()} disabled={fetchMutation.isPending}
            className="flex items-center gap-2 text-sm border border-border text-foreground px-4 py-2 rounded hover:bg-primary hover:text-primary-foreground transition-colors btn-press disabled:opacity-50">
            <RefreshCw size={14} className={fetchMutation.isPending || isFetching ? "animate-spin" : ""} />
            {fetchMutation.isPending ? "Fetching..." : "Fetch from Amazon"}
          </button>
        </div>
      </div>

      {/* Scraper Running Banner */}
      {scraperRunning && (
        <div className="bg-foreground/5 border border-foreground/20 rounded px-4 py-3 flex items-center gap-3">
          <Loader2 size={14} className="animate-spin text-foreground" />
          <span className="text-sm text-foreground">
            Scraper running: <strong>{scraperStatus?.current_category || "..."}</strong> — {scraperStatus?.products_found || 0} products
          </span>
          <button onClick={() => navigate("/logs")} className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">View Logs →</button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-card border border-border rounded p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center"><RefreshCw size={20} className="text-muted-foreground" /></div>
          <p className="text-sm font-medium text-foreground">No categories loaded yet</p>
          <p className="text-xs text-muted-foreground">Click <strong>"Fetch from Amazon"</strong> to load categories, or <strong>"Add Custom"</strong> to search for anything.</p>
          <button onClick={() => fetchMutation.mutate()} disabled={fetchMutation.isPending}
            className="bg-primary text-primary-foreground text-sm px-6 py-2.5 rounded btn-press hover:opacity-90 disabled:opacity-50">
            Fetch Categories Now
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px_120px_70px_140px] gap-4 px-4 py-3 border-b border-border">
            {["Category", "Products", "Subs", "Last Scraped", "Status", "Actions"].map((h) => (
              <span key={h} className="text-[10px] uppercase tracking-widest text-muted-foreground">{h}</span>
            ))}
          </div>
          {categories.map((cat: any) => (
            <div key={cat.id}>
              <div className="grid grid-cols-[1fr_80px_80px_120px_70px_140px] gap-4 px-4 py-3 items-center hover:bg-surface-hover transition-none border-b border-border">
                <div className="flex items-center gap-2 overflow-hidden">
                  <button onClick={() => toggleSelect(cat.name)}
                    className="w-4 h-4 rounded-sm border border-border bg-background flex items-center justify-center shrink-0 hover:border-foreground/50">
                    {selected.has(cat.name) && <div className="w-2 h-2 bg-foreground rounded-sm" />}
                  </button>
                  <button onClick={() => toggleExpand(cat.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                    {expanded[cat.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <span className="text-sm text-foreground font-medium truncate" title={cat.name}>{cat.name}</span>
                  {cat.custom && <span className="text-[9px] bg-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded">custom</span>}
                </div>
                <span className="text-sm font-mono text-foreground">{(cat.products || 0).toLocaleString()}</span>
                <span className="text-sm font-mono text-muted-foreground">{cat.children?.length || 0}</span>
                <span className="text-xs font-mono text-muted-foreground">{cat.lastScraped || "Never"}</span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm w-fit ${cat.status === "active" ? "bg-foreground text-background" : "border border-border text-muted-foreground"}`}>
                  {cat.status === "active" ? "Active" : "Idle"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleScrapeOne(cat.name)}
                    disabled={scraperRunning || scrapingCategory === cat.name}
                    className="flex items-center gap-1 text-xs text-foreground border border-border rounded px-2.5 py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors btn-press disabled:opacity-40 disabled:cursor-not-allowed">
                    {scrapingCategory === cat.name ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />} Scrape
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)}
                    className="text-muted-foreground hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors btn-press">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {expanded[cat.id] && cat.children?.map((child: any) => (
                <div key={child.id} className="grid grid-cols-[1fr_80px_80px_120px_70px_140px] gap-4 px-4 py-2.5 items-center hover:bg-surface-hover border-b border-border">
                  <div className="flex items-center gap-2 pl-10 overflow-hidden">
                    <div className="w-px h-4 bg-border mr-2 shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">{child.name}</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{child.products || 0}</span>
                  <span className="text-sm font-mono text-tertiary">—</span>
                  <span className="text-xs font-mono text-muted-foreground">{child.lastScraped || "Never"}</span>
                  <span className="text-[10px] border border-border text-muted-foreground px-2 py-0.5 rounded-sm w-fit">Idle</span>
                  <button onClick={() => handleScrapeOne(child.name)} disabled={scraperRunning}
                    className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded px-2.5 py-1.5 btn-press disabled:opacity-40 w-fit">
                    <Play size={10} /> Scrape
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card-elevated border border-border rounded px-6 py-3 flex items-center gap-4 shadow-2xl z-50">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <button onClick={handleBulkScrape} disabled={scraperRunning || bulkScrapeMutation.isPending}
            className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded btn-press hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {bulkScrapeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Scrape ({selected.size})
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      {/* ── Add Custom Category Modal ── */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-background/60 z-50" onClick={() => setShowAddModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-lg p-6 w-[440px] space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-foreground">Add Custom Category</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <p className="text-xs text-muted-foreground">
              Search for <strong>anything</strong> on Amazon — "gaming chair", "protein powder", "wireless earbuds", etc.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Category Name</label>
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Gaming Chairs"
                  className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Amazon Search Term</label>
                <div className="relative mt-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={customSearch} onChange={(e) => setCustomSearch(e.target.value)} placeholder="e.g. gaming chair"
                    className="w-full bg-secondary border border-border rounded pl-9 pr-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none" />
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  This will search Amazon.in for "{customSearch || "..."}" and add it as a scrapeable category.
                </p>
              </div>
            </div>
            <button onClick={handleAddCustom} disabled={addCustomMutation.isPending}
              className="w-full bg-primary text-primary-foreground text-sm py-2.5 rounded btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {addCustomMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Category
            </button>
          </div>
        </>
      )}
    </div>
  );
}
