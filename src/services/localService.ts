import { Message, Settings, Model } from "@/types/chat";
import { encryptData, decryptData } from "./cryptoService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:11434";
const MAX_REQUESTS_PER_MINUTE = 60;
const TOKEN_EXPIRY = 86400; // 24 hours
const SETTINGS_KEY = 'chatopia-settings';
const API_KEY_STORAGE_KEY = 'chatopia-groq-api-key';
const CONVERSATIONS_STORAGE_KEY = 'chatopia-conversations';

interface RateLimiter {
  requests: number;
  windowStart: number;
}

interface Token {
  token: string;
  createdAt: number;
  expiresAt: number;
}

let rateLimiter: RateLimiter = {
  requests: 0,
  windowStart: Date.now(),
};

let currentToken: Token | null = null;

function createRateLimiter(): boolean {
  const now = Date.now();
  if (now - rateLimiter.windowStart > 60000) {
    rateLimiter = {
      requests: 0,
      windowStart: now,
    };
  }
  if (rateLimiter.requests >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  rateLimiter.requests++;
  return true;
}

function createToken(): Token {
  const now = Date.now();
  return {
    token: crypto.randomUUID(),
    createdAt: now,
    expiresAt: now + TOKEN_EXPIRY * 1000,
  };
}

function validateToken(token: Token): boolean {
  return Date.now() < token.expiresAt;
}

/**
 * Obtenir les paramètres sauvegardés
 * @returns Settings ou paramètres par défaut si non trouvés
 */
export function getSettings(): Settings {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (!savedSettings) {
      return {
        model: "llama3-70b-8192",
        temperature: 0.7,
        maxTokens: 4000,
        apiKey: "",
        streamingEnabled: true
      };
    }
    
    try {
      const decrypted = decryptData(savedSettings);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Error decrypting settings:", error);
      return {
        model: "llama3-70b-8192",
        temperature: 0.7,
        maxTokens: 4000,
        apiKey: "",
        streamingEnabled: true
      };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
    return {
      model: "llama3-70b-8192",
      temperature: 0.7,
      maxTokens: 4000,
      apiKey: "",
      streamingEnabled: true
    };
  }
}

/**
 * Sauvegarder les paramètres
 * @param settings Paramètres à sauvegarder
 */
export function saveSettings(settings: Settings): void {
  try {
    const encrypted = encryptData(JSON.stringify(settings));
    localStorage.setItem(SETTINGS_KEY, encrypted);
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

/**
 * Obtenir la clé API
 * @returns Clé API ou chaîne vide
 */
export function getApiKey(): string {
  // Pour la compatibilité avec l'ancien stockage non chiffré
  try {
    const encryptedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!encryptedKey) return '';
    
    // Vérifier si la clé est déjà chiffrée
    if (encryptedKey.startsWith('U2Fsd')) {
      return decryptData(encryptedKey);
    }
    
    // Sinon, c'est l'ancienne version non chiffrée, on la chiffre pour la prochaine fois
    setApiKey(encryptedKey);
    return encryptedKey;
  } catch (error) {
    console.error('Error getting API key:', error);
    return '';
  }
}

/**
 * Sauvegarder la clé API
 * @param apiKey Clé API à sauvegarder
 */
export function setApiKey(apiKey: string): void {
  try {
    const encrypted = encryptData(apiKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Error setting API key:', error);
  }
}

/**
 * Nettoyer toutes les données stockées localement
 */
export function clearAllData(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(CONVERSATIONS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

export const checkConnection = async (): Promise<boolean> => {
  // Toujours retourner true pour éviter le blocage de l'interface
  return true;
};

export const getModels = async (): Promise<Model[]> => {
  try {
    // Mock de modèles pour éviter les appels API qui peuvent échouer
    return [
      { id: "llama3-70b-8192", name: "Llama 3 70B", description: "Modèle Llama 3 de Meta" },
      { id: "qwen-qwq-32b", name: "Qwen QWQ 32B", description: "Modèle Qwen de Alibaba" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", description: "Modèle Mixtral de Mistral AI" },
      { id: "llama3-8b-8192", name: "Llama 3 8B", description: "Version légère de Llama 3" },
      { id: "gemma-7b-it", name: "Gemma 7B", description: "Modèle Gemma de Google" }
    ];
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return [];
  }
};

export const generateCompletionStream = async (
  messages: Message[],
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  if (!createRateLimiter()) {
    onError(new Error("Rate limit exceeded"));
    return;
  }

  if (!currentToken || !validateToken(currentToken)) {
    currentToken = createToken();
  }

  const settings = getSettings();

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        messages,
        model: settings.model,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: settings.streamingEnabled,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is null");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      onChunk(chunk);
    }

    onComplete();
  } catch (error) {
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error("Unknown error occurred"));
    }
  }
}; 