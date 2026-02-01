
interface SubAddress {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
}

interface NominatimResponse {
    address: SubAddress;
    display_name: string;
}

const CACHE = new Map<string, string>();

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;

    if (CACHE.has(key)) {
        return CACHE.get(key)!;
    }

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'ListaInteligentePrecios/1.0 (lista-inteligente@demo.com)'
            }
        });

        if (!res.ok) throw new Error('Geocoding service unavailable');

        const data: NominatimResponse = await res.json();

        // Format logic: Street > Suburb > City
        const addr = data.address;
        const street = addr.road || '';
        const area = addr.suburb || addr.village || addr.town || addr.city || '';

        const result = street ? `${street}, ${area}`.trim().replace(/^, /, '') : area;

        // Cache valid results
        if (result) {
            CACHE.set(key, result);
        }

        return result || null;

    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}
