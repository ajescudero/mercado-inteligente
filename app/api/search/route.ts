import { NextRequest, NextResponse } from "next/server";
import { searchProduct } from "@/lib/search";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const term = searchParams.get("q");

    if (!term) {
        return NextResponse.json({ error: "Term is required" }, { status: 400 });
    }

    try {
        const result = await searchProduct(term);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
