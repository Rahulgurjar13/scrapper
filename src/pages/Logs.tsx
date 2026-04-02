import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { WS_BASE_URL } from "@/lib/api";

export default function LogsPage() {
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const ws = new WebSocket(`${WS_BASE_URL}/ws/logs`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "init") {
          setLogs(data.logs || []);
        } else if (data.type === "new") {
          setLogs((prev) => {
            const next = [...prev, ...(data.logs || [])];
            return next.length > 300 ? next.slice(next.length - 250) : next;
          });
        }
      } catch (e) {
        console.error("Failed to parse log message", e);
      }
    };

    ws.onclose = () => {
      if (mountedRef.current) {
        setConnected(false);
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, autoScroll]);

  const levelTag = (level: string) => {
    if (level === "INFO")
      return <span className="text-foreground">[INFO]</span>;
    if (level === "WARN")
      return (
        <span className="text-yellow-400">[WARN]</span>
      );
    return (
      <span className="text-red-400 font-semibold">[ERROR]</span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-medium text-foreground">Live Logs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time output from the scraper engine. Start a scrape to see
              activity here.
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-connected" : "bg-red-500"
              } ${connected ? "animate-pulse" : ""}`}
            />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {connected ? "Connected" : "Reconnecting..."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Auto Scroll Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Auto Scroll</span>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`w-8 h-4 rounded-full relative transition-colors ${
                autoScroll ? "bg-foreground" : "bg-secondary"
              }`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                  autoScroll
                    ? "left-4 bg-background"
                    : "left-0.5 bg-muted-foreground"
                }`}
              />
            </button>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-muted-foreground hover:text-foreground btn-press"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Log Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>
          <span className="text-foreground font-medium">[INFO]</span> = Normal
          activity
        </span>
        <span>
          <span className="text-yellow-400 font-medium">[WARN]</span> = Warning (skipped, retry)
        </span>
        <span>
          <span className="text-red-400 font-medium">[ERROR]</span> = Failed
          (CAPTCHA, timeout)
        </span>
      </div>

      <div className="bg-background border border-border rounded overflow-hidden">
        <div className="h-[calc(100vh-220px)] overflow-y-auto p-4 font-mono text-[13px]">
          {logs.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  {connected
                    ? "No logs yet. Start a scrape job to see output."
                    : "Connecting to log server..."}
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  Go to{" "}
                  <span className="text-foreground">Categories</span> or{" "}
                  <span className="text-foreground">Scraper Control</span> to
                  start
                </p>
              </div>
            </div>
          )}
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={`flex gap-3 py-1 leading-relaxed ${
                log.level === "ERROR"
                  ? "text-red-400"
                  : log.level === "WARN"
                  ? "text-yellow-400"
                  : "text-foreground"
              }`}
            >
              <span className="text-tertiary shrink-0 select-none">
                {log.timestamp}
              </span>
              <span className="shrink-0">{levelTag(log.level)}</span>
              <span>{log.message}</span>
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
