import { toast } from "sonner";

export type OllamaModel = {
  name: string;
  modified_at: string;
  size: number;
};

export type OllamaMessage = {
  role: "user" | "assistant";
  content: string;
};

export type OllamaResponse = {
  model: string;
  created_at: string;
  message: {
    role: "assistant";
    content: string;
  };
  done: boolean;
};

// Configuration
const DEFAULT_API_URL = "/ollama-api/api"; // Use the Vite proxy
const API_TIMEOUT = 30000; // 30 seconds timeout
const SETTINGS_KEY = "chatopia-settings";

// Determine if we're in development or production
const isDevelopment = import.meta.env.DEV;

// Determine the base URL based on environment
export function getBaseUrl(url: string): string {
  // If it's already a relative URL (starts with /), it will use the proxy
  if (url.startsWith('/')) {
    return url;
  }
  
  // If in production or the URL is already configured for a different server, use it as is
  if (!isDevelopment || !url.includes('localhost:11434')) {
    return url;
  }
  
  // Replace direct localhost URL with proxy URL
  return url.replace('http://localhost:11434/api', '/ollama-api/api');
}

// Settings type
export interface OllamaSettings {
  apiUrl: string;
  timeout: number;
}

// Default settings
export const defaultSettings: OllamaSettings = {
  apiUrl: DEFAULT_API_URL,
  timeout: API_TIMEOUT,
};

// Get current settings
export function getSettings(): OllamaSettings {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error("Error parsing settings:", error);
  }
  return defaultSettings;
}

// Save settings
export function saveSettings(settings: OllamaSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Get current API URL
export function getApiUrl(): string {
  return getBaseUrl(getSettings().apiUrl);
}

// Get original API URL (for display)
export function getDisplayApiUrl(): string {
  return getSettings().apiUrl;
}

// Get current timeout
export function getTimeout(): number {
  return getSettings().timeout;
}

// Connection state
let connectionStatus = {
  isConnected: false,
  lastChecked: 0,
  reconnectAttempts: 0,
};

// Cache for models
let modelsCache: {
  data: OllamaModel[];
  timestamp: number;
} = {
  data: [],
  timestamp: 0,
};

// Helper for fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = getTimeout()) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Check connection status
export async function checkConnection(): Promise<boolean> {
  // Use cached status if checked recently (within 5 seconds)
  const now = Date.now();
  if (now - connectionStatus.lastChecked < 5000) {
    return connectionStatus.isConnected;
  }
  
  try {
    const response = await fetchWithTimeout(`${getApiUrl()}/tags`, {}, 5000);
    connectionStatus.isConnected = response.ok;
    connectionStatus.lastChecked = now;
    connectionStatus.reconnectAttempts = 0;
    return response.ok;
  } catch (error) {
    connectionStatus.isConnected = false;
    connectionStatus.lastChecked = now;
    connectionStatus.reconnectAttempts++;
    return false;
  }
}

export async function getModels(): Promise<OllamaModel[]> {
  // Use cache if available and less than 1 minute old
  const now = Date.now();
  if (modelsCache.data.length > 0 && now - modelsCache.timestamp < 60000) {
    return modelsCache.data;
  }
  
  try {
    const response = await fetchWithTimeout(`${getApiUrl()}/tags`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    // Update cache
    modelsCache = {
      data: models,
      timestamp: now,
    };
    
    return models;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

export async function generateCompletion(
  model: string,
  messages: OllamaMessage[]
): Promise<string> {
  try {
    const response = await fetchWithTimeout(`${getApiUrl()}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${errorText}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error("Error generating completion:", error);
    toast.error("Failed to connect to Ollama. Is it running locally?");
    throw error;
  }
}

// New streaming API for better UX
export async function generateCompletionStream(
  model: string,
  messages: OllamaMessage[],
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  const controller = new AbortController();
  
  (async () => {
    try {
      const response = await fetchWithTimeout(`${getApiUrl()}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              onChunk(data.message.content);
              fullResponse += data.message.content;
            }
          } catch (e) {
            console.warn("Failed to parse JSON from stream:", line);
          }
        }
      }

      onComplete(fullResponse);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error in streaming completion:", error);
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  })();

  // Return abort function
  return () => controller.abort();
}
