export interface Product {
    id: string;
    name: string;
    price: number;
    brand?: string;
    image?: string;
    store: 'vea' | 'atomo' | 'carrefour';
    storeLocation?: string;
    url?: string;
}

export interface SupermarketResponse {
    products: Product[];
    source: 'vea' | 'atomo' | 'carrefour';
    timestamp: string;
    error?: string;
}
