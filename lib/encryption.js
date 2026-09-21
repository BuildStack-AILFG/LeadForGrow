import crypto from 'crypto';

/**
 * Encryption Utility for Business Email Credentials
 * Uses AES-256-CBC encryption for storing SMTP passwords securely
 */

// Use environment variable or generate a secure key (MUST be 32 bytes for AES-256)
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Encryption] ENCRYPTION_KEY is required in production. Set a 32-byte hex key.');
    }
    console.warn('[Encryption] WARNING: ENCRYPTION_KEY not found. Using a temporary development key. DO NOT USE IN PRODUCTION.');
    // 32-byte hex key for development
    return Buffer.from('4a6164676572746c66675f7365637572655f6b65795f646576656c6f705f3031', 'hex');
  }

  try {
    const buffer = Buffer.from(key, 'hex');
    if (buffer.length === 32) return buffer;

    throw new Error(`[Encryption] Invalid hex key length: ${buffer.length} bytes. Key must be exactly 32 bytes.`);
  } catch (e) {
    throw new Error('[Encryption] Failed to parse hex key: ' + e.message);
  }
};

// Resolved lazily on first use — resolving at module load would crash
// `next build` page-data collection (which runs with NODE_ENV=production)
let cachedKey = null;
const resolveKey = () => {
  if (!cachedKey) cachedKey = getEncryptionKey();
  return cachedKey;
};

const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypt a plaintext password
 * @param {string} text - The plaintext password
 * @returns {string} - Encrypted password in format: iv:encryptedData
 */
export function encrypt(text) {
  if (!text) return '';

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', resolveKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (separated by :)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('[Encryption] Error encrypting:', error.message);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypt an encrypted password
 * @param {string} text - The encrypted password in format: iv:encryptedData
 * @returns {string} - Decrypted plaintext password
 */
export function decrypt(text) {
  if (!text) return '';

  try {
    const parts = text.split(':');
    if (parts.length !== 2) {
      console.warn('[Encryption] Password not in encrypted format, returning as-is (Potential legacy data)');
      return text;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', resolveKey(), iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption] ❌ DECRYPTION FAILED. This usually happens if the ENCRYPTION_KEY was changed.');
    console.error('[Encryption] Error detail:', error.message);
    // DO NOT return the encrypted text, as it will be sent as a password and fail auth
    return null;
  }
}

/**
 * Check if a string is encrypted
 * @param {string} text - The text to check
 * @returns {boolean} - True if encrypted format detected
 */
export function isEncrypted(text) {
  if (!text) return false;
  const parts = text.split(':');
  return parts.length === 2 && parts[0].length === 32 && /^[0-9a-f]+$/i.test(parts[0]);
}

/**
 * Decrypt a value only if it looks encrypted; otherwise return it unchanged.
 * Lets encrypted-at-rest secrets and legacy plaintext ones coexist during the
 * transition — every read site can call this safely.
 * @param {string} value
 * @returns {string}
 */
export function decryptMaybe(value) {
  if (!value || typeof value !== 'string') return value;
  return isEncrypted(value) ? decrypt(value) : value;
}

/**
 * Encrypt a value only if it isn't already encrypted (idempotent on save).
 * @param {string} value
 * @returns {string}
 */
export function encryptOnce(value) {
  if (!value || typeof value !== 'string') return value;
  return isEncrypted(value) ? value : encrypt(value);
}
