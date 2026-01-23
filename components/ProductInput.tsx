"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface Props {
    onAdd: (term: string) => void;
}

export default function ProductInput({ onAdd }: Props) {
    const [term, setTerm] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!term.trim()) return;
        onAdd(term);
        setTerm("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="¿Qué necesitas comprar?"
                className="flex-1 bg-white rounded-xl border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-[var(--primary)] outline-none shadow-sm placeholder:text-gray-400"
            />
            <button
                type="submit"
                disabled={!term.trim()}
                className="bg-[var(--primary)] text-white w-14 h-14 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
                <Plus size={32} />
            </button>
        </form>
    );
}
