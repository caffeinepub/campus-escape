import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Order {
    id: bigint;
    customerName: string;
    status: string;
    customerPhone: string;
    customerAddress: string;
    totalAmount: bigint;
    items: Array<OrderItem>;
}
export interface Product {
    id: bigint;
    inStock: boolean;
    name: string;
    description: string;
    imageUrl: string;
    category: string;
    priceCents: bigint;
}
export interface OrderItem {
    productId: bigint;
    quantity: bigint;
}
export interface backendInterface {
    addProduct(name: string, description: string, priceCents: bigint, imageUrl: string, category: string, inStock: boolean): Promise<bigint>;
    deleteProduct(id: bigint): Promise<void>;
    deploy(): Promise<void>;
    getOrder(id: bigint): Promise<Order | null>;
    getOrders(): Promise<Array<Order>>;
    getProduct(id: bigint): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
    placeOrder(customerName: string, customerPhone: string, customerAddress: string, items: Array<OrderItem>, totalAmount: bigint): Promise<bigint>;
    updateOrderStatus(orderId: bigint, newStatus: string): Promise<void>;
    updateProduct(id: bigint, name: string, description: string, priceCents: bigint, imageUrl: string, category: string, inStock: boolean): Promise<void>;
}
