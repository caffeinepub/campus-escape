import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "../context/CartContext";

interface CartSidebarProps {
  onCheckout: () => void;
}

export default function CartSidebar({ onCheckout }: CartSidebarProps) {
  const {
    items,
    isOpen,
    setIsOpen,
    removeFromCart,
    updateQuantity,
    total,
    itemCount,
  } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-background border-l border-border shadow-xl z-50 flex flex-col"
            data-ocid="cart.panel"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Your Cart
                {itemCount > 0 && (
                  <span className="text-sm bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                data-ocid="cart.close_button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-full text-center gap-3"
                  data-ocid="cart.empty_state"
                >
                  <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={item.product.id.toString()}
                    className="flex gap-3"
                    data-ocid={`cart.item.${idx + 1}`}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-primary text-sm font-semibold">
                        ${(Number(item.product.priceCents) / 100).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="p-0.5 rounded border border-border hover:bg-muted transition-colors"
                          data-ocid={`cart.decrease.button.${idx + 1}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="p-0.5 rounded border border-border hover:bg-muted transition-colors"
                          data-ocid={`cart.increase.button.${idx + 1}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-auto p-0.5 rounded hover:text-destructive transition-colors"
                          data-ocid={`cart.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-border space-y-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:opacity-90"
                  onClick={() => {
                    setIsOpen(false);
                    onCheckout();
                  }}
                  data-ocid="cart.checkout.button"
                >
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
