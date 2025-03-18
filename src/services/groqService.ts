import { toast } from "sonner";

export type GroqModel = {
  id: string;
  name: string;
  description?: string;
};

export type GroqMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// Configuration
const GROQ_API_URL = "https://api.groq.com/openai/v1";
const API_TIMEOUT = 60000; // 60 seconds timeout
const SETTINGS_KEY = "chatopia-groq-settings";

export const AVAILABLE_MODELS: GroqModel[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    description: "The most capable Llama 3.3 model for a wide range of tasks"
  },
  {
    id: "gemma-1.0-7b-it",
    name: "Gemma 1.0 7B IT",
    description: "Gemma 7B Instruction Tuned model"
  },
  {
    id: "gemma-2-9b-it",
    name: "Gemma 2 9B IT",
    description: "Gemma 2 9B Instruction Tuned model"
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B 32K",
    description: "Mixtral 8x7B model with 32K context window"
  }
];

// Settings type
export interface GroqSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
}

// Default settings
export const defaultSettings: GroqSettings = {
  apiKey: "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",
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 2048,
  streamingEnabled: true
};

// Get current settings
export function getSettings(): GroqSettings {
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
export function saveSettings(settings: GroqSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Helper for fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = API_TIMEOUT) => {
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
  const settings = getSettings();
  
  if (!settings.apiKey) {
    return false;
  }
  
  try {
    const response = await fetchWithTimeout(`${GROQ_API_URL}/models`, {
      headers: {
        "Authorization": `Bearer ${settings.apiKey}`,
      }
    }, 5000);
    
    return response.ok;
  } catch (error) {
    console.error("Error checking connection:", error);
    return false;
  }
}

// Get available models
export async function getModels(): Promise<GroqModel[]> {
  return AVAILABLE_MODELS;
}

// Generate completion
export async function generateCompletion(
  messages: GroqMessage[]
): Promise<string> {
  const settings = getSettings();
  
  if (!settings.apiKey) {
    throw new Error("API key not configured");
  }
  
  try {
    const response = await fetchWithTimeout(`${GROQ_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating completion:", error);
    toast.error("Failed to connect to Groq API");
    throw error;
  }
}

// Stream completion
export async function generateCompletionStream(
  messages: GroqMessage[],
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  const settings = getSettings();
  const controller = new AbortController();
  
  if (!settings.apiKey) {
    onError(new Error("API key not configured"));
    return () => {};
  }
  
  (async () => {
    try {
      const response = await fetchWithTimeout(`${GROQ_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
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
          if (line.startsWith("data: ")) {
            const data = line.substring(6);
            if (data === "[DONE]") continue;
            
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
                fullResponse += content;
              }
            } catch (e) {
              console.warn("Failed to parse JSON from stream:", line);
            }
          }
        }
      }

      onComplete(fullResponse);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error in streaming completion:", error);
        onError(error);
      }
    }
  })();

  // Return abort function
  return () => controller.abort();
} 