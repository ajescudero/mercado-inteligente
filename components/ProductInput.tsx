"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { debounce } from "lodash";

interface Props {
    onAdd: (term: string) => void;
}

export default function ProductInput({ onAdd }: Props) {
    const [term, setTerm] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounced fetch suggestions
    const fetchSuggestions = useRef(
        debounce(async (value: string) => {
            if (value.length < 2) {
                setSuggestions([]);
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(`/api/suggestions?q=${encodeURIComponent(value)}`);
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setShowSuggestions(true);
            } catch (err) {
                console.error("Suggestions fetch error:", err);
            } finally {
                setLoading(false);
            }
        }, 300)
    ).current;

    useEffect(() => {
        fetchSuggestions(term);
    }, [term, fetchSuggestions]);

    // Click outside listener
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!term.trim()) return;
        onAdd(term);
        setTerm("");
        setShowSuggestions(false);
    };

    const handleSelectSuggestion = (suggestion: string) => {
        onAdd(suggestion);
        setTerm("");
        setShowSuggestions(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        onFocus={() => term.length >= 2 && setShowSuggestions(true)}
                        placeholder="¿Qué necesitas comprar?"
                        className="w-full bg-white rounded-2xl border-2 border-transparent px-5 py-4 text-lg focus:border-[var(--primary)] outline-none shadow-md placeholder:text-gray-400 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                        {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={22} />}
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!term.trim()}
                    className="bg-[var(--primary)] text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                    aria-label="Agregar a la lista"
                >
                    <Plus size={32} />
                </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-16 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelectSuggestion(s)}
                                className="w-full text-left px-5 py-3 hover:bg-[var(--primary)]/5 text-gray-700 font-medium border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors"
                            >
                                <Search size={16} className="text-gray-300" />
                                <span className="truncate">{s}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
