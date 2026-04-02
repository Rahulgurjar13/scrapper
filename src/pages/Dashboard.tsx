import { useNavigate } from "react-router-dom";
import { ArrowUpRight, FolderTree, Play, Package, ArrowRight, TrendingDown, BarChart3, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard, refetchInterval: 15000 });

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="bg-card border border-border rounded h-24" />)}</div>
      <div className="bg-card border border-border rounded h-64 mt-6" />
    </div>
  );

  if (isError || !data) return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
      <div className="bg-card border border-border rounded p-8 text-center">
        <p className="text-red-400 text-sm">Failed to load dashboard data.</p>
        <p className="text-muted-foreground text-xs mt-2">Make sure the backend is running on port 8000.</p>
      </div>
    </div>
  );

  const metrics = data.metrics || [];
  const categoryBarData = data.categoryBarData || [];
  const scrapeActivity = data.scrapeActivity || [];
  const recentJobs = data.recentJobs || [];
  const priceDrops = data.priceDrops || [];
  const nextScrape = data.nextScrape;

  const totalProducts = parseInt((metrics[0]?.value || "0").replace(/,/g, ""), 10);
  const isFirstTime = totalProducts === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">Overview of your scraped Amazon product data</p>
        </div>
        {nextScrape && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded px-3 py-1.5">
            <Clock size={12} />
            Next auto-scrape: <span className="text-foreground font-mono">{nextScrape}</span>
          </div>
        )}
      </div>

      {/* Welcome Guide */}
      {isFirstTime && (
        <div className="bg-card border border-border rounded p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-foreground">👋 Welcome to Scraper Nexus</p>
            <p className="text-xs text-muted-foreground mt-1">This tool scrapes product data from Amazon.in and saves it to your database. Follow these 3 steps:</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: 1, title: "Load Categories", desc: 'Go to Categories and click "Fetch from Amazon" to load product categories.', icon: FolderTree, link: "/categories" },
              { step: 2, title: "Scrape Products", desc: 'Click "Scrape" next to any category. The scraper collects name, price, rating, reviews.', icon: Play, link: "/categories" },
              { step: 3, title: "Browse & Export", desc: "View scraped products, filter by category, compare prices, and export to CSV.", icon: Package, link: "/products" },
            ].map((s) => (
              <button key={s.step} onClick={() => navigate(s.link)}
                className="bg-secondary border border-border rounded p-4 text-left hover:border-foreground/30 transition-colors group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold">{s.step}</div>
                  <span className="text-xs font-medium text-foreground">{s.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-foreground"><s.icon size={12} /><ArrowRight size={10} /></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m: any) => (
          <div key={m.label} className="bg-card border border-border rounded p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{m.label}</p>
            <p className={`text-3xl font-semibold text-foreground ${m.mono ? "font-mono" : ""}`}>{m.value}</p>
            {m.change && <div className="flex items-center gap-1 mt-2 text-muted-foreground"><ArrowUpRight size={12} /><span className="text-xs">{m.change}</span></div>}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/categories")} className="flex items-center gap-2 text-sm border border-border text-foreground px-4 py-2 rounded hover:bg-surface-hover transition-colors btn-press"><FolderTree size={14} /> Manage Categories</button>
        <button onClick={() => navigate("/scraper")} className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 transition-colors btn-press"><Play size={14} /> Scrape Now</button>
        <button onClick={() => navigate("/products")} className="flex items-center gap-2 text-sm border border-border text-foreground px-4 py-2 rounded hover:bg-surface-hover transition-colors btn-press"><Package size={14} /> View Products</button>
        <button onClick={() => navigate("/analytics")} className="flex items-center gap-2 text-sm border border-border text-foreground px-4 py-2 rounded hover:bg-surface-hover transition-colors btn-press"><BarChart3 size={14} /> Analytics</button>
      </div>

      {/* Charts + Jobs Row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-card border border-border rounded p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Scrape Activity (7 Days)</p>
          <p className="text-[10px] text-muted-foreground/60 mb-4">Products scraped each day this week</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={scrapeActivity}>
              <CartesianGrid stroke="#1E1E1E" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Area type="monotone" dataKey="count" stroke="#F5F5F5" strokeWidth={1.5} fill="#F5F5F5" fillOpacity={0.05} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-2 bg-card border border-border rounded p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Recent Jobs</p>
          <p className="text-[10px] text-muted-foreground/60 mb-4">Scraper run history</p>
          <div className="space-y-0">
            {recentJobs.length > 0 ? recentJobs.map((j: any, i: number) => (
              <div key={j.id || i} className={`flex items-center justify-between py-2.5 ${i < recentJobs.length - 1 ? "border-b border-border" : ""}`}>
                <div><p className="text-sm text-foreground">{j.category || "Unknown"}</p><p className="text-xs font-mono text-muted-foreground">{j.timestamp}</p></div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${j.status === "completed" ? "border border-border text-muted-foreground" : j.status === "running" ? "bg-foreground text-background" : j.status === "failed" ? "bg-red-500/20 text-red-400" : "text-tertiary"}`}>{j.status}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No jobs yet. Start one from Categories!</p>}
          </div>
        </div>
      </div>

      {/* Price Drops */}
      {priceDrops.length > 0 && (
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-green-400" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent Price Drops</p>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mb-4">Products whose price decreased since last scrape</p>
          <div className="grid grid-cols-3 gap-3">
            {priceDrops.map((d: any) => (
              <div key={d.id || d.asin} className="bg-secondary rounded p-3 space-y-1">
                <p className="text-sm text-foreground truncate font-medium" title={d.title}>{d.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-mono text-foreground">₹{(d.price || 0).toLocaleString()}</span>
                  <span className="text-xs text-green-400 font-mono">↓ ₹{Math.abs(d.priceChange || 0).toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{d.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Bar */}
      <div className="bg-card border border-border rounded p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Top Categories</p>
        <p className="text-[10px] text-muted-foreground/60 mb-4">Categories with the most products</p>
        <div className="space-y-3">
          {categoryBarData.length > 0 ? categoryBarData.map((cat: any) => (
            <div key={cat.name} className="flex items-center gap-4">
              <span className="text-sm text-foreground w-32 shrink-0 truncate">{cat.name}</span>
              <div className="flex-1 h-6 bg-secondary rounded-sm overflow-hidden">
                <div className="h-full bg-foreground rounded-sm" style={{ width: `${categoryBarData[0]?.count > 0 ? (cat.count / categoryBarData[0].count) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-12 text-right">{(cat.count || 0).toLocaleString()}</span>
            </div>
          )) : <p className="text-sm text-muted-foreground">No data yet.</p>}
        </div>
      </div>
    </div>
  );
}
