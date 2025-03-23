import { toast } from "sonner";
import { BaseMessage, MessageRole, GroqModel } from "@/types/chat";

// Types
export type GroqMessage = BaseMessage;
export type { GroqModel };

export interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: MessageRole;
    };
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Constants
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const SETTINGS_KEY = "chatopia-groq-api-key";
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const RETRY_COUNT = 2;
const RETRY_DELAY = 1000; // 1 second

// Default API key
if (!localStorage.getItem(SETTINGS_KEY)) {
  localStorage.setItem(SETTINGS_KEY, "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");
}

// Available models
export const AVAILABLE_MODELS: GroqModel[] = [
  { id: "llama3-70b-8192", name: "Llama 3 70B" },
  { id: "qwen-qwq-32b", name: "Qwen QWQ 32B" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
  { id: "llama3-8b-8192", name: "Llama 3 8B" },
  { id: "gemma-7b-it", name: "Gemma 7B" }
];

/**
 * Get the API key from localStorage
 * @returns {string} The API key
 */
export function getApiKey(): string {
  const apiKey = localStorage.getItem(SETTINGS_KEY);
  return apiKey || "";
}

/**
 * Set the API key in localStorage
 * @param {string} key - The API key to store
 */
export function setApiKey(key: string): void {
  localStorage.setItem(SETTINGS_KEY, key);
}

/**
 * Sleep function for retry mechanism
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check connection to Groq API
 * @returns {Promise<boolean>} Whether connection is successful
 */
export async function checkConnection(): Promise<boolean> {
  try {
    console.log("Checking connection to Groq API...");
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error("No Groq API key found");
      return false;
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 1
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        const error = await response.json();
        console.error("Groq API error:", error);
        return false;
      }
      
      console.log("Successfully connected to Groq API");
      return true;
    } catch (error) {
      clearTimeout(timeoutId);
      const fetchError = error as Error;
      
      if (fetchError.name === 'AbortError') {
        console.error("Connection to Groq API timed out");
      } else {
        console.error("Fetch error:", fetchError);
      }
      return false;
    }
  } catch (error) {
    console.error("Error checking connection to Groq API:", error);
    const generalError = error as Error;
    return false;
  }
}

/**
 * Generate a completion using Groq API with retry mechanism
 * @param {string} model - The model ID to use
 * @param {Array} messages - The conversation messages
 * @param {AbortSignal} signal - Optional AbortSignal for cancellation
 * @returns {Promise<string>} The generated completion
 */
export const generateGroqCompletion = async (
  model: string,
  messages: { role: string; content: string; }[],
  signal?: AbortSignal
): Promise<string> => {
  let retries = 0;
  
  while (retries <= RETRY_COUNT) {
    try {
      console.log(`Generating completion with Groq... (Attempt ${retries + 1}/${RETRY_COUNT + 1})`);
      const apiKey = getApiKey();
      
      if (!apiKey) {
        throw new Error("Aucune clé API trouvée");
      }
      
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0
        }),
        signal
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Groq API error:", error);
        
        // Check for rate limiting or server errors that might be temporary
        if (response.status === 429 || response.status >= 500) {
          if (retries < RETRY_COUNT) {
            retries++;
            const delay = RETRY_DELAY * retries;
            console.log(`Retrying in ${delay}ms...`);
            await sleep(delay);
            continue;
          }
        }
        
        throw new Error(error.error?.message || response.statusText);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      const typedError = error as Error;
      
      // Don't retry if it's an abort error
      if (typedError.name === 'AbortError') {
        console.log("Request aborted by user");
        throw error;
      }
      
      // Don't retry if we've hit the maximum retries
      if (retries >= RETRY_COUNT) {
        console.error("Maximum retries reached. Error:", typedError);
        throw error;
      }
      
      // Retry for network errors
      retries++;
      const delay = RETRY_DELAY * retries;
      console.log(`Network error, retrying in ${delay}ms...`, typedError);
      await sleep(delay);
    }
  }
  
  // This should never happen, but TypeScript requires a return statement
  throw new Error("Failed to generate completion after retries");
};

/**
 * Generate a streaming completion using Groq API
 * @param {string} model - The model ID to use
 * @param {BaseMessage[]} messages - The conversation messages
 * @param {Function} onChunk - Callback for each content chunk
 * @param {Function} onComplete - Callback when generation completes
 * @param {Function} onError - Callback for errors
 */
export const generateCompletionStream = async (
  model: string,
  messages: BaseMessage[],
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error?: Error) => void
) => {
  let retries = 0;
  
  while (retries <= RETRY_COUNT) {
    try {
      console.log(`Streaming completion with Groq... (Attempt ${retries + 1}/${RETRY_COUNT + 1})`);
      const apiKey = getApiKey();
      
      if (!apiKey) {
        toast.error("Aucune clé API Groq trouvée. Veuillez la définir dans les paramètres.");
        onError(new Error("Aucune clé API trouvée"));
        return;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
      
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Groq API error:", error);
        
        // Check for rate limiting or server errors that might be temporary
        if (response.status === 429 || response.status >= 500) {
          if (retries < RETRY_COUNT) {
            retries++;
            const delay = RETRY_DELAY * retries;
            console.log(`Retrying stream in ${delay}ms...`);
            await sleep(delay);
            continue;
          }
        }
        
        toast.error(`Erreur API Groq: ${error.error?.message || response.statusText}`);
        onError(new Error(error.error?.message || response.statusText));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Aucun lecteur disponible");
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error("Failed to parse chunk:", e);
            }
          }
        }
      }
      onComplete();
      return; // Success, exit the retry loop
    } catch (error) {
      const typedError = error as Error;
      
      // Don't retry if it's an abort error
      if (typedError.name === 'AbortError') {
        console.log("Stream request aborted");
        onError(typedError);
        return;
      }
      
      // Don't retry if we've hit the maximum retries
      if (retries >= RETRY_COUNT) {
        console.error("Maximum stream retries reached. Error:", typedError);
        toast.error(`Échec de la génération du stream: ${typedError.message || 'Erreur inconnue'}`);
        onError(typedError);
        return;
      }
      
      // Retry for network errors
      retries++;
      const delay = RETRY_DELAY * retries;
      console.log(`Network error in stream, retrying in ${delay}ms...`, typedError);
      await sleep(delay);
    }
  }
}; 