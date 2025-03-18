import { Message, Settings, Model } from "@/types/chat";
import { 
  encryptData, 
  decryptData, 
  validateApiKey, 
  sanitizeInput,
  createRateLimiter,
  createSession,
  validateSession,
  createToken,
  validateToken
} from "@/utils/security";

const API_URL = import.meta.env.VITE_API_URL;
const APP_ENV = import.meta.env.VITE_APP_ENV;
const MAX_REQUESTS = parseInt(import.meta.env.VITE_MAX_REQUESTS_PER_MINUTE || '60');
const RATE_LIMIT_WINDOW = parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW || '60000');

const defaultSettings: Settings = {
  model: 'local-model',
  temperature: 0.7,
  maxTokens: 2000,
  apiKey: '',
  streamingEnabled: true
};

// Create rate limiter instance
const rateLimiter = createRateLimiter(MAX_REQUESTS, RATE_LIMIT_WINDOW);

// Session management
let currentSession = '';
let currentToken = '';

export const getSettings = (): Settings => {
  try {
    const savedSettings = localStorage.getItem('chatopia-settings');
    if (!savedSettings) return defaultSettings;

    const decryptedSettings = decryptData(savedSettings);
    if (!decryptedSettings) return defaultSettings;

    const parsedSettings = JSON.parse(decryptedSettings);
    return {
      ...defaultSettings,
      ...parsedSettings,
      apiKey: parsedSettings.apiKey || ''
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return defaultSettings;
  }
};

export const saveSettings = (settings: Settings): void => {
  try {
    // Validate API key before saving
    if (settings.apiKey && !validateApiKey(settings.apiKey)) {
      throw new Error('Invalid API key format');
    }

    // Sanitize settings before saving
    const sanitizedSettings = {
      ...settings,
      model: sanitizeInput(settings.model),
      apiKey: settings.apiKey ? encryptData(settings.apiKey) : ''
    };

    const encryptedSettings = encryptData(JSON.stringify(sanitizedSettings));
    localStorage.setItem('chatopia-settings', encryptedSettings);
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    // Check rate limit
    if (!rateLimiter()) {
      throw new Error('Rate limit exceeded');
    }

    const settings = getSettings();
    if (!settings.apiKey) return false;

    // Validate session
    if (!currentSession || !validateSession(currentSession)) {
      currentSession = createSession();
    }

    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${decryptData(settings.apiKey)}`,
        'X-Session-ID': currentSession
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

export const getModels = async (): Promise<Model[]> => {
  try {
    // Check rate limit
    if (!rateLimiter()) {
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
        'X-Session-ID': currentSession,
        'X-Token': currentToken
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
): Promise<() => void> => {
  const settings = getSettings();
  const controller = new AbortController();

  try {
    // Check rate limit
    if (!rateLimiter()) {
      throw new Error('Rate limit exceeded');
    }

    // Sanitize messages before sending
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      content: sanitizeInput(msg.content)
    }));

    // Validate token
    if (!currentToken || !validateToken(currentToken)) {
      currentToken = createToken();
    }

    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${decryptData(settings.apiKey)}`,
        'X-Session-ID': currentSession,
        'X-Token': currentToken
      },
      body: JSON.stringify({
        messages: sanitizedMessages,
        model: sanitizeInput(settings.model),
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: true
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('Failed to generate completion');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onComplete();
                return;
              }
              try {
                const chunk = JSON.parse(data);
                if (chunk.choices?.[0]?.delta?.content) {
                  onChunk(chunk.choices[0].delta.content);
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }
        onComplete();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          onError(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
      }
    };

    processStream();

    return () => {
      controller.abort();
    };
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    return () => {};
  }
}; 