export interface Product {
    id: string;
    ean: string;
    name: string;
    brand: string;
    price: number;
    currency: string;
    store: string;
    address?: string;
    locality?: string;
    image?: string;
    quantity?: string;
    distance?: number;
    source?: string; // 'vea' | 'atomo' | 'carrefour' | 'sepa'
    updated?: string; // ISO timestamp for real-time data
}

export interface ListItem {
    id: string;
    term: string;
    status: 'DRAFT' | 'SEARCHING' | 'FOUND' | 'COMPLETED' | 'NOT_FOUND' | 'ERROR';
    searchSummary?: string;
    selectedProduct?: Product;
    foundProducts?: Product[];
    source?: 'CACHE' | 'DB';
}

export interface BatchSearchResult {
    term: string;
    products: Product[];
    bestPrice?: number;
    status: 'FOUND' | 'NOT_FOUND' | 'ERROR';
}

export interface StoreAnalysis {
    storeName: string;
    storeAddress?: string;
    itemsAvailable: number;
    totalItems: number;
    totalPrice: number;
    averageDistance?: number;
    missingItems: string[];
    coverage: number; // percentage 0-100
    availableProducts: Array<{
        term: string;
        product: Product;
    }>;
}

export interface StoreRecommendation {
    primaryStore: StoreAnalysis;
    secondaryStores?: StoreAnalysis[];
    totalSavings?: number;
    recommendation: string;
    isMultiStore: boolean;
}
