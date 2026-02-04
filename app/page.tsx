"use client";

import React, { useState, useEffect } from 'react';
import { CartProvider } from '@/lib/cart-context';
import { Header } from '@/components/Layout/Header';
import { SidebarFilters, FilterState, CategoryInfo } from '@/components/Layout/SidebarFilters';
import { ProductGrid } from '@/components/Product/ProductGrid';
import { CartDrawer } from '@/components/Cart/CartDrawer';
import { Product } from '@/server/supermarkets/types';
import { Filter, Loader2 } from 'lucide-react';

export default function Home() {
  return (
    <CartProvider>
      <MainContent />
    </CartProvider>
  );
}

function MainContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    stores: [],
    minPrice: 0,
    maxPrice: 0,
    categories: [],
  });

  type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'alpha-asc';
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Initial load - debatable if we want to load anything, maybe just blank or featured
  // For now, let's leave it blank until search.

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Error al buscar productos');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };
  // Dynamic categories with counts
  const availableCategories: CategoryInfo[] = React.useMemo(() => {
    // We filter by store and price to get the categories available in the current selection
    let filteredForCategories = [...products];

    if (filters.stores.length > 0) {
      filteredForCategories = filteredForCategories.filter(p => filters.stores.includes(p.store));
    }

    if (filters.minPrice > 0) {
      filteredForCategories = filteredForCategories.filter(p => p.price >= filters.minPrice);
    }
    if (filters.maxPrice > 0) {
      filteredForCategories = filteredForCategories.filter(p => p.price <= filters.maxPrice);
    }

    const counts: Record<string, number> = {};
    filteredForCategories.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [products, filters.stores, filters.minPrice, filters.maxPrice]);

  // Filter & Sort Logic
  useEffect(() => {
    let result = [...products];

    // Filter by Store
    if (filters.stores.length > 0) {
      result = result.filter(p => filters.stores.includes(p.store));
    }

    // Filter by Price
    if (filters.minPrice > 0) {
      result = result.filter(p => p.price >= filters.minPrice);
    }
    if (filters.maxPrice > 0) {
      result = result.filter(p => p.price <= filters.maxPrice);
    }

    // Filter by Category
    if (filters.categories.length > 0) {
      result = result.filter(p => p.category && filters.categories.includes(p.category));
    }

    // Sort
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'alpha-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'relevance':
      default:
        // Default sort (usually by price low-high if no relevancy data implies otherwise, or keep original order)
        // For now, let's assume original order is "relevance" or just price-asc as a fallback
        // If the API returns sorted by relevance, we keep it. 
        // If not, maybe we default to price-asc? 
        // Let's stick to original API order for 'relevance'.
        break;
    }

    setFilteredProducts(result);
  }, [products, filters, sortOption]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header
        onSearch={handleSearch}
        onToggleSidebarMobile={() => setIsMobileFiltersOpen(true)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-white/30 transition-all duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-gray-100 animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p className="text-gray-600 font-semibold text-lg tracking-wide">Buscando los mejores precios...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex items-start gap-6 pt-6 px-4 sm:px-6 lg:px-8 pb-20">

        {/* Mobile Filter Drawer logic is inside SidebarFilters, we just pass props */}
        <SidebarFilters
          filters={filters}
          onFilterChange={setFilters}
          availableCategories={availableCategories}
          isOpenMobile={isMobileFiltersOpen}
          onCloseMobile={() => setIsMobileFiltersOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0">
          {/* Stats / Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-xl font-bold text-gray-800">
              {isLoading ? 'Buscando...' :
                products.length > 0 ? `Resultados (${filteredProducts.length})` :
                  'Bienvenido'
              }
            </h1>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle */}
              <button
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full"
                onClick={() => setIsMobileFiltersOpen(true)}
              >
                <Filter size={16} /> Filtros
              </button>

              {/* Sort Dropdown */}
              {products.length > 0 && (
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <option value="relevance">Relevancia</option>
                    <option value="price-asc">Menor precio</option>
                    <option value="price-desc">Mayor precio</option>
                    <option value="alpha-asc">A - Z</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
              {error}
            </div>
          )}

          <ProductGrid products={filteredProducts} isLoading={isLoading && products.length === 0} />
        </main>
      </div>

      <CartDrawer />
    </div>
  );
}
