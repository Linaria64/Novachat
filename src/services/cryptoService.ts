import CryptoJS from 'crypto-js';

// Clé de chiffrement - dans un environnement de production, stockez-la dans une variable d'environnement
const ENCRYPTION_KEY = 'chatopia-secure-encryption-key-2023';

/**
 * Chiffre une chaîne de caractères
 * @param data Données à chiffrer
 * @returns Données chiffrées
 */
export function encryptData(data: string): string {
  try {
    if (!data) return '';
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

/**
 * Déchiffre une chaîne de caractères
 * @param encryptedData Données chiffrées
 * @returns Données déchiffrées
 */
export function decryptData(encryptedData: string): string {
  try {
    if (!encryptedData) return '';
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

/**
 * Génère un hash SHA-256 d'une chaîne
 * @param data Données à hacher
 * @returns Hash SHA-256
 */
export function hashData(data: string): string {
  try {
    if (!data) return '';
    return CryptoJS.SHA256(data).toString();
  } catch (error) {
    console.error('Hashing error:', error);
    return '';
  }
}

/**
 * Génère un ID unique et le sécurise avec un hash
 * @returns ID sécurisé
 */
export function generateSecureId(): string {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 15);
  return hashData(`${timestamp}-${random}`).substring(0, 16);
} 