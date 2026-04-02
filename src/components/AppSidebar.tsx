import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderTree, Package, Settings, Terminal, PanelLeftClose, PanelLeft, Grid3X3, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/categories", icon: FolderTree, label: "Categories" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/scraper", icon: Settings, label: "Scraper" },
  { to: "/logs", icon: Terminal, label: "Logs" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border bg-background transition-all duration-200"
      style={{ width: collapsed ? 56 : 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
        <Grid3X3 size={20} className="text-foreground shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium text-foreground whitespace-nowrap overflow-hidden"
            >
              Scraper Nexus
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 h-9 rounded text-sm transition-colors btn-press ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              } ${collapsed ? "justify-center px-0" : ""}`
            }
          >
            <item.icon size={18} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border px-3 py-3 space-y-2">
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-2 h-2 rounded-full bg-connected shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground whitespace-nowrap"
              >
                Connected
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors btn-press ${collapsed ? "justify-center w-full" : ""}`}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  );
}
