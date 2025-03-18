import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secure-encryption-key';
const MAX_REQUESTS_PER_MINUTE = parseInt(import.meta.env.VITE_MAX_REQUESTS_PER_MINUTE || '60');
const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600');
const TOKEN_EXPIRY = parseInt(import.meta.env.VITE_TOKEN_EXPIRY || '86400');

interface RateLimiter {
  requests: number;
  windowStart: number;
}

const rateLimiter: RateLimiter = {
  requests: 0,
  windowStart: Date.now(),
};

// Generate a secure random key
export const generateSecureKey = (): string => {
  return uuidv4() + '-' + CryptoJS.lib.WordArray.random(32).toString();
};

// Enhanced encryption with salt and IV
export const encryptData = (data: string): string => {
  try {
    const iv = CryptoJS.lib.WordArray.random(16);
    const salt = CryptoJS.lib.WordArray.random(16);
    const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, {
      keySize: 256 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA256
    });
    
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    const result = salt.toString() + iv.toString() + encrypted.toString();
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

// Enhanced decryption with salt and IV
export const decryptData = (encryptedData: string): string => {
  try {
    const salt = CryptoJS.enc.Hex.parse(encryptedData.substr(0, 32));
    const iv = CryptoJS.enc.Hex.parse(encryptedData.substr(32, 32));
    const encrypted = encryptedData.substring(64);

    const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, {
      keySize: 256 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA256
    });

    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

// Enhanced password hashing with salt
export const hashPassword = (password: string): string => {
  const salt = CryptoJS.lib.WordArray.random(16);
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 512 / 32,
    iterations: 10000,
    hasher: CryptoJS.algo.SHA512
  });
  return salt.toString() + hash.toString();
};

// Verify password hash
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  try {
    const salt = CryptoJS.enc.Hex.parse(hashedPassword.substr(0, 32));
    const hash = hashedPassword.substring(32);
    const computedHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 512 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA512
    });
    return hash === computedHash.toString();
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

// Enhanced API key validation
export const validateApiKey = (apiKey: string): boolean => {
  if (!apiKey) return false;
  
  // Check length and format
  if (apiKey.length < 32 || apiKey.length > 256) return false;
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9-_]+$/.test(apiKey)) return false;
  
  // Check for common patterns that might indicate a weak key
  const weakPatterns = [
    /^[0-9]+$/, // Only numbers
    /^[a-zA-Z]+$/, // Only letters
    /^[a-zA-Z0-9]+$/, // Only alphanumeric
    /^[a-zA-Z0-9-_]+$/, // Only alphanumeric, hyphen, underscore
    /^[a-zA-Z0-9-_]{32}$/, // Exactly 32 characters
    /^[a-zA-Z0-9-_]{64}$/, // Exactly 64 characters
    /^[a-zA-Z0-9-_]{128}$/, // Exactly 128 characters
    /^[a-zA-Z0-9-_]{256}$/, // Exactly 256 characters
  ];
  
  return !weakPatterns.some(pattern => pattern.test(apiKey));
};

// Enhanced input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove potentially dangerous characters and patterns
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[&]/g, '&amp;') // Escape ampersands
    .replace(/["]/g, '&quot;') // Escape quotes
    .replace(/[']/g, '&#x27;') // Escape single quotes
    .replace(/[/]/g, '&#x2F;') // Escape forward slashes
    .replace(/[\\]/g, '&#x5C;') // Escape backslashes
    .replace(/[`]/g, '&#x60;') // Escape backticks
    .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
    .trim(); // Remove leading/trailing whitespace
};

// Rate limiting helper
export const createRateLimiter = () => {
  const now = Date.now();
  if (now - rateLimiter.windowStart > 60000) {
    rateLimiter.requests = 0;
    rateLimiter.windowStart = now;
  }
  return rateLimiter.requests < MAX_REQUESTS_PER_MINUTE;
};

// Session management
export const createSession = () => {
  const sessionId = uuidv4();
  const sessionData = {
    id: sessionId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TIMEOUT * 1000,
  };
  return sessionData;
};

export const validateSession = (session: { id: string; createdAt: number; expiresAt: number }) => {
  return Date.now() < session.expiresAt;
};

// Token management
export const createToken = () => {
  const token = uuidv4();
  const tokenData = {
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY * 1000,
  };
  return tokenData;
};

export const validateToken = (token: string | null): boolean => {
  if (!token) return false;
  return token.length > 0;
}; 