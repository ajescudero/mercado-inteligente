import React, { useState } from 'react';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

interface HeaderProps {
    onSearch: (query: string) => void;
    onToggleSidebarMobile: () => void;
}

export function Header({ onSearch, onToggleSidebarMobile }: HeaderProps) {
    const [query, setQuery] = useState('');
    const { totalItems, setIsOpen } = useCart();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

                {/* Logo & Mobile Menu */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleSidebarMobile}
                        className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hidden sm:block">
                            MercadoInteligente
                        </span>
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSubmit} className="flex-1 max-w-2xl mx-auto relative">
                    <div className="relative group">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar productos (ej. leche, arroz)..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 outline-none"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                </form>

                {/* Cart Button */}
                <div className="flex items-center">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors group"
                    >
                        <ShoppingCart size={24} className="group-hover:text-blue-600 transition-colors" />

                        {totalItems > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full border-2 border-white shadow-sm">
                                {totalItems}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}

// Icon helper
function ShoppingBag({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
    )
}
