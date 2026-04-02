import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Loader2, Play, Square, FolderTree, Clock, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchScraperStatus, startScraper, stopScraper, fetchCategories, fetchSchedules, createSchedule, removeSchedule } from "@/lib/api";
import { toast } from "sonner";

export default function ScraperControl() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [delay, setDelay] = useState(2000);
  const [maxProducts, setMaxProducts] = useState(100);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  // Schedule form
  const [schedCat, setSchedCat] = useState("");
  const [schedInterval, setSchedInterval] = useState(6);
  const [schedMax, setSchedMax] = useState(100);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const allCategoryNames = categories.map((c: any) => c.name);

  const { data: status } = useQuery({
    queryKey: ["scraperStatus"], queryFn: fetchScraperStatus,
    refetchInterval: (q) => (q.state.data?.running ? 2000 : 5000) as any,
  });
  const running = status?.running || false;

  const { data: schedules = [] } = useQuery({ queryKey: ["schedules"], queryFn: fetchSchedules });

  const startMutation = useMutation({
    mutationFn: startScraper,
    onSuccess: () => {
      toast.success("Scraper started!", { action: { label: "View Logs", onClick: () => navigate("/logs") } });
      queryClient.invalidateQueries({ queryKey: ["scraperStatus"] });
    },
    onError: () => toast.error("Failed to start scraper."),
  });

  const stopMutation = useMutation({
    mutationFn: stopScraper,
    onSuccess: () => { toast.success("Stop signal sent."); queryClient.invalidateQueries({ queryKey: ["scraperStatus"] }); },
  });

  const addScheduleMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule created! Auto-scraping will start automatically.");
      setSchedCat(""); setSchedInterval(6); setSchedMax(100);
    },
    onError: () => toast.error("Failed to create schedule."),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: removeSchedule,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["schedules"] }); toast.success("Schedule deleted."); },
  });

  const handleStart = () => {
    if (selectedCats.length === 0) { toast.warning("Select at least one category."); return; }
    startMutation.mutate({ categories: selectedCats, max_products: maxProducts, delay: delay / 1000 });
  };

  const handleAddSchedule = () => {
    if (!schedCat) { toast.warning("Select a category for the schedule."); return; }
    addScheduleMutation.mutate({ categoryName: schedCat, intervalHours: schedInterval, maxProducts: schedMax, enabled: true });
  };

  const progress = status?.progress || 0;
  const currentCategory = status?.current_category || "Idle";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-foreground">Scraper Control</h1>
        <p className="text-xs text-muted-foreground mt-1">Configure manual scraping or set up automatic schedules.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* ── Config ── */}
        <div className="bg-card border border-border rounded p-6 space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Manual Scrape</p>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Target Categories</label>
            <p className="text-[10px] text-muted-foreground/60">Hold Ctrl/Cmd to select multiple</p>
            {allCategoryNames.length > 0 ? (
              <select multiple className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none h-32"
                value={selectedCats} onChange={(e) => setSelectedCats(Array.from(e.target.selectedOptions, o => o.value))}>
                {allCategoryNames.map((c: string) => <option key={c} value={c} className="py-1">{c}</option>)}
              </select>
            ) : (
              <div className="bg-secondary border border-border rounded p-4 text-center space-y-2">
                <FolderTree size={16} className="text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">No categories loaded.</p>
                <button onClick={() => navigate("/categories")} className="text-xs text-foreground underline">Go to Categories →</button>
              </div>
            )}
            {selectedCats.length > 0 && <p className="text-[10px] text-muted-foreground">{selectedCats.length} selected</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Max Products per Category</label>
            <p className="text-[10px] text-muted-foreground/60">Amazon shows ~20 products per page</p>
            <input type="number" value={maxProducts} onChange={(e) => setMaxProducts(Number(e.target.value))} min={10} max={1000}
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:border-foreground focus:outline-none" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Request Delay</label>
              <span className="text-xs font-mono text-muted-foreground">{delay}ms</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">Higher = safer from blocks. Recommended: 1500-3000ms</p>
            <input type="range" min={500} max={5000} step={100} value={delay} onChange={(e) => setDelay(Number(e.target.value))} className="w-full accent-foreground cursor-pointer" />
            <div className="flex justify-between text-[10px] text-muted-foreground/40"><span>Fast</span><span>Safe</span></div>
          </div>

          {!running && (
            <button onClick={handleStart} disabled={startMutation.isPending || selectedCats.length === 0}
              className="w-full bg-primary text-primary-foreground text-sm py-3 rounded btn-press hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
              {startMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {selectedCats.length === 0 ? "Select categories first" : `Start Scraping (${selectedCats.length})`}
            </button>
          )}
        </div>

        {/* ── Status ── */}
        <div className="bg-card border border-border rounded p-6">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Scraper Status</p>
          {!running ? (
            <div className="flex flex-col items-center justify-center h-[350px] text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4"><Play size={24} className="text-muted-foreground ml-1" /></div>
              <p className="text-xl font-medium text-tertiary">Scraper Idle</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-[250px]">Select categories and click "Start Scraping" or set up a schedule below.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div><p className="text-xs text-muted-foreground">Currently processing</p><p className="text-xl font-medium text-foreground mt-1 truncate">{currentCategory}</p></div>
              <div>
                <div className="flex justify-between mb-1"><span className="text-xs text-muted-foreground">Progress</span><span className="text-xs font-mono text-muted-foreground">{progress.toFixed(1)}%</span></div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-foreground rounded-full transition-all duration-500" style={{ width: `${progress}%` }} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["Products", status?.products_found || 0], ["Pages", status?.pages_done || 0], ["Errors", status?.errors || 0]].map(([l, v]) => (
                  <div key={l as string} className="bg-secondary rounded p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</p>
                    <p className="text-lg font-mono text-foreground mt-1">{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Live Activity</p>
                <div className="bg-background rounded p-3 max-h-28 overflow-y-auto">
                  {status?.logs?.slice(-5).map((log: any, i: number) => (
                    <p key={i} className={`text-[11px] font-mono leading-relaxed ${log.level === "ERROR" ? "text-red-400" : log.level === "WARN" ? "text-yellow-400" : "text-muted-foreground"}`}>{log.message}</p>
                  ))}
                </div>
              </div>
              <button onClick={() => stopMutation.mutate()} disabled={stopMutation.isPending}
                className="w-full border border-border text-foreground text-sm py-3 rounded btn-press hover:bg-surface-hover flex items-center justify-center gap-2">
                <Square size={14} /> {stopMutation.isPending ? "Stopping..." : "Stop Scraper"}
              </button>
              <button onClick={() => navigate("/logs")} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 underline underline-offset-2">View full logs →</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Schedules Section ── */}
      <div className="bg-card border border-border rounded p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Auto-Scrape Schedules</p>
        </div>
        <p className="text-xs text-muted-foreground">Set categories to auto-scrape every X hours. The scheduler runs in the background.</p>

        {/* Add Schedule Form */}
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[10px] text-muted-foreground">Category</label>
            <select value={schedCat} onChange={(e) => setSchedCat(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-2 py-2 text-sm text-foreground focus:outline-none mt-1">
              <option value="">Select...</option>
              {allCategoryNames.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Every (hours)</label>
            <input type="number" value={schedInterval} onChange={(e) => setSchedInterval(Number(e.target.value))} min={1} max={168}
              className="w-full bg-secondary border border-border rounded px-2 py-2 text-sm font-mono text-foreground focus:outline-none mt-1" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Max Products</label>
            <input type="number" value={schedMax} onChange={(e) => setSchedMax(Number(e.target.value))} min={10} max={1000}
              className="w-full bg-secondary border border-border rounded px-2 py-2 text-sm font-mono text-foreground focus:outline-none mt-1" />
          </div>
          <button onClick={handleAddSchedule} disabled={addScheduleMutation.isPending || !schedCat}
            className="bg-primary text-primary-foreground text-sm py-2 rounded btn-press hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
            {addScheduleMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>

        {/* Schedule List */}
        {schedules.length > 0 ? (
          <div className="space-y-0">
            {schedules.map((s: any, i: number) => (
              <div key={s.id} className={`flex items-center justify-between py-3 ${i < schedules.length - 1 ? "border-b border-border" : ""}`}>
                <div>
                  <p className="text-sm text-foreground font-medium">{s.categoryName}</p>
                  <p className="text-xs text-muted-foreground">Every {s.intervalHours}h · Max {s.maxProducts} products</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${s.enabled ? "bg-foreground/10 text-foreground" : "border border-border text-muted-foreground"}`}>
                    {s.enabled ? "Active" : "Paused"}
                  </span>
                  <button onClick={() => deleteScheduleMutation.mutate(s.id)} className="text-muted-foreground hover:text-red-400 p-1"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center">No schedules set. Add one above to auto-scrape categories.</p>
        )}
      </div>
    </div>
  );
}
