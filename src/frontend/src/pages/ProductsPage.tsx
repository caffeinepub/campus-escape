import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { useState } from "react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useQueries";

const CATEGORIES = ["All", "Milk", "Butter", "Yogurt", "Cheese"];

interface ProductsPageProps {
  searchQuery: string;
}

export default function ProductsPage({ searchQuery }: ProductsPageProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: products = [], isLoading } = useProducts();

  const filtered = products.filter((p) => {
    const matchesCat =
      activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold font-display mb-1">All Products</h1>
        <p className="text-muted-foreground">
          Premium dairy delivered fresh from our farm partners
        </p>
      </motion.div>

      <div
        className="flex flex-wrap gap-2 mb-8"
        data-ocid="products.filter.tab"
      >
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            className={
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }
            onClick={() => setActiveCategory(cat)}
            data-ocid={`products.category_${cat.toLowerCase()}.tab`}
          >
            {cat}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
          data-ocid="products.loading_state"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <div key={i} className="space-y-3">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" data-ocid="products.empty_state">
          <p className="text-muted-foreground text-lg">No products found.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Try adjusting your search or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id.toString()}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ProductCard product={p} index={i + 1} />
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
