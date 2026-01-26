"use client";

import { useState, useEffect, useRef } from "react";
import { ListItem, Product } from "@/lib/types";
import ProductInput from "./ProductInput";
import { Search, Check, ChevronRight, Store, AlertCircle, MapPin } from "lucide-react";
import ProductSelector from "./ProductSelector";

export default function ShoppingList() {
    const [items, setItems] = useState<ListItem[]>([]);
    const [viewingItemId, setViewingItemId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Use a ref to track which IDs are currently being searched to avoid double triggers
    const searchingIds = useRef<Set<string>>(new Set());

    // Hydration + Geo check
    useEffect(() => {
        setMounted(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoords({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (err) => console.log("Geolocation permission denied or error:", err.message),
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
            );
        }
    }, []);

    // Derived state for the modal
    const viewingItem = items.find(i => i.id === viewingItemId) || null;

    const addItem = (term: string) => {
        const id = Math.random().toString(36).substring(2, 11);
        setItems(prev => [{
            id,
            term: term.trim(),
            status: 'PENDING'
        }, ...prev]);
    };

    const toggleComplete = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id
                ? { ...item, status: item.status === 'COMPLETED' ? 'FOUND' : 'COMPLETED' }
                : item
        ));
    };

    const handleSelectProduct = (product: Product) => {
        if (!viewingItemId) return;
        setItems(prev => prev.map(item =>
            item.id === viewingItemId
                ? {
                    ...item,
                    selectedProduct: product,
                    searchSummary: `Seleccionado: $${product.price.toLocaleString('es-AR')}`
                }
                : item
        ));
        setViewingItemId(null);
    };

    // Robust Search Effect
    useEffect(() => {
        if (!mounted) return;

        // Find items that need searching and are not currently in-flight
        const itemToSearch = items.find(i =>
            (i.status === 'PENDING' || i.status === 'SEARCHING') &&
            !searchingIds.current.has(i.id)
        );

        if (!itemToSearch) return;

        searchingIds.current.add(itemToSearch.id);

        const runSearch = async () => {
            try {
                if (itemToSearch.status === 'PENDING') {
                    setItems(prev => prev.map(i => i.id === itemToSearch.id ? { ...i, status: 'SEARCHING' } : i));
                }

                const geoParams = coords ? `&lat=${coords.lat}&lng=${coords.lng}` : '';
                const res = await fetch(`/api/search?q=${encodeURIComponent(itemToSearch.term)}${geoParams}&t=${Date.now()}`);
                const result = await res.json();
                const { data, source } = result;

                setItems(prev => prev.map(i => {
                    if (i.id !== itemToSearch.id) return i;

                    if (data && Array.isArray(data) && data.length > 0) {
                        const bestPrice = data[0].price; // Already sorted by relevance/price in DB
                        return {
                            ...i,
                            status: 'FOUND',
                            searchSummary: `${data.length} opciones desde $${bestPrice.toLocaleString('es-AR')}`,
                            source,
                            foundProducts: data
                        } as ListItem;
                    } else {
                        return { ...i, status: 'NOT_FOUND' } as ListItem;
                    }
                }));
            } catch (err) {
                console.error(`[Search] Error:`, err);
                setItems(prev => prev.map(i =>
                    i.id === itemToSearch.id ? { ...i, status: 'ERROR' } as ListItem : i
                ));
            } finally {
                setTimeout(() => {
                    searchingIds.current.delete(itemToSearch.id);
                }, 500);
            }
        };

        runSearch();
    }, [items, mounted, coords]);

    if (!mounted) return (
        <div className="flex flex-col items-center justify-center p-20 opacity-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p>Cargando lista...</p>
        </div>
    );

    return (
        <div className="max-w-md mx-auto px-4 pb-20">
            <ProductInput onAdd={addItem} />

            {/* Location Status Indicator */}
            {coords && (
                <div className="flex items-center gap-2 text-emerald-600 justify-center mb-6 text-xs font-semibold bg-emerald-50 py-2 rounded-full border border-emerald-100 animate-in fade-in zoom-in duration-500">
                    <MapPin size={12} className="fill-emerald-600/20" />
                    <span>Ubicación activada: Priorizando tiendas cercanas</span>
                </div>
            )}

            <div className="space-y-4 mt-4">
                {items.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <p className="text-5xl mb-4 grayscale opacity-50">🛒</p>
                        <p className="text-gray-400 font-medium italic">Tu lista está vacía</p>
                    </div>
                )}

                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`overflow-hidden transition-all duration-300 rounded-[2.5rem] border ${item.status === 'COMPLETED'
                            ? 'bg-gray-50 border-gray-100 opacity-60 scale-[0.98]'
                            : 'bg-white border-gray-200 shadow-lg'
                            }`}
                    >
                        <div className="p-5 flex items-center gap-4">
                            {/* Checkbox */}
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleComplete(item.id); }}
                                className={`shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${item.status === 'COMPLETED'
                                    ? 'bg-[var(--secondary)] border-[var(--secondary)] text-white shadow-inner'
                                    : 'border-gray-200 text-transparent hover:border-[var(--secondary)] hover:bg-gray-50'
                                    }`}
                            >
                                <Check size={28} strokeWidth={3} />
                            </button>

                            {/* Info Area */}
                            <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => item.status === 'FOUND' && setViewingItemId(item.id)}
                            >
                                <h3 className={`font-bold text-xl truncate tracking-tight ${item.status === 'COMPLETED' ? 'line-through text-gray-400 font-medium' : 'text-gray-800'}`}>
                                    {item.selectedProduct ? item.selectedProduct.name : item.term}
                                </h3>

                                <div className="mt-1 flex flex-col gap-1">
                                    {item.status === 'SEARCHING' && (
                                        <span className="text-sm text-[var(--primary)] flex items-center gap-1.5 animate-pulse font-bold">
                                            <Search size={16} /> Buscando...
                                        </span>
                                    )}

                                    {item.status === 'NOT_FOUND' && (
                                        <span className="text-sm text-red-400 flex items-center gap-1.5 font-bold italic">
                                            <AlertCircle size={16} /> No encontrado
                                        </span>
                                    )}

                                    {item.status === 'FOUND' && (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm text-gray-500 font-semibold">
                                                {item.searchSummary}
                                            </span>
                                            {item.selectedProduct && (
                                                <div className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-bold">
                                                    <Store size={14} />
                                                    <span className="truncate">{item.selectedProduct.store}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Arrow Action */}
                            {item.status === 'FOUND' && (
                                <button
                                    onClick={() => setViewingItemId(item.id)}
                                    className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all active:scale-90"
                                >
                                    <ChevronRight size={28} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {mounted && viewingItem && (
                <ProductSelector
                    term={viewingItem.term}
                    products={viewingItem.foundProducts || []}
                    open={!!viewingItemId}
                    onClose={() => setViewingItemId(null)}
                    onSelect={handleSelectProduct}
                />
            )}
        </div>
    );
}
