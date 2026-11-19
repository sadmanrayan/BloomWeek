/**
 * Resolves local asset paths against Vite's configured BASE_URL so images load
 * reliably both in local dev ("/") and on GitHub Pages project subpaths ("./").
 */
export function resolveAssetUrl(
  assetPath: string,
  baseUrl?: string
): string {
  if (!assetPath) return assetPath;
  if (/^(https?:|data:|blob:)/i.test(assetPath)) {
    return assetPath;
  }

  const envBase =
    baseUrl ??
    (typeof import.meta !== 'undefined' &&
    typeof (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL === 'string'
      ? (import.meta as { env?: { BASE_URL?: string } }).env!.BASE_URL!
      : '/');

  const normalizedBase = envBase.endsWith('/') ? envBase : `${envBase}/`;
  const normalizedPath = assetPath.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}
