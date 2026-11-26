"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/server/supermarkets/types";
import { catalogCartItems, refreshCatalogCart } from './cart-products';

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: string, storeId: string) => void;
    updateQuantity: (productId: string, storeId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // One client-only hydration from browser storage; the server cannot read it.
    /* eslint-disable react-hooks/set-state-in-effect */
    // Load from local storage
    useEffect(() => {
        let savedCart: string | null = null;
        try { savedCart = localStorage.getItem("shopping-cart"); } catch { /* Storage can be unavailable in private browsing. */ }
        if (savedCart) {
            try {
                const saved = JSON.parse(savedCart);
                if (Array.isArray(saved)) setItems(saved.filter(item => item && typeof item.id === 'string' && Number.isInteger(item.quantity) && item.quantity > 0));
            } catch (e) {
                console.error("Failed to parse cart from local storage", e);
            }
        }
        setIsInitialized(true);
    }, []);

    /* eslint-enable react-hooks/set-state-in-effect */

    // Rehydrate prices/photos/labels from the current catalog, keeping quantities.
    useEffect(() => {
        if (!isInitialized || !items.length) return;
        const catalogItems = catalogCartItems(items);
        if (!catalogItems.length) return;
        const controller = new AbortController();
        fetch('/api/products/refresh', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: catalogItems.slice(0, 100).map(item => item.id) }), signal: controller.signal,
        }).then(async response => {
            if (!response.ok) return;
            const data: { products: { id: string; product: Product | null }[] } = await response.json();
            setItems(previous => refreshCatalogCart(previous, data.products));
        }).catch(() => { /* Retain the saved cart if the local server is unavailable. */ });
        return () => controller.abort();
        // Refresh on hydration and opening the drawer, not on every price update.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInitialized, isOpen]);

    // Save to local storage
    useEffect(() => {
        if (isInitialized) {
            try { localStorage.setItem("shopping-cart", JSON.stringify(items)); } catch { /* Keep the in-memory list usable when storage is unavailable. */ }
        }
    }, [items, isInitialized]);

    const addItem = (product: Product, quantity: number = 1) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.id === product.id && i.store === product.store);
            if (existing) {
                return prev.map((i) =>
                    i.id === product.id && i.store === product.store
                        ? { ...product, quantity: Math.min(999, i.quantity + quantity) }
                        : i
                );
            }
            return [...prev, { ...product, quantity }];
        });
        setIsOpen(true);
    };

    const removeItem = (productId: string, storeId: string) => {
        setItems((prev) => prev.filter((i) => !(i.id === productId && i.store === storeId)));
    };

    const updateQuantity = (productId: string, storeId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId, storeId);
            return;
        }
        setItems((prev) =>
            prev.map((i) =>
                i.id === productId && i.store === storeId ? { ...i, quantity } : i
            )
        );
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
                isOpen,
                setIsOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
