"use client";

import { Product } from "@/lib/types";
import { X, Store, MapPin, Clock, Zap } from "lucide-react";

interface ProductSelectorProps {
    term: string;
    products: Product[];
    open: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
}

// Helper to format timestamp
function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${Math.floor(diffHours / 24)}d`;
}

// Helper to determine if source is real-time
function isRealTimeSource(source?: string): boolean {
    return source === 'vea' || source === 'atomo' || source === 'carrefour';
}

export default function ProductSelector({ term, products, open, onClose, onSelect }: ProductSelectorProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
            {/* Modal/Sheet */}
            <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[80vh] rounded-t-[2rem] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">

                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Opciones para &quot;{term}&quot;</h2>
                        <p className="text-sm text-gray-500">{products.length} resultados encontrados</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {products.map((product) => {
                        const isRealTime = isRealTimeSource(product.source);

                        return (
                            <div
                                key={product.id}
                                onClick={() => onSelect(product)}
                                className="group border rounded-2xl p-4 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 cursor-pointer transition-all active:scale-[0.98] flex gap-4"
                            >
                                {/* Product Image */}
                                <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-1"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    ) : (
                                        <span className="text-2xl grayscale">📦</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1 gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-[var(--primary)] transition-colors">
                                                {product.name}
                                            </h3>
                                            {/* Data Source Badge */}
                                            {isRealTime && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                                                        <Zap size={10} />
                                                        En Vivo
                                                    </span>
                                                    {product.updated && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                                                            <Clock size={10} />
                                                            {formatTimestamp(product.updated)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-bold text-lg text-[var(--primary)] shrink-0">
                                            ${product.price.toLocaleString('es-AR')}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Store size={12} className="text-gray-400" />
                                            <span className="font-medium text-gray-700">{product.store}</span>
                                        </div>
                                        {product.address && (
                                            <div className="flex items-center gap-1">
                                                <MapPin size={12} className="text-gray-400" />
                                                <span className="truncate">{product.address}{product.locality ? `, ${product.locality}` : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Gradient Hint */}
                <div className="h-4 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none shrink-0" />
            </div>
        </div>
    );
}
