/**
 * Rate Limiter type definitions
 */

/**
 * Rate limit record for tracking requests per IP
 */
export interface RateLimitRecord {
  timestamps: number[]; // Array of request timestamps in milliseconds
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxPerMinute: number;
  maxPer10Seconds: number;
}

