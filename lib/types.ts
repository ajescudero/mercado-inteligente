export interface Product {
    id: string;
    name: string;
    brand: string;
    price: number;
    currency: string;
    store: string;
    image?: string;
    quantity?: string;
}

export interface ListItem {
    id: string;
    term: string;
    status: 'PENDING' | 'SEARCHING' | 'FOUND' | 'COMPLETED';
    searchSummary?: string; // "Found 12 options..."
    selectedProduct?: Product;
}
