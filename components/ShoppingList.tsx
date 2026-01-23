"use client";

import { useState, useEffect } from "react";
import { ListItem, Product } from "@/lib/types";
import ProductInput from "./ProductInput";
import { Search, Check, ChevronRight } from "lucide-react";

export default function ShoppingList() {
    const [items, setItems] = useState<ListItem[]>([]);

    const addItem = (term: string) => {
        const newItem: ListItem = {
            id: Date.now().toString(),
            term: term,
            status: 'PENDING', // Will trigger search effect later
        };
        setItems((prev) => [newItem, ...prev]);
        // TODO: Trigger API Search here
    };

    const toggleComplete = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id
                ? { ...item, status: item.status === 'COMPLETED' ? 'FOUND' : 'COMPLETED' }
                : item
        ));
    };

    // Search Effect
    useEffect(() => {
        items.forEach(async (item) => {
            if (item.status === 'PENDING') {
                // Mark as searching to prevent double triggers
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'SEARCHING' } : i));

                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(item.term)}`);
                    const { data, source } = await res.json();

                    if (data && data.length > 0) {
                        const bestPrice = Math.min(...data.map((p: Product) => p.price));
                        const count = data.length;

                        setItems(prev => prev.map(i =>
                            i.id === item.id
                                ? {
                                    ...i,
                                    status: 'FOUND',
                                    searchSummary: `${count} opciones desde $${bestPrice}`,
                                    source // Store source for debug/verification
                                } as ListItem
                                : i
                        ));
                    }
                } catch (error) {
                    console.error("Search failed", error);
                }
            }
        });
    }, [items]);

    return (
        <div>
            <ProductInput onAdd={addItem} />

            <div className="space-y-3">
                {items.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-4xl mb-2">🍎</p>
                        <p className="text-lg">Tu lista está vacía.</p>
                    </div>
                )}

                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`card flex items-center gap-3 transition-opacity ${item.status === "COMPLETED" ? "opacity-60 bg-gray-50" : "bg-white"
                            }`}
                    >
                        {/* Checkbox / Status Indicator */}
                        <button
                            onClick={() => toggleComplete(item.id)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${item.status === "COMPLETED"
                                ? "bg-[var(--secondary)] border-[var(--secondary)] text-white"
                                : "border-gray-300 text-transparent"
                                }`}
                        >
                            <Check size={20} />
                        </button>

                        {/* Content */}
                        <div className="flex-1">
                            <h3 className={`font-semibold text-lg leading-tight ${item.status === "COMPLETED" ? "line-through text-gray-400" : ""
                                }`}>
                                {item.selectedProduct ? item.selectedProduct.name : item.term}
                            </h3>

                            {/* Status Text */}
                            {item.status !== "COMPLETED" && (
                                <div className="text-sm mt-1">
                                    {item.status === 'SEARCHING' && <span className="text-gray-400 flex items-center gap-1 animate-pulse"><Search size={14} /> Buscando...</span>}
                                    {item.status === 'PENDING' && <span className="text-gray-400 flex items-center gap-1"><Search size={14} /> Esperando...</span>}
                                    {item.status === 'FOUND' && (
                                        <div className="flex flex-col">
                                            <span className="text-[var(--secondary-foreground)] font-medium">
                                                {item.searchSummary}
                                            </span>
                                            {/* Debug Info for User Verification */}
                                            {/* @ts-ignore */}
                                            {item.source && (
                                                <span className="text-xs text-gray-400">
                                                    { /* @ts-ignore */}
                                                    {item.source === 'CACHE' ? '⚡ De Memoria' : '🌍 De Internet'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Icon */}
                        {item.status === 'FOUND' && (
                            <button className="p-2 text-gray-400">
                                <ChevronRight />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
