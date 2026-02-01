"use client";

import { StoreRecommendation as StoreRecommendationType } from "@/lib/types";
import { Store, MapPin, TrendingDown, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";

interface Props {
    recommendation: StoreRecommendationType;
}

export default function StoreRecommendation({ recommendation }: Props) {
    const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

    const toggleStore = (storeName: string) => {
        const newExpanded = new Set(expandedStores);
        if (newExpanded.has(storeName)) {
            newExpanded.delete(storeName);
        } else {
            newExpanded.add(storeName);
        }
        setExpandedStores(newExpanded);
    };

    const { primaryStore, secondaryStores, totalSavings, isMultiStore } = recommendation;

    if (primaryStore.itemsAvailable === 0) {
        return (
            <div className="glass rounded-3xl p-8 text-center border-2 border-red-200 shadow-xl">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-red-600 font-bold text-xl mb-2">No encontramos resultados</p>
                <p className="text-red-500 text-sm">Probá con otros términos o ampliá el radio de búsqueda</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in-up">
            {/* Primary Store Card - Ultra Modern */}
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>

                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>

                {/* Content */}
                <div className="relative p-6 text-white">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white/90 text-xs font-bold uppercase tracking-wider mb-1">
                                {isMultiStore ? "Mejor Opción Principal" : "🏆 Mejor Opción"}
                            </p>
                            <h3 className="text-2xl font-extrabold">{primaryStore.storeName}</h3>
                        </div>
                    </div>

                    {/* Coverage Bar */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-full h-4 mb-4 overflow-hidden border border-white/30">
                        <div
                            className="bg-gradient-to-r from-white to-white/80 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                            style={{ width: `${primaryStore.coverage}%` }}
                        >
                            <span className="text-xs font-bold text-indigo-600">{Math.round(primaryStore.coverage)}%</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-5 text-sm">
                        <span className="font-semibold">
                            {primaryStore.itemsAvailable} de {primaryStore.totalItems} productos
                        </span>
                    </div>

                    {/* Price and Distance Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                            <p className="text-white/80 text-xs font-semibold mb-1">Total</p>
                            <p className="text-2xl font-extrabold">${primaryStore.totalPrice.toLocaleString('es-AR')}</p>
                        </div>
                        {primaryStore.averageDistance && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                <p className="text-white/80 text-xs font-semibold mb-1">Distancia</p>
                                <p className="text-2xl font-extrabold flex items-center gap-1">
                                    <MapPin size={18} />
                                    {primaryStore.averageDistance.toFixed(1)} km
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Savings Badge */}
                    {isMultiStore && totalSavings && totalSavings > 0 && (
                        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                            <TrendingDown size={22} />
                            <span className="font-bold text-sm">
                                Ahorrás ${totalSavings.toLocaleString('es-AR')} en múltiples tiendas
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Multi-Store Strategy */}
            {isMultiStore && secondaryStores && secondaryStores.length > 0 && (
                <div className="glass rounded-3xl p-6 shadow-xl border border-white/30">
                    <h4 className="text-lg font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                        <Store size={20} className="text-indigo-600" />
                        Estrategia Multi-Tienda
                    </h4>

                    <div className="space-y-3">
                        {secondaryStores.slice(0, 3).map((store) => (
                            <div key={store.storeName} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-indigo-200 transition-colors">
                                <button
                                    onClick={() => toggleStore(store.storeName)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gradient-to-r from-indigo-400 to-purple-500 p-2 rounded-xl">
                                            <Store size={18} className="text-white" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-800 text-sm">{store.storeName}</p>
                                            <p className="text-xs text-gray-500">
                                                {store.itemsAvailable} {store.itemsAvailable === 1 ? 'item' : 'items'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="font-extrabold text-gray-800 text-sm">
                                            ${store.totalPrice.toLocaleString('es-AR')}
                                        </p>
                                        {expandedStores.has(store.storeName) ? (
                                            <ChevronUp size={20} className="text-gray-400" />
                                        ) : (
                                            <ChevronDown size={20} className="text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {expandedStores.has(store.storeName) && (
                                    <div className="px-4 pb-4 space-y-2 bg-gradient-to-b from-gray-50 to-white">
                                        {store.availableProducts.slice(0, 5).map(({ term, product }) => (
                                            <div key={product.id} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                                <span className="text-gray-600 truncate flex-1 font-medium">{product.name}</span>
                                                <span className="font-bold text-gray-800 ml-2">
                                                    ${product.price.toLocaleString('es-AR')}
                                                </span>
                                            </div>
                                        ))}
                                        {store.availableProducts.length > 5 && (
                                            <p className="text-xs text-gray-400 italic pt-2">
                                                +{store.availableProducts.length - 5} más
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
