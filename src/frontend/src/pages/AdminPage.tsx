import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import {
  useAddProduct,
  useDeleteProduct,
  useOrders,
  useProducts,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";

const ADMIN_PASSWORD = "admin123";
const CATEGORIES = ["Milk", "Butter", "Yogurt", "Cheese"];
const STATUSES = ["Pending", "Delivered", "Cancelled"];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

type ProductForm = {
  name: string;
  description: string;
  priceCents: string;
  imageUrl: string;
  category: string;
  inStock: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  priceCents: "",
  imageUrl: "",
  category: "Milk",
  inStock: true,
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: orders = [], isLoading: loadingOrders } = useOrders();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateStatus = useUpdateOrderStatus();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError("");
    } else {
      setPwError("Incorrect password");
    }
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowProductForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description,
      priceCents: (Number(p.priceCents) / 100).toFixed(2),
      imageUrl: p.imageUrl,
      category: p.category,
      inStock: p.inStock,
    });
    setFormErrors({});
    setShowProductForm(true);
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name required";
    if (!form.description.trim()) e.description = "Description required";
    const price = Number.parseFloat(form.priceCents);
    if (Number.isNaN(price) || price <= 0) e.priceCents = "Enter a valid price";
    if (!form.category) e.category = "Category required";
    return e;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    const priceCents = BigInt(
      Math.round(Number.parseFloat(form.priceCents) * 100),
    );
    try {
      if (editProduct) {
        await updateProduct.mutateAsync({
          ...editProduct,
          name: form.name,
          description: form.description,
          priceCents,
          imageUrl: form.imageUrl,
          category: form.category,
          inStock: form.inStock,
        });
        toast.success("Product updated");
      } else {
        await addProduct.mutateAsync({
          name: form.name,
          description: form.description,
          priceCents,
          imageUrl: form.imageUrl,
          category: form.category,
          inStock: form.inStock,
        });
        toast.success("Product added");
      }
      setShowProductForm(false);
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleStatusChange = async (orderId: bigint, status: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const isSaving = addProduct.isPending || updateProduct.isPending;

  if (!authed) {
    return (
      <main className="flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl shadow-card p-8 w-full max-w-sm"
          data-ocid="admin.dialog"
        >
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold font-display">Admin Access</h1>
            <p className="text-muted-foreground text-sm text-center">
              Enter the admin password to continue
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="admin-pw">Password</Label>
              <Input
                id="admin-pw"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Enter password"
                data-ocid="admin.password.input"
              />
              {pwError && (
                <p
                  className="text-destructive text-xs"
                  data-ocid="admin.password.error_state"
                >
                  {pwError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:opacity-90"
              data-ocid="admin.login.button"
            >
              Login
            </Button>
          </form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold font-display mb-1">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mb-8">Manage products and orders</p>

        <Tabs defaultValue="products" data-ocid="admin.panel">
          <TabsList className="mb-6">
            <TabsTrigger value="products" data-ocid="admin.products.tab">
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" data-ocid="admin.orders.tab">
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">
                Product Catalog ({products.length})
              </h2>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:opacity-90"
                onClick={openAdd}
                data-ocid="admin.add_product.button"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            </div>
            {loadingProducts ? (
              <div
                className="text-center py-10"
                data-ocid="admin.products.loading_state"
              >
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table data-ocid="admin.products.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p, i) => (
                      <TableRow
                        key={p.id.toString()}
                        data-ocid={`admin.products.row.${i + 1}`}
                      >
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.category}</Badge>
                        </TableCell>
                        <TableCell className="text-primary font-semibold">
                          ${(Number(p.priceCents) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              p.inStock
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {p.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                              data-ocid={`admin.products.edit_button.${i + 1}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                              data-ocid={`admin.products.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <h2 className="font-semibold mb-4">All Orders ({orders.length})</h2>
            {loadingOrders ? (
              <div
                className="text-center py-10"
                data-ocid="admin.orders.loading_state"
              >
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div
                className="text-center py-16"
                data-ocid="admin.orders.empty_state"
              >
                <p className="text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table data-ocid="admin.orders.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o, i) => (
                      <TableRow
                        key={o.id.toString()}
                        data-ocid={`admin.orders.row.${i + 1}`}
                      >
                        <TableCell className="font-mono text-sm">
                          #{o.id.toString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{o.customerName}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {o.customerAddress}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {o.customerPhone}
                        </TableCell>
                        <TableCell className="text-primary font-semibold">
                          ${(Number(o.totalAmount) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              STATUS_COLORS[o.status] ??
                              "bg-muted text-muted-foreground"
                            }
                          >
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={o.status}
                            onValueChange={(v) => handleStatusChange(o.id, v)}
                          >
                            <SelectTrigger
                              className="w-32 h-8 text-xs"
                              data-ocid={`admin.orders.status.select.${i + 1}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent
          className="max-w-md"
          data-ocid="admin.product_form.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                data-ocid="admin.product_form.name.input"
              />
              {formErrors.name && (
                <p
                  className="text-destructive text-xs"
                  data-ocid="admin.product_form.name.error_state"
                >
                  {formErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                data-ocid="admin.product_form.description.input"
              />
              {formErrors.description && (
                <p className="text-destructive text-xs">
                  {formErrors.description}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.priceCents}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priceCents: e.target.value }))
                }
                data-ocid="admin.product_form.price.input"
              />
              {formErrors.priceCents && (
                <p className="text-destructive text-xs">
                  {formErrors.priceCents}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, imageUrl: e.target.value }))
                }
                data-ocid="admin.product_form.image.input"
              />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger data-ocid="admin.product_form.category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.inStock}
                onCheckedChange={(v) => setForm((p) => ({ ...p, inStock: v }))}
                data-ocid="admin.product_form.in_stock.switch"
              />
              <Label>In Stock</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductForm(false)}
                data-ocid="admin.product_form.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                disabled={isSaving}
                data-ocid="admin.product_form.save_button"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}
                {editProduct ? "Save Changes" : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
