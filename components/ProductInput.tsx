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
        <div className="relative mb-6" ref={wrapperRef}>
            <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        onFocus={() => term.length >= 2 && setShowSuggestions(true)}
                        placeholder="Agregá productos a tu lista..."
                        className="w-full glass rounded-2xl border-2 border-white/30 px-5 py-4 text-base font-medium text-gray-800 placeholder:text-gray-400 outline-none shadow-lg hover:shadow-xl transition-all focus:border-indigo-300 focus:shadow-2xl"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {loading ? <Loader2 className="animate-spin" size={22} /> : <Search size={20} />}
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!term.trim()}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Agregar a la lista"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            </form>

            {/* Modern Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-16 mt-2 glass rounded-2xl shadow-2xl border border-white/30 overflow-hidden z-20 animate-fade-in-up">
                    <div className="py-1 max-h-80 overflow-y-auto">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelectSuggestion(s)}
                                className="w-full text-left px-5 py-3 hover:bg-indigo-50 text-gray-700 font-medium border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
                            >
                                <div className="bg-gradient-to-r from-indigo-400 to-purple-500 p-1.5 rounded-lg">
                                    <Search size={14} className="text-white" />
                                </div>
                                <span className="truncate text-sm">{s}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
