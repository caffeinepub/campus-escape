import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import CartSidebar from "./components/CartSidebar";
import CheckoutModal from "./components/CheckoutModal";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { CartProvider } from "./context/CartContext";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";

type Page = "home" | "products" | "admin";

const queryClient = new QueryClient();

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleNavigate = (p: Page) => {
    setPage(p);
    if (p !== "products") setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <Toaster />
          <Header
            currentPage={page}
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (q && page !== "products") setPage("products");
            }}
          />
          <div className="flex-1">
            {page === "home" && <HomePage onNavigate={handleNavigate} />}
            {page === "products" && <ProductsPage searchQuery={searchQuery} />}
            {page === "admin" && <AdminPage />}
          </div>
          <Footer />
          <CartSidebar onCheckout={() => setCheckoutOpen(true)} />
          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
          />
        </div>
      </CartProvider>
    </QueryClientProvider>
  );
}
