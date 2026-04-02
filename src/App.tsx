import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import CategoriesPage from "./pages/Categories";
import ProductsPage from "./pages/Products";
import ScraperControl from "./pages/ScraperControl";
import LogsPage from "./pages/Logs";
import AnalyticsPage from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "hsl(0 0% 8.6%)",
            border: "1px solid hsl(0 0% 13.3%)",
            color: "hsl(0 0% 96.1%)",
            fontFamily: "'Inter', sans-serif",
          },
        }}
      />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/scraper" element={<ScraperControl />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
