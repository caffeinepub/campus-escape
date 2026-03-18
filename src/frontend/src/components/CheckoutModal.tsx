import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { usePlaceOrder } from "../hooks/useQueries";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const { items, total, clearCart } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderId, setOrderId] = useState<bigint | null>(null);
  const placeOrder = usePlaceOrder();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.address.trim()) e.address = "Address is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      const orderItems = items.map((i) => ({
        productId: i.product.id,
        quantity: BigInt(i.quantity),
      }));
      const totalAmount = BigInt(Math.round(total * 100));
      const id = await placeOrder.mutateAsync({
        customerName: form.name,
        customerPhone: form.phone,
        customerAddress: form.address,
        items: orderItems,
        totalAmount,
      });
      setOrderId(id);
      clearCart();
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  };

  const handleClose = () => {
    setOrderId(null);
    setForm({ name: "", phone: "", address: "" });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-ocid="checkout.dialog">
        {orderId !== null ? (
          <div
            className="text-center py-8 space-y-4"
            data-ocid="checkout.success_state"
          >
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Order Placed!</h2>
            <p className="text-muted-foreground">
              Your order{" "}
              <span className="font-semibold text-foreground">
                #{orderId.toString()}
              </span>{" "}
              has been received.
            </p>
            <p className="text-sm text-muted-foreground">
              We'll deliver fresh dairy to your door soon! 🥛
            </p>
            <Button
              onClick={handleClose}
              className="bg-primary text-primary-foreground hover:opacity-90"
              data-ocid="checkout.close_button"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Jane Doe"
                  data-ocid="checkout.name.input"
                />
                {errors.name && (
                  <p
                    className="text-destructive text-xs"
                    data-ocid="checkout.name.error_state"
                  >
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+1 555 000 0000"
                  data-ocid="checkout.phone.input"
                />
                {errors.phone && (
                  <p
                    className="text-destructive text-xs"
                    data-ocid="checkout.phone.error_state"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Delivery Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="123 Main St, City, State"
                  data-ocid="checkout.address.input"
                />
                {errors.address && (
                  <p
                    className="text-destructive text-xs"
                    data-ocid="checkout.address.error_state"
                  >
                    {errors.address}
                  </p>
                )}
              </div>

              <Separator />

              {/* Order summary */}
              <div className="space-y-2">
                <p className="font-medium text-sm">Order Summary</p>
                {items.map((item) => (
                  <div
                    key={item.product.id.toString()}
                    className="flex justify-between text-sm text-muted-foreground"
                  >
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>
                      $
                      {(
                        (Number(item.product.priceCents) / 100) *
                        item.quantity
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t border-border pt-2">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:opacity-90"
                disabled={placeOrder.isPending}
                data-ocid="checkout.submit_button"
              >
                {placeOrder.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
