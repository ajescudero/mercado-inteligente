import { getProductSuggestions, getProductSuggestionsForTerms } from "@/lib/db";
import { normalizeSearchTerm } from "@/lib/ai-normalizer";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const useAI = searchParams.get('ai') !== 'false'; // AI enabled by default

    if (!q || q.length < 2) {
        return NextResponse.json({ suggestions: [] });
    }

    try {
        let suggestions: string[] = [];

        if (useAI) {
            // Use AI to get normalized search terms
            const normalizedTerms = await normalizeSearchTerm(q);

            if (normalizedTerms.length > 0) {
                // Get product suggestions for each normalized term
                suggestions = await getProductSuggestionsForTerms(normalizedTerms);
            }
        }

        // Fallback to direct DB search if AI returned nothing
        if (suggestions.length === 0) {
            suggestions = getProductSuggestions(q);
        }

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error("API Suggestions Error:", error);
        // Fallback to non-AI suggestions on error
        const fallback = getProductSuggestions(q);
        return NextResponse.json({ suggestions: fallback });
    }
}
