import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Milk, ShoppingCart } from "lucide-react";
import type { Product } from "../backend.d";
import { useCart } from "../context/CartContext";

const FALLBACK_IMAGES: Record<string, string> = {
  Milk: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
  Butter: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400",
  Yogurt: "https://images.unsplash.com/photo-1488477181228-c83a33b9e7c6?w=400",
  Cheese: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400",
};

function formatPrice(cents: bigint) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 1 }: ProductCardProps) {
  const { addToCart } = useCart();
  const imageUrl = product.imageUrl || FALLBACK_IMAGES[product.category] || "";

  return (
    <div
      className="group bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
      data-ocid={`product.item.${index}`}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent">
            <Milk className="w-12 h-12 text-primary opacity-50" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-base text-foreground">
            {product.name}
          </h3>
          <span className="text-primary font-semibold text-sm shrink-0">
            {formatPrice(product.priceCents)}
          </span>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs capitalize">
            {product.category}
          </Badge>
          {product.inStock ? (
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:opacity-90"
              onClick={() => addToCart(product)}
              data-ocid={`product.add_to_cart.button.${index}`}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              Add to Cart
            </Button>
          ) : (
            <Badge
              variant="outline"
              className="text-destructive border-destructive/30"
            >
              Out of Stock
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
