"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/server/supermarkets/types";

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

    // Load from local storage
    useEffect(() => {
        const savedCart = localStorage.getItem("shopping-cart");
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from local storage", e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save to local storage
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("shopping-cart", JSON.stringify(items));
        }
    }, [items, isInitialized]);

    const addItem = (product: Product, quantity: number = 1) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.id === product.id && i.store === product.store);
            if (existing) {
                return prev.map((i) =>
                    i.id === product.id && i.store === product.store
                        ? { ...i, quantity: i.quantity + quantity }
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
