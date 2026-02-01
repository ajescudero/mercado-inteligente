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
    }
    // If only dot, assume it's decimal separator (already correct)

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
