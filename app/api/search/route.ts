import { searchProduct } from "@/lib/search";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;

    if (!q) {
        return NextResponse.json({ data: [] });
    }

    try {
        const { data, source } = await searchProduct(q, lat, lng);
        return NextResponse.json({ data, source });
    } catch (error) {
        console.error("API Search Error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
