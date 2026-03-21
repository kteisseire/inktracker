/**
 * Validates a redirect URL to prevent open redirect attacks.
 * Only allows relative paths starting with '/'.
 */
export function safeRedirect(url: string | null | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return '/';
  return url;
}
