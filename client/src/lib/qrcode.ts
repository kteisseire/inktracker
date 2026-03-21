/**
 * Minimal QR code generator using Canvas.
 * Generates a QR code image as a data URL.
 * Uses the QR Server API for simplicity (no external npm dependency).
 */

export function getQrCodeUrl(text: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=0a0e1a&color=f5f0e8&format=png`;
}
