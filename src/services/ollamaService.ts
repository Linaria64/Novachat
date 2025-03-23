import { toast } from "sonner";
import { BaseMessage, MessageRole, OllamaModel } from "@/types/chat";

// Types
export type OllamaMessage = BaseMessage;
export type { OllamaModel };

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

// Constants
const OLLAMA_API_URL = "http://localhost:11434/api/chat";
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const RETRY_COUNT = 2;
const RETRY_DELAY = 1000; // 1 second

// Available models - will be updated dynamically
export let AVAILABLE_MODELS: OllamaModel[] = [
  { id: "llama3", name: "Llama 3" },
  { id: "mistral", name: "Mistral" },
  { id: "gemma", name: "Gemma" },
  { id: "codellama", name: "Code Llama" },
  { id: "phi3", name: "Phi-3" }
];

/**
 * Sleep function for retry mechanism
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get available models from Ollama
 * @returns {Promise<OllamaModel[]>} List of available models
 */
export async function fetchOllamaModels(): Promise<OllamaModel[]> {
  try {
    const response = await fetch("http://localhost:11434/api/tags", {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.models) {
      // Format models
      const models = data.models.map((model: any) => ({
        id: model.name,
        name: model.name.charAt(0).toUpperCase() + model.name.slice(1)
      }));
      
      // Update available models
      AVAILABLE_MODELS = models;
      return models;
    }
    
    return AVAILABLE_MODELS;
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    return AVAILABLE_MODELS; // Return default models on error
  }
}

/**
 * Check connection to Ollama API
 * @returns {Promise<boolean>} Whether connection is successful
 */
export async function checkConnection(): Promise<boolean> {
  try {
    console.log("Checking connection to Ollama API...");
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    
    try {
      const response = await fetch("http://localhost:11434/api/tags", {
        method: "GET",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        console.error("Ollama API error:", response.statusText);
        return false;
      }
      
      // Fetch available models
      await fetchOllamaModels();
      
      console.log("Successfully connected to Ollama API");
      return true;
    } catch (error) {
      clearTimeout(timeoutId);
      const fetchError = error as Error;
      
      if (fetchError.name === 'AbortError') {
        console.error("Connection to Ollama API timed out");
      } else {
        console.error("Fetch error:", fetchError);
      }
      return false;
    }
  } catch (error) {
    console.error("Error checking connection to Ollama API:", error);
    const generalError = error as Error;
    return false;
  }
}

/**
 * Generate a completion using Ollama API with retry mechanism
 * @param {string} model - The model ID to use
 * @param {Array} messages - The conversation messages
 * @param {AbortSignal} signal - Optional AbortSignal for cancellation
 * @returns {Promise<string>} The generated completion
 */
export const generateOllamaCompletion = async (
  model: string,
  messages: { role: string; content: string; }[],
  signal?: AbortSignal
): Promise<string> => {
  let retries = 0;
  
  while (retries <= RETRY_COUNT) {
    try {
      console.log(`Generating completion with Ollama... (Attempt ${retries + 1}/${RETRY_COUNT + 1})`);
      
      const response = await fetch(OLLAMA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.95
          }
        }),
        signal
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Ollama API error:", error);
        
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
        
        throw new Error(error || response.statusText);
      }

      const data = await response.json();
      return data.message?.content || "Désolé, je n'ai pas pu générer de réponse.";
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
