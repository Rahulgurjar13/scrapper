import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingDown, Star, Award } from "lucide-react";

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-card rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-card border border-border rounded h-24" />)}
        </div>
        <div className="bg-card border border-border rounded h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-medium text-foreground">Analytics</h1>
        <div className="bg-card border border-border rounded p-8 text-center">
          <p className="text-sm text-muted-foreground">No data yet. Scrape some products first!</p>
        </div>
      </div>
    );
  }

  const { totalProducts, avgPrice, minPrice, maxPrice, avgByCategory, priceDistribution, bestDeals, topRated } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-medium text-foreground">Analytics & Insights</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Price analysis, best deals, and product insights from your scraped data.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: totalProducts?.toLocaleString() || "0" },
          { label: "Average Price", value: `₹${(avgPrice || 0).toLocaleString()}` },
          { label: "Lowest Price", value: `₹${(minPrice || 0).toLocaleString()}` },
          { label: "Highest Price", value: `₹${(maxPrice || 0).toLocaleString()}` },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border rounded p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{m.label}</p>
            <p className="text-2xl font-semibold font-mono text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Avg Price per Category */}
        <div className="bg-card border border-border rounded p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Average Price by Category</p>
          <p className="text-[10px] text-muted-foreground/60 mb-4">Compare average product prices across categories</p>
          {avgByCategory && avgByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={avgByCategory} layout="vertical">
                <CartesianGrid stroke="#1E1E1E" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" width={80} tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 4, fontSize: 12 }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Avg Price"]}
                />
                <Bar dataKey="avgPrice" fill="#F5F5F5" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data available.</p>
          )}
        </div>

        {/* Price Distribution */}
        <div className="bg-card border border-border rounded p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Price Distribution</p>
          <p className="text-[10px] text-muted-foreground/60 mb-4">How many products fall in each price range</p>
          {priceDistribution && priceDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priceDistribution}>
                <CartesianGrid stroke="#1E1E1E" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: "#888", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 4, fontSize: 12 }}
                  formatter={(value: any) => [value, "Products"]}
                />
                <Bar dataKey="count" fill="#F5F5F5" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data available.</p>
          )}
        </div>
      </div>

      {/* Best Deals */}
      <div className="bg-card border border-border rounded p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown size={14} className="text-green-400" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Best Deals</p>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mb-4">Products with ≥4★ rating at the lowest prices — best value for money</p>
        {bestDeals && bestDeals.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {bestDeals.slice(0, 6).map((deal: any) => (
              <div key={deal.id || deal.asin} className="bg-secondary rounded p-4 space-y-2">
                <p className="text-sm text-foreground truncate font-medium" title={deal.title}>{deal.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono text-foreground font-semibold">₹{(deal.price || 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    {(deal.rating || 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{deal.category}</span>
                  <span className="text-[10px] text-muted-foreground">{(deal.reviews || 0).toLocaleString()} reviews</span>
                </div>
                {deal.product_url && (
                  <a href={deal.product_url} target="_blank" rel="noreferrer"
                    className="text-[10px] text-foreground underline underline-offset-2 hover:text-muted-foreground">
                    View on Amazon →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No deals yet. Scrape more products!</p>
        )}
      </div>

      {/* Top Rated */}
      <div className="bg-card border border-border rounded p-5">
        <div className="flex items-center gap-2 mb-1">
          <Award size={14} className="text-yellow-400" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Top Rated Products</p>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mb-4">Highest rated products with at least 100 reviews</p>
        {topRated && topRated.length > 0 ? (
          <div className="space-y-0">
            {topRated.map((p: any, i: number) => (
              <div key={p.id || p.asin}
                className={`flex items-center justify-between py-3 ${i < topRated.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="flex items-center gap-1 text-sm font-mono">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    {(p.rating || 0).toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground w-16 text-right">{(p.reviews || 0).toLocaleString()}</span>
                  <span className="text-sm font-mono text-foreground w-20 text-right">₹{(p.price || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        )}
      </div>
    </div>
  );
}
