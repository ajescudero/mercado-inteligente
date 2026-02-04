import React, { useRef, useEffect, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { X, Trash2, ShoppingBag, Minus, Plus, TrendingDown } from 'lucide-react';
import { OptimizationModal } from './OptimizationModal';

export function CartDrawer() {
    const { items, removeItem, updateQuantity, totalPrice, isOpen, setIsOpen, clearCart } = useCart();
    const [isOptimizeOpen, setIsOptimizeOpen] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, setIsOpen]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingBag size={24} /> Mi Carrito
                        {items.length > 0 && (
                            <span className="text-sm font-normal text-gray-500">({items.length})</span>
                        )}
                    </h2>
                    <div className="flex items-center gap-2">
                        {items.length > 0 && (
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="p-2 hover:bg-red-50 rounded-full transition-colors text-gray-500 hover:text-red-600"
                                title="Vaciar carrito"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-800"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <ShoppingBag size={64} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Tu carrito está vacío</p>
                            <p className="text-sm">¡Empieza a agregar productos!</p>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="mt-6 text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Volver a la tienda
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={`${item.store}-${item.id}`} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 relative group">
                                {/* Image */}
                                <div className="w-20 h-20 bg-white rounded-md flex items-center justify-center p-2 border border-gray-200 shrink-0">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <ShoppingBag size={24} className="text-gray-300" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-grow min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">{item.name}</h3>
                                            <button
                                                onClick={() => removeItem(item.id, item.store)}
                                                className="text-gray-400 hover:text-red-500 -mt-1 -mr-1 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 uppercase">{item.store}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <p className="font-bold text-gray-900">{formatPrice(item.price)}</p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center bg-white border border-gray-300 rounded-md h-8">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.store, item.quantity - 1)}
                                                className="w-8 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.store, item.quantity + 1)}
                                                className="w-8 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        {/* Store Breakdown */}
                        <div className="mb-4 space-y-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resumen por Supermercado</h3>
                            {Object.entries(
                                items.reduce((acc, item) => {
                                    acc[item.store] = (acc[item.store] || 0) + (item.price * item.quantity);
                                    return acc;
                                }, {} as Record<string, number>)
                            ).map(([store, total]) => (
                                <div key={store} className="flex justify-between text-sm">
                                    <span className="capitalize text-gray-700">{store}</span>
                                    <span className="font-medium">{formatPrice(total)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 my-3"></div>

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-900 font-bold">Total Estimado</span>
                            <span className="text-2xl font-bold text-blue-600">{formatPrice(totalPrice)}</span>
                        </div>
                        <button
                            onClick={() => setIsOptimizeOpen(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-blue-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <TrendingDown size={20} className="relative z-10" />
                            <span className="relative z-10">Optimizar Compra</span>
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-2">
                            Los precios son estimados y pueden variar en caja.
                        </p>
                    </div>
                )}
            </div>

            {/* Clear Cart Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">¿Vaciar carrito?</h3>
                                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Se eliminarán {items.length} {items.length === 1 ? 'producto' : 'productos'} del carrito.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    clearCart();
                                    setShowClearConfirm(false);
                                }}
                                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                Vaciar Carrito
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Optimization Modal */}
            <OptimizationModal
                isOpen={isOptimizeOpen}
                onClose={() => setIsOptimizeOpen(false)}
            />
        </>
    );
}
