/**
 * Rate Limiter for API Calls
 * 
 * Implements a token bucket algorithm to limit API requests
 * and avoid hitting rate limits.
 */

const RATE_LIMIT = 10; // requests per second
const BUCKET_SIZE = 10; // maximum number of tokens
let tokens = BUCKET_SIZE;
let lastRefill = Date.now();

/**
 * Refills the token bucket based on time elapsed
 */
function refillTokens() {
  const now = Date.now();
  const timePassed = now - lastRefill;
  const refillAmount = (timePassed / 1000) * RATE_LIMIT;
  
  tokens = Math.min(BUCKET_SIZE, tokens + refillAmount);
  lastRefill = now;
}

/**
 * Waits for a token to become available
 */
async function waitForToken(): Promise<void> {
  while (tokens < 1) {
    await new Promise(resolve => setTimeout(resolve, 100));
    refillTokens();
  }
  tokens--;
}

/**
 * Makes a rate-limited fetch request
 */
export async function rateLimitedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  await waitForToken();
  return fetch(url, options);
} 