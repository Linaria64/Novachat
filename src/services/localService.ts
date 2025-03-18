import { Message, Settings, Model } from "@/types/chat";
import { 
  encryptData, 
  decryptData
} from "@/utils/security";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:11434";
const MAX_REQUESTS_PER_MINUTE = 60;
const SESSION_TIMEOUT = 3600; // 1 hour
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

interface Session {
  id: string;
  createdAt: number;
  expiresAt: number;
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

let currentSession: Session | null = null;
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

function createSession(): Session {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    expiresAt: now + SESSION_TIMEOUT * 1000,
  };
}

function validateSession(session: Session): boolean {
  return Date.now() < session.expiresAt;
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
    const saved = localStorage.getItem("chatopia-settings");
    if (!saved) return defaultSettings;

    const decrypted = decryptData(saved);
    const parsed = JSON.parse(decrypted);
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch (error) {
    console.error("Error loading settings:", error);
    return defaultSettings;
  }
};

export const saveSettings = (settings: Settings): void => {
  try {
    const encrypted = encryptData(JSON.stringify(settings));
    localStorage.setItem("chatopia-settings", encrypted);
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

export const checkConnection = async (): Promise<boolean> => {
  if (!createRateLimiter()) {
    return false;
  }

  if (!currentSession || !validateSession(currentSession)) {
    currentSession = createSession();
  }

  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error("Error checking connection:", error);
    return false;
  }
};

export const getModels = async (): Promise<Model[]> => {
  try {
    // Check rate limit
    if (!createRateLimiter()) {
      throw new Error('Rate limit exceeded');
    }

    const settings = getSettings();
    
    // Validate token
    if (!currentToken || !validateToken(currentToken)) {
      currentToken = createToken();
    }

    const response = await fetch(`${API_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${decryptData(settings.apiKey)}`,
        'X-Session-ID': currentSession?.id || '',
        'X-Token': currentToken?.token || ''
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return data.map((model: any) => ({
      id: model.id || model.name,
      name: model.name,
      description: model.description || ''
    }));
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