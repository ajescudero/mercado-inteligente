import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query || query.trim().length < 3) {
        return NextResponse.json(
            { error: 'La búsqueda debe tener al menos 3 caracteres' },
            { status: 400 }
        );
    }

    const sanitizedQuery = `%${query.trim().toUpperCase()}%`;

    try {
        // Query complejo: buscar productos y hacer JOIN con tiendas para devolver info completa
        // Se ordena por precio para mostrar las mejores ofertas primero
        const stmt = db.prepare(`
            SELECT 
                p.ean,
                p.description as descripcion,
                p.price as precio,
                p.comercioId,
                s.id as store_id,
                s.name as store_name,
                s.address as store_address,
                s.locality as store_locality,
                s.lat as store_lat,
                s.lng as store_lng
            FROM products p
            JOIN stores s ON p.storeId = s.id
            WHERE p.description LIKE ?
            ORDER BY p.price ASC
            LIMIT ?
        `);

        const rows = stmt.all(sanitizedQuery, limit);

        // Formatear respuesta para que sea fácil de usar en Android
        const results = rows.map((row: any) => ({
            ean: row.ean,
            name: row.descripcion,
            price: row.precio,
            store: {
                id: row.store_id,
                name: row.store_name,
                address: row.store_address,
                locality: row.store_locality,
                latitude: row.store_lat,
                longitude: row.store_lng
            }
        }));

        return NextResponse.json({
            count: results.length,
            query: query,
            results
        });

    } catch (error) {
        console.error('Database search error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al buscar precios' },
            { status: 500 }
        );
    }
}
