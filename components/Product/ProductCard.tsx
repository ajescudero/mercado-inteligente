import React from 'react';
import { Product } from '@/server/supermarkets/types';
import { useCart } from '@/lib/cart-context';
import { ShoppingCart, Store } from 'lucide-react';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();

    const handleAddToCart = () => {
        addItem(product);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full overflow-hidden group">
            {/* Image Area */}
            <div className="relative h-48 bg-white p-4 flex items-center justify-center">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                ) : (
                    <div className="text-gray-300 flex flex-col items-center">
                        <Store size={48} />
                        <span className="text-xs mt-2">Sin imagen</span>
                    </div>
                )}

                {/* Store Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded uppercase shadow-sm ${product.store === 'vea' ? 'bg-red-600' :
                    product.store === 'carrefour' ? 'bg-blue-600' :
                        product.store === 'atomo' ? 'bg-orange-500' : 'bg-gray-500'
                    }`}>
                    {product.store}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Brand (if available) - mocked for now if missing, or hidden */}
                {product.brand && (
                    <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">
                        {product.brand}
                    </div>
                )}

                {/* Title */}
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 flex-grow" title={product.name}>
                    {product.name}
                </h3>

                {/* Category (if available) */}
                {product.category && (
                    <div className="text-[10px] text-blue-600 font-semibold mb-2 bg-blue-50 px-1.5 py-0.5 rounded-full inline-block self-start">
                        {product.category}
                    </div>
                )}

                {/* Price Section */}
                <div className="mt-auto">
                    <div className="item-price text-xl font-bold text-gray-900">
                        {formatPrice(product.price)}
                    </div>
                    {/* Unit Price (Optional Mock) */}
                    {/* <div className="text-xs text-gray-400 mt-1">$1.200,00 / un</div> */}
                </div>

                {/* Action Button */}
                <button
                    onClick={handleAddToCart}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
                >
                    <ShoppingCart size={16} />
                    Agregar
                </button>
            </div>
        </div>
    );
}
