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
}

export interface ListItem {
    id: string;
    term: string;
    status: 'PENDING' | 'SEARCHING' | 'FOUND' | 'COMPLETED' | 'NOT_FOUND' | 'ERROR';
    searchSummary?: string;
    selectedProduct?: Product;
    foundProducts?: Product[];
    source?: 'CACHE' | 'DB';
}
