"use client";

import { useState, useEffect } from "react";
import { ListItem, Product, StoreRecommendation as StoreRecommendationType, BatchSearchResult } from "@/lib/types";
import ProductInput from "./ProductInput";
import { Search, Check, ChevronRight, Store, AlertCircle, MapPin, Trash2, Sparkles } from "lucide-react";
import ProductSelector from "./ProductSelector";
import StoreRecommendation from "./StoreRecommendation";

export default function ShoppingList() {
    const [items, setItems] = useState<ListItem[]>([]);
    const [viewingItemId, setViewingItemId] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locationName, setLocationName] = useState<string>("");
    const [radius, setRadius] = useState<number>(3);
    const [isSearching, setIsSearching] = useState(false);
    const [storeRecommendation, setStoreRecommendation] = useState<StoreRecommendationType | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setCoords({ lat: latitude, lng: longitude });

                    try {
                        const res = await fetch(`/api/location?lat=${latitude}&lng=${longitude}`);
                        const data = await res.json();
                        if (data.address) setLocationName(data.address);
                    } catch (e) {
                        console.error("Error fetching location name", e);
                    }
                },
                (err) => console.log("Geolocation permission denied or error:", err.message),
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
            );
        }
    }, []);

    const viewingItem = items.find(i => i.id === viewingItemId) || null;

    const addItem = (term: string) => {
        const id = Math.random().toString(36).substring(2, 11);
        setItems(prev => [{
            id,
            term: term.trim(),
            status: 'DRAFT'
        }, ...prev]);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
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

    const handleBatchSearch = async () => {
        const draftItems = items.filter(i => i.status === 'DRAFT');
        if (draftItems.length === 0) return;

        setIsSearching(true);
        setStoreRecommendation(null);

        setItems(prev => prev.map(item =>
            item.status === 'DRAFT' ? { ...item, status: 'SEARCHING' } : item
        ));

        try {
            const terms = draftItems.map(i => i.term);
            const response = await fetch('/api/batch-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    terms,
                    lat: coords?.lat,
                    lng: coords?.lng,
                    radius
                })
            });

            const data = await response.json();
            const { results, recommendation } = data as {
                results: BatchSearchResult[];
                recommendation: StoreRecommendationType;
            };

            setItems(prev => prev.map(item => {
                const result = results.find(r => r.term === item.term);
                if (!result) return item;

                if (result.status === 'FOUND' && result.products.length > 0) {
                    const bestPrice = result.products[0].price;
                    return {
                        ...item,
                        status: 'FOUND' as const,
                        searchSummary: `${result.products.length} opciones desde $${bestPrice.toLocaleString('es-AR')}`,
                        foundProducts: result.products,
                        source: 'DB' as const
                    };
                } else {
                    return { ...item, status: 'NOT_FOUND' as const };
                }
            }));

            setStoreRecommendation(recommendation);
        } catch (error) {
            console.error('Batch search error:', error);
            setItems(prev => prev.map(item =>
                item.status === 'SEARCHING' ? { ...item, status: 'ERROR' } : item
            ));
        } finally {
            setIsSearching(false);
        }
    };

    const draftCount = items.filter(i => i.status === 'DRAFT').length;
    const hasSearched = items.some(i => i.status === 'FOUND' || i.status === 'NOT_FOUND');

    return (
        <div className="max-w-md mx-auto pb-32">
            <ProductInput onAdd={addItem} />

            {/* Location Status with modern glass design */}
            {coords && (
                <div className="mb-6 glass rounded-2xl px-4 py-3 flex items-center gap-3 text-sm font-semibold text-gray-700 shadow-lg animate-fade-in-up">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 p-2 rounded-xl">
                        <MapPin size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="truncate block">{locationName || "Ubicación activada"}</span>
                    </div>
                    <select
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="bg-white/50 border-none outline-none font-bold text-gray-700 cursor-pointer text-sm px-3 py-1 rounded-lg hover:bg-white/70 transition-colors"
                    >
                        <option value={1}>1 km</option>
                        <option value={3}>3 km</option>
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                        <option value={20}>20 km</option>
                        <option value={50}>50 km</option>
                    </select>
                </div>
            )}

            {/* Store Recommendation */}
            {hasSearched && storeRecommendation && (
                <div className="mb-6 animate-fade-in-up">
                    <StoreRecommendation recommendation={storeRecommendation} />
                </div>
            )}

            <div className="space-y-3 mt-4">
                {items.length === 0 && (
                    <div className="text-center py-16 glass rounded-3xl animate-fade-in-up">
                        <div className="text-6xl mb-4 floating">🛒</div>
                        <p className="text-gray-600 font-bold text-lg mb-2">Tu lista está vacía</p>
                        <p className="text-gray-400 text-sm">Agregá productos para comenzar</p>
                    </div>
                )}

                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`overflow-hidden transition-all duration-300 rounded-2xl ${item.status === 'COMPLETED'
                                ? 'glass opacity-60 scale-[0.98]'
                                : item.status === 'DRAFT'
                                    ? 'glass shadow-lg hover:shadow-xl border-2 border-indigo-200'
                                    : 'glass shadow-xl hover:shadow-2xl'
                            }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="p-4 flex items-center gap-3">
                            {/* Modern Checkbox */}
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleComplete(item.id); }}
                                className={`shrink-0 w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all ${item.status === 'COMPLETED'
                                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 border-transparent text-white shadow-lg'
                                        : 'border-gray-300 text-transparent hover:border-indigo-400 hover:bg-indigo-50'
                                    }`}
                            >
                                <Check size={24} strokeWidth={3} />
                            </button>

                            {/* Info Area */}
                            <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => item.status === 'FOUND' && setViewingItemId(item.id)}
                            >
                                <h3 className={`font-bold text-lg truncate ${item.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-800'
                                    }`}>
                                    {item.selectedProduct ? item.selectedProduct.name : item.term}
                                </h3>

                                <div className="mt-1">
                                    {item.status === 'DRAFT' && (
                                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                                            <Sparkles size={14} /> Listo para buscar
                                        </span>
                                    )}

                                    {item.status === 'SEARCHING' && (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-200 border-t-indigo-600"></div>
                                            <span className="text-xs font-bold text-indigo-600">Buscando...</span>
                                        </div>
                                    )}

                                    {item.status === 'NOT_FOUND' && (
                                        <span className="text-xs text-red-500 flex items-center gap-1.5 font-bold">
                                            <AlertCircle size={14} /> No encontrado
                                        </span>
                                    )}

                                    {item.status === 'FOUND' && (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs text-gray-600 font-semibold">
                                                {item.searchSummary}
                                            </span>
                                            {item.selectedProduct && (
                                                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                                                    <Store size={12} />
                                                    <span className="truncate">{item.selectedProduct.store}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {item.status === 'DRAFT' && (
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 transition-all active:scale-90"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}

                            {item.status === 'FOUND' && (
                                <button
                                    onClick={() => setViewingItemId(item.id)}
                                    className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-all active:scale-90"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modern Floating Search Button */}
            {draftCount > 0 && (
                <button
                    onClick={handleBatchSearch}
                    disabled={isSearching}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-base flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-50 pulse-glow"
                >
                    {isSearching ? (
                        <>
                            <div className="animate-spin rounded-full h-6 w-6 border-3 border-white/30 border-t-white"></div>
                            <span>Buscando...</span>
                        </>
                    ) : (
                        <>
                            <Search size={22} />
                            <span>Buscar {draftCount} {draftCount === 1 ? 'producto' : 'productos'}</span>
                        </>
                    )}
                </button>
            )}

            {/* Modal */}
            {viewingItem && (
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
