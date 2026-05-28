/**
 * SHA-256 hash using Web Crypto API.
 * Works on: Edge runtime, Node.js 18+, and browser.
 * Do NOT use node:crypto — it's unavailable on Vercel Edge.
 */
export async function sha256(input: string): Promise<string> {
  const encoded    = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
