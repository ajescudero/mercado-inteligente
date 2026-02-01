import { reverseGeocode } from "@/lib/geocoding";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    try {
        const address = await reverseGeocode(lat, lng);
        return NextResponse.json({ address });
    } catch (error) {
        return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
    }
}
