import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, Search, ShoppingCart, User } from "lucide-react";
import { useCart } from "../context/CartContext";

type Page = "home" | "products" | "admin";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function Header({
  currentPage,
  onNavigate,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const { itemCount, setIsOpen } = useCart();

  const navLinks: { label: string; page: Page }[] = [
    { label: "Home", page: "home" },
    { label: "Products", page: "products" },
    { label: "Admin", page: "admin" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-card">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16 gap-6">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-primary font-bold text-xl shrink-0"
            data-ocid="nav.home.link"
          >
            <Leaf className="w-6 h-6" />
            <span className="font-display">Farm to Home</span>
          </button>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(({ label, page }) => (
              <button
                type="button"
                key={page}
                onClick={() => onNavigate(page)}
                data-ocid={`nav.${page}.link`}
                className={`text-sm font-medium transition-colors pb-0.5 ${
                  currentPage === page
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onNavigate("products")}
              data-ocid="nav.shop_now.link"
              className="text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Shop Now
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              data-ocid="header.profile.button"
            >
              <User className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
              onClick={() => setIsOpen(true)}
              data-ocid="header.cart.button"
            >
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="pb-3">
          <div className="relative max-w-xl mx-auto">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10 rounded-lg border-border"
              data-ocid="header.search_input"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </header>
  );
}
