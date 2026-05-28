/**
 * Web Crypto SHA-256 — works in both Edge and Node.js runtimes.
 *
 * COPPA rule: google_sub (the raw Google user ID) is NEVER stored anywhere.
 * Always hash it first with this function before writing to the database.
 */
export async function hashSubject(sub: string): Promise<string> {
  const data      = new TextEncoder().encode(sub);
  const buf       = await crypto.subtle.digest('SHA-256', data);
  const byteArray = Array.from(new Uint8Array(buf));
  return byteArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
