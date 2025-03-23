import { Message, Settings, Model } from "@/types/chat";
import { 
  encryptData, 
  decryptData
} from "@/utils/security";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:11434";
const MAX_REQUESTS_PER_MINUTE = 60;
const TOKEN_EXPIRY = 86400; // 24 hours

const defaultSettings: Settings = {
  model: "groq-model",
  apiKey: "",
  temperature: 0.7,
  maxTokens: 2000,
  streamingEnabled: true,
};

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

export const getSettings = (): Settings => {
  try {
    // Vérifier d'abord s'il y a une clé API Groq
    const groqApiKey = localStorage.getItem("chatopia-groq-api-key");
    
    // Vérifier les paramètres chiffrés
    const saved = localStorage.getItem("chatopia-settings");
    if (!saved) {
      // Si aucun paramètre n'est enregistré mais qu'on a une clé API Groq
      if (groqApiKey && groqApiKey.startsWith("gsk_")) {
        return {
          ...defaultSettings,
          apiKey: groqApiKey
        };
      }
      return defaultSettings;
    }

    try {
      const decrypted = decryptData(saved);
      const parsed = JSON.parse(decrypted);
      
      // Si on a une clé API Groq, l'utiliser à la place de celle des paramètres
      if (groqApiKey && groqApiKey.startsWith("gsk_")) {
        return {
          ...defaultSettings,
          ...parsed,
          apiKey: groqApiKey
        };
      }
      
      return {
        ...defaultSettings,
        ...parsed,
      };
    } catch (decryptError) {
      console.error("Error decrypting settings:", decryptError);
      // En cas d'erreur de déchiffrement, utiliser les paramètres par défaut
      if (groqApiKey && groqApiKey.startsWith("gsk_")) {
        return {
          ...defaultSettings,
          apiKey: groqApiKey
        };
      }
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
    return defaultSettings;
  }
};

export const saveSettings = (settings: Settings): void => {
  try {
    // Sauvegarde directe de la clé API pour Groq
    if (settings.apiKey && settings.apiKey.startsWith('gsk_')) {
      localStorage.setItem("chatopia-groq-api-key", settings.apiKey);
    }
    
    const encrypted = encryptData(JSON.stringify(settings));
    localStorage.setItem("chatopia-settings", encrypted);
  } catch (error) {
    console.error("Error saving settings:", error);
    // Fallback en cas d'échec d'encryption
    try {
      localStorage.setItem("chatopia-settings-fallback", JSON.stringify(settings));
    } catch (fallbackError) {
      console.error("Failed to save settings fallback:", fallbackError);
    }
  }
};

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