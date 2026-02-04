import React, { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';

export interface FilterState {
    stores: string[];
    minPrice: number;
    maxPrice: number;
    categories: string[];
}

export interface CategoryInfo {
    name: string;
    count: number;
}

interface SidebarFiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    availableCategories: CategoryInfo[];
    isOpenMobile?: boolean;
    onCloseMobile?: () => void;
}

const STORES = [
    { id: 'vea', label: 'Vea' },
    { id: 'atomo', label: 'Átomo' },
    { id: 'carrefour', label: 'Carrefour' }
];

export function SidebarFilters({ filters, onFilterChange, availableCategories, isOpenMobile, onCloseMobile }: SidebarFiltersProps) {
    const handleStoreChange = (storeId: string) => {
        const newStores = filters.stores.includes(storeId)
            ? filters.stores.filter(s => s !== storeId)
            : [...filters.stores, storeId];
        onFilterChange({ ...filters, stores: newStores });
    };

    const handleCategoryChange = (category: string) => {
        const newCategories = filters.categories.includes(category)
            ? filters.categories.filter(c => c !== category)
            : [...filters.categories, category];
        onFilterChange({ ...filters, categories: newCategories });
    };

    const handlePriceChange = (type: 'min' | 'max', value: string) => {
        const numVal = value === '' ? 0 : parseInt(value, 10);
        if (type === 'min') onFilterChange({ ...filters, minPrice: numVal });
        else onFilterChange({ ...filters, maxPrice: numVal });
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpenMobile && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onCloseMobile}
                />
            )}

            {/* Sidebar Content */}
            <div className={`
                fixed lg:sticky lg:top-24 top-0 left-0 h-full lg:h-[calc(100vh-6rem)]
                w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
                ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                lg:shadow-none shadow-xl overflow-y-auto
                p-5
                scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent
            `}>
                <div className="flex items-center justify-between lg:hidden mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Filter size={20} /> Filtros
                    </h2>
                    <button onClick={onCloseMobile} className="p-1 hover:bg-gray-100 rounded">
                        <X size={24} />
                    </button>
                </div>

                <div className="hidden lg:block mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
                </div>

                {/* Supermarket Filter */}
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Supermercado</h3>
                    <div className="space-y-3">
                        {STORES.map(store => (
                            <label key={store.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer appearance-none h-5 w-5 border border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                                        checked={filters.stores.includes(store.id)}
                                        onChange={() => handleStoreChange(store.id)}
                                    />
                                    <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none hidden peer-checked:block left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 12 10" fill="none">
                                        <path d="M1 5L4.5 8.5L11 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">{store.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {availableCategories.length > 0 && (
                    <>
                        <div className="border-t border-gray-100 my-6"></div>
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Categorías</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                {availableCategories
                                    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
                                    .map(cat => (
                                        <label key={cat.name} className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer appearance-none h-5 w-5 border border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                                                    checked={filters.categories.includes(cat.name)}
                                                    onChange={() => handleCategoryChange(cat.name)}
                                                />
                                                <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none hidden peer-checked:block left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 12 10" fill="none">
                                                    <path d="M1 5L4.5 8.5L11 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <div className="flex items-center justify-between flex-1 min-w-0 pr-2">
                                                <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors whitespace-nowrap overflow-hidden text-ellipsis mr-2" title={cat.name}>
                                                    {cat.name}
                                                </span>
                                                <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                                                    {cat.count}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="border-t border-gray-100 my-6"></div>

                {/* Price Range Filter */}
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Gama de Precios</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice || ''}
                                onChange={(e) => handlePriceChange('min', e.target.value)}
                                className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice || ''}
                                onChange={(e) => handlePriceChange('max', e.target.value)}
                                className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Apply Button (Mobile only mostly, but good to have) */}
                <button
                    onClick={() => {
                        // Logic to apply filters if separate from state change
                        if (onCloseMobile) onCloseMobile();
                    }}
                    className="w-full bg-blue-600 text-white font-medium py-3 rounded-md hover:bg-blue-700 transition-colors lg:hidden"
                >
                    Ver Resultados
                </button>
            </div>
        </>
    );
}
