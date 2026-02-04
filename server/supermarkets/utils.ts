/**
 * Parse Argentine price format to number
 * Examples:
 *   "5.038,00 $" -> 5038.00
 *   "$1.495" -> 1495.00
 *   "2600" -> 2600.00
 */
export function parseArgentinePrice(priceStr: string | number): number {
    if (typeof priceStr === 'number') {
        return priceStr;
    }

    if (!priceStr) {
        return 0;
    }

    // Remove currency symbol and trim
    let cleaned = priceStr
        .replace(/\$/g, '')
        .replace(/ARS/gi, '')
        .trim();

    // Handle Argentine format: "5.038,00" (thousands with dot, decimals with comma)
    // vs US format: "5,038.00" (thousands with comma, decimals with dot)

    // If there's both dot and comma, determine which is decimal separator
    if (cleaned.includes('.') && cleaned.includes(',')) {
        // If comma is after dot, it's decimal separator (Argentine format)
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
            cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
        } else {
            // Otherwise, dot is decimal separator (US format)
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (cleaned.includes(',')) {
        // Only comma: assume it's decimal separator (Argentine format)
        cleaned = cleaned.replace(/,/g, '.');
    } else if (cleaned.includes('.')) {
        // Only dot: This is tricky. In Argentina it could be thousands (1.500) or decimal (1.5).
        // For supermarket prices, if there are 3 digits after the last dot, it's likely thousands.
        // Example: "1.500" -> 1500, but "1.5" -> 1.5
        const parts = cleaned.split('.');
        const lastPart = parts[parts.length - 1];

        if (lastPart.length === 3) {
            // Assume thousands
            cleaned = cleaned.replace(/\./g, '');
        }
        // Otherwise keep it as decimal
    }

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Simple in-memory cache with TTL
 */
export class SimpleCache<T> {
    private cache = new Map<string, { data: T; expires: number }>();

    constructor(private ttlMs: number = 5 * 60 * 1000) { } // 5 minutes default

    set(key: string, value: T): void {
        this.cache.set(key, {
            data: value,
            expires: Date.now() + this.ttlMs,
        });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }
}

/**
 * Rate limiter using token bucket algorithm
 */
export class RateLimiter {
    private lastRequest = 0;

    constructor(private requestsPerSecond: number = 1) { }

    async waitIfNeeded(): Promise<void> {
        const now = Date.now();
        const minInterval = 1000 / this.requestsPerSecond;
        const timeSinceLastRequest = now - this.lastRequest;

        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        this.lastRequest = Date.now();
    }
}

/**
 * Calculate similarity between two strings (0 to 1)
 * Uses Sørensen–Dice coefficient on bigrams for robust comparison
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/\s+/g, '');
    const s2 = str2.toLowerCase().replace(/\s+/g, '');

    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;

    const bigrams1 = new Set<string>();
    for (let i = 0; i < s1.length - 1; i++) {
        bigrams1.add(s1.substring(i, i + 2));
    }

    const bigrams2 = new Set<string>();
    for (let i = 0; i < s2.length - 1; i++) {
        bigrams2.add(s2.substring(i, i + 2));
    }

    let intersection = 0;
    for (const bigram of bigrams1) {
        if (bigrams2.has(bigram)) {
            intersection++;
        }
    }

    return (2 * intersection) / (bigrams1.size + bigrams2.size);
}
/**
 * Clean and truncate query for VTEX search compatibility
 */
export function cleanQueryForVTEX(query: string): string {
    return query
        .replace(/[^\w\s]/gi, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ')      // Normalize spaces
        .trim()
        .substring(0, 50);          // Truncate reached limits
}
