export interface Product {
    id: string;
    name: string;
    price: number;
    brand?: string;
    image?: string;
    store: string;
    storeLabel?: string;
    chainId?: string;
    ean?: string;
    source?: 'SEPA' | 'ONLINE';
    sourceDate?: string;
    priceDate?: string;
    presentation?: string;
    priceWarning?: string;
    unavailable?: boolean;
    storeLocation?: string;
    departmentId?: string;
    department?: string;
    locationWarning?: string;
    url?: string;
    productType?: string;
    category?: string;
    categories?: string[];
}

export interface SupermarketResponse {
    products: Product[];
    source: 'vea' | 'atomo' | 'carrefour';
    timestamp: string;
    error?: string;
    total?: number;
    truncated?: boolean;
}
