import React from 'react';
import { Product } from '@/server/supermarkets/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
    products: Product[];
    isLoading?: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gray-100 h-80 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500 text-lg">No se encontraron productos.</p>
                <p className="text-gray-400 text-sm">Prueba con otra búsqueda o ajusta los filtros.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard key={`${product.store}-${product.id}`} product={product} />
            ))}
        </div>
    );
}
