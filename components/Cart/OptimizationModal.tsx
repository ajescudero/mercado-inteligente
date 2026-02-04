import React, { useState, useEffect } from 'react';
import { X, TrendingDown, Store, Check, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { useCart, CartItem } from '@/lib/cart-context';
import { Product } from '@/server/supermarkets/types';

interface EquivalentResult {
    original: CartItem;
    equivalents: Product[];
}

interface Scenario {
    id: 'convenience' | 'max-savings' | 'balanced';
    name: string;
    description: string;
    total: number;
    savings: number;
    stores: string[];
    mapping: Record<string, Product>; // original.id-store -> best product in this scenario
}

export function OptimizationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { items, clearCart, addItem } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<EquivalentResult[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

    useEffect(() => {
        if (isOpen && items.length > 0) {
            runOptimization();
        }
    }, [isOpen]);

    const runOptimization = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/products/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            const data = await response.json();
            setResults(data.results);
            calculateScenarios(data.results);
        } catch (error) {
            console.error('Optimization failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateScenarios = (data: EquivalentResult[]) => {
        const stores = ['vea', 'atomo', 'carrefour'];
        const currentTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const newScenarios: Scenario[] = [];

        // 1. Max Savings (Best Price everywhere)
        let maxSavingTotal = 0;
        const maxSavingMapping: Record<string, Product> = {};
        data.forEach(res => {
            const best = [...res.equivalents, res.original].sort((a, b) => a.price - b.price)[0];
            maxSavingMapping[`${res.original.id}-${res.original.store}`] = best;
            maxSavingTotal += best.price * res.original.quantity;
        });

        newScenarios.push({
            id: 'max-savings',
            name: 'Ahorro Máximo',
            description: 'Compra cada producto donde esté más barato. Máximo ahorro, múltiples viajes.',
            total: maxSavingTotal,
            savings: currentTotal - maxSavingTotal,
            stores: Array.from(new Set(Object.values(maxSavingMapping).map(p => p.store))),
            mapping: maxSavingMapping
        });

        // 2. Best Single Store
        stores.forEach(storeId => {
            let storeTotal = 0;
            const storeMapping: Record<string, Product> = {};
            let isPossible = true;

            data.forEach(res => {
                const inStore = res.equivalents.find(p => p.store === storeId) || (res.original.store === storeId ? res.original : null);
                if (inStore) {
                    storeMapping[`${res.original.id}-${res.original.store}`] = inStore;
                    storeTotal += inStore.price * res.original.quantity;
                } else {
                    // If product doesn't exist in this store, we can't do full monostore
                    // or we use original price as fallback. Let's use fallback but note it.
                    storeMapping[`${res.original.id}-${res.original.store}`] = res.original;
                    storeTotal += res.original.price * res.original.quantity;
                    if (res.original.store !== storeId) isPossible = false;
                }
            });

            // Always show all single-store options, even if they don't save money
            // Users might prefer a specific store for convenience (location, preference, etc.)
            newScenarios.push({
                id: 'convenience',
                name: `Todo en ${storeId.toUpperCase()}`,
                description: `Comodidad de comprar todo en un solo lugar.`,
                total: storeTotal,
                savings: currentTotal - storeTotal,
                stores: [storeId],
                mapping: storeMapping
            });
        });

        setScenarios(newScenarios.sort((a, b) => b.savings - a.savings));
        if (newScenarios.length > 0) setSelectedScenario(newScenarios[0]);
    };

    const applyScenario = () => {
        if (!selectedScenario) return;

        // Extract new products with their quantities
        const newItems: { product: Product, quantity: number }[] = [];
        results.forEach(res => {
            const optimized = selectedScenario.mapping[`${res.original.id}-${res.original.store}`];
            newItems.push({ product: optimized, quantity: res.original.quantity });
        });

        clearCart();
        newItems.forEach(item => {
            addItem(item.product, item.quantity);
        });
        onClose();
    };

    if (!isOpen) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-6">
            <div className="bg-white w-full max-w-2xl max-h-full overflow-hidden rounded-2xl shadow-2xl flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <TrendingDown className="text-green-600" /> Optimizar mi Compra
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Encontramos mejores precios para tu lista actual.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                            <p className="text-gray-600 font-medium animate-pulse">Analizando precios en la competencia...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Scenarios List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {scenarios.map(scenario => (
                                    <button
                                        key={scenario.id + (scenario.stores[0] || '')}
                                        onClick={() => setSelectedScenario(scenario)}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-start text-left gap-2 ${selectedScenario === scenario
                                            ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex justify-between w-full">
                                            <span className="font-bold text-gray-900">{scenario.name}</span>
                                            {selectedScenario === scenario && <Check size={18} className="text-blue-600" />}
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">{scenario.description}</p>
                                        <div className="mt-2 text-lg font-black text-blue-600">
                                            {formatPrice(scenario.total)}
                                        </div>
                                        <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                            Ahorras {formatPrice(scenario.savings)}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Item Comparison */}
                            {selectedScenario && (
                                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Comparativa de items
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {results.map(res => {
                                            const optimized = selectedScenario.mapping[`${res.original.id}-${res.original.store}`];
                                            const isDifferent = optimized.id !== res.original.id || optimized.store !== res.original.store;

                                            return (
                                                <div key={res.original.id} className="p-3 flex items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{res.original.name}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase">{res.original.store} → {optimized.store}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-sm font-bold ${isDifferent ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {formatPrice(optimized.price)}
                                                        </span>
                                                        {isDifferent && (
                                                            <span className="text-[10px] text-gray-300 line-through">
                                                                {formatPrice(res.original.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="hidden sm:block">
                        {selectedScenario && (
                            <div className="flex items-center gap-2 text-green-600 font-bold">
                                <TrendingDown size={20} />
                                <span>Total Ahorro: {formatPrice(selectedScenario.savings)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-3 font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={applyScenario}
                            disabled={!selectedScenario || isLoading}
                            className="flex-1 sm:flex-none px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Analizando...' : 'Aplicar Ahorro'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
