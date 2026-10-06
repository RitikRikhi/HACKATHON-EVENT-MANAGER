import crypto from 'crypto';
import { env } from './env';

const QR_SECRET = process.env.QR_SIGNING_SECRET || env.JWT_SECRET || 'default_event_os_qr_signing_secret_2026';

export interface GeneratedQR {
  qrString: string;
  participantId: string;
  eventId: string;
  expiry: number;
  version: string;
  signature: string;
}

export const generateQRPayload = (
  participantId: string,
  eventId: string,
  expiresInSeconds: number = 86400 * 30 // 30 days default
): GeneratedQR => {
  const version = 'v1';
  const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const rawData = `${participantId}:${eventId}:${expiry}:${version}`;
  const signature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(rawData)
    .digest('hex');

  const qrString = `${participantId}|${eventId}|${expiry}|${version}|${signature}`;
  return {
    qrString,
    participantId,
    eventId,
    expiry,
    version,
    signature,
  };
};

export const verifyQRPayload = (
  qrString: string,
  targetEventId?: string
): { valid: boolean; participantId?: string; eventId?: string; error?: string } => {
  if (!qrString || typeof qrString !== 'string') {
    return { valid: false, error: 'QR string is missing or invalid format.' };
  }

  const parts = qrString.split('|');
  if (parts.length !== 5) {
    return { valid: false, error: 'Malformed QR code structure.' };
  }

  const [participantId, eventId, expiryStr, version, signature] = parts;
  const expiry = parseInt(expiryStr, 10);

  if (isNaN(expiry)) {
    return { valid: false, error: 'Invalid QR expiration timestamp.' };
  }

  // 1. Verify Event matches target event if provided
  if (targetEventId && eventId !== targetEventId) {
    return { valid: false, error: 'QR code belongs to a different event.' };
  }

  // 2. Check Expiration
  const now = Math.floor(Date.now() / 1000);
  if (now > expiry) {
    return { valid: false, error: 'QR code has expired.' };
  }

  // 3. Verify HMAC Signature
  const rawData = `${participantId}:${eventId}:${expiry}:${version}`;
  const expectedSignature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(rawData)
    .digest('hex');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Invalid QR signature or tampered code.' };
  }

  return {
    valid: true,
    participantId,
    eventId,
  };
};
