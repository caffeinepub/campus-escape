import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderItem, Product } from "../backend.d";
import { useActor } from "./useActor";

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      customerName,
      customerPhone,
      customerAddress,
      items,
      totalAmount,
    }: {
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      items: OrderItem[];
      totalAmount: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.placeOrder(
        customerName,
        customerPhone,
        customerAddress,
        items,
        totalAmount,
      );
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Product, "id">) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addProduct(
        p.name,
        p.description,
        p.priceCents,
        p.imageUrl,
        p.category,
        p.inStock,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Product) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateProduct(
        p.id,
        p.name,
        p.description,
        p.priceCents,
        p.imageUrl,
        p.category,
        p.inStock,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteProduct(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: { orderId: bigint; status: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
