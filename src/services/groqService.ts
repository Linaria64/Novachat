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

// Default models
export const DEFAULT_MODEL = "llama3-70b-8192";
export const REASONING_MODEL = "qwen-qwq-32b";

// Get API key from local storage
export const getApiKey = (): string => {
  // Lire directement depuis le localStorage
  const groqApiKey = localStorage.getItem("chatopia-groq-api-key");
  if (groqApiKey && groqApiKey.startsWith("gsk_")) {
    return groqApiKey;
  }
  
  // Clé API par défaut si aucune clé personnalisée n'est trouvée
  const defaultApiKey = "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";
  
  // Sauvegarder la clé par défaut
  localStorage.setItem("chatopia-groq-api-key", defaultApiKey);
  
  return defaultApiKey;
};

/**
 * Set the API key in localStorage
 * @param {string} apiKey - The API key to set
 */
export function setApiKey(apiKey: string): void {
  localStorage.setItem(SETTINGS_KEY, apiKey);
}

/**
 * Check if the connection to the Groq API is successful
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API key not found");
    return false;
  }

  try {
    // Pour éviter les délais trop longs, on réduit le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s au lieu de 10s

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 1, // Réduire pour accélérer la vérification
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    // Si on a une réponse mais pas de clé API valide, enregistrer qu'on est déconnecté
    if (!response.ok) {
      console.error("Groq API connection failed:", await response.json());
      return false;
    }
    
    // On a réussi à se connecter
    return true;
    
  } catch (error) {
    console.error("Connection check failed:", error);
    // En cas d'erreur réseau, retourner true pour éviter de bloquer l'interface
    return true;
  }
}

/**
 * Determine if a message requires reasoning
 * @param {string} messageContent - The message content to analyze
 * @returns {boolean} True if the message requires reasoning
 */
function requiresReasoning(messageContent: string): boolean {
  const reasoningKeywords = [
    "raisonne", "analyse", "évalue", "compare", "explique pourquoi", 
    "justifie", "démontre", "prouve", "reason", "analyze", "evaluate", 
    "compare", "explain why", "justify", "demonstrate", "prove",
    "étape par étape", "step by step", "résous", "solve"
  ];
  
  const lowercaseContent = messageContent.toLowerCase();
  return reasoningKeywords.some(keyword => lowercaseContent.includes(keyword));
}

/**
 * Get the appropriate model based on message content
 * @param {string} messageContent - The message content to analyze
 * @returns {string} The model ID to use
 */
export function getModelForMessage(messageContent: string): string {
  // Check if a specific model is selected in the UI
  const selectedGroqModel = (window as any).selectedGroqModel;
  const selectedQwqModel = (window as any).selectedQwqModel;
  
  // If message requires reasoning, use the reasoning model
  if (requiresReasoning(messageContent)) {
    return selectedQwqModel || REASONING_MODEL;
  }
  
  // Otherwise use the default or selected model
  return selectedGroqModel || DEFAULT_MODEL;
}

/**
 * Generate a stream of completion tokens from Groq API
 * @param {GroqMessage[]} messages - The messages to generate completion from
 * @param {GroqModel["id"]} model - Optional model override
 * @returns {Promise<ReadableStream>} A stream of completion tokens
 */
export async function generateCompletionStream(
  messages: GroqMessage[],
  model?: GroqModel["id"]
): Promise<ReadableStream> {
  // Check if we have an API key
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("No Groq API key found");
    throw new Error("Missing API key");
  }

  // Get last message for model selection
  const lastMessage = messages[messages.length - 1];
  // Determine which model to use based on the content
  const modelToUse = model || getModelForMessage(lastMessage.content);
  
  // Log which model is being used
  console.log(`Using model: ${modelToUse} for completion`);

  // Format messages for the API
  const formattedMessages = messages.map(message => ({
    role: message.role,
    content: message.content
  }));

  // Parameters for the request
  const params = {
    model: modelToUse,
    messages: formattedMessages,
    stream: true,
    temperature: 0.7,
    max_tokens: 4000
  };

  // Configure the request with retry logic
  let retries = 0;
  
  while (retries <= RETRY_COUNT) {
    try {
      const response = await fetch(`${GROQ_API_URL}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Groq API error:", errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      return response.body;
    } catch (error) {
      retries++;
      console.error(`Attempt ${retries}/${RETRY_COUNT + 1} failed:`, error);

      // If we've reached the max number of retries, throw the error
      if (retries > RETRY_COUNT) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }

  // This should never be reached, but TypeScript needs a return statement
  throw new Error("Failed to generate completion after retries");
}

/**
 * Process a stream of completion tokens
 * @param {ReadableStream} stream - The stream to process
 * @param {Function} onChunk - Callback for each chunk of content
 * @param {Function} onComplete - Callback for when the stream completes
 * @param {Function} onError - Callback for when an error occurs
 */
async function processCompletionStream(
  stream: ReadableStream,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonData = line.slice(6);
          if (jsonData === "[DONE]") continue;
          
          try {
            const data = JSON.parse(jsonData) as GroqResponse;
            const content = data.choices[0]?.delta?.content || "";
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.error("Error parsing streaming JSON:", e);
          }
        }
      }
    }
    
    onComplete();
  } catch (error) {
    console.error("Stream reading error:", error);
    onError(error as Error);
  } finally {
    reader.releaseLock();
  }
}

/**
 * Unified function to generate completions from Groq API - supports both streaming and non-streaming
 * 
 * Overload 1: Used by components that handle streaming themselves
 * @param {string} model - The model to use
 * @param {BaseMessage[]} messages - The messages to complete
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<string>} The completion text
 * 
 * Overload 2: Used with callbacks for streaming
 * @param {string} model - The model to use
 * @param {BaseMessage[]} messages - The messages to complete
 * @param {Function} onChunk - Callback for chunks
 * @param {Function} onComplete - Callback when complete
 * @param {Function} onError - Callback for errors
 * @returns {Promise<void>} Nothing
 */
export async function generateGroqCompletion(
  model: string,
  messages: BaseMessage[],
  signalOrChunk: AbortSignal | ((chunk: string) => void),
  onComplete?: () => void,
  onError?: (error?: Error) => void
): Promise<string | void> {
  // Get last message for model selection
  const lastMessage = messages[messages.length - 1];
  // For automatic model selection based on content
  const modelToUse = model === "auto" 
    ? getModelForMessage(lastMessage.content) 
    : model;
  
  console.log(`Using model: ${modelToUse} for completion`);
  
  // Determine if we're in streaming or non-streaming mode
  const isStreaming = typeof signalOrChunk === "function";
  
  if (isStreaming && onComplete && onError) {
    // Streaming mode with callbacks
    const onChunk = signalOrChunk as (chunk: string) => void;
    
    try {
      const stream = await generateCompletionStream(messages, modelToUse as GroqModel["id"]);
      await processCompletionStream(stream, onChunk, onComplete, onError);
    } catch (error) {
      console.error("Error in streaming mode:", error);
      onError(error as Error);
    }
    
    return;
  } else {
    // Non-streaming mode (returns full response)
    const signal = signalOrChunk as AbortSignal;
    let retries = 0;
    
    while (retries <= RETRY_COUNT) {
      try {
        console.log(`Generating non-streaming completion... (Attempt ${retries + 1}/${RETRY_COUNT + 1})`);
        const apiKey = getApiKey();
        
        if (!apiKey) {
          throw new Error("No API key found");
        }
        
        // Format messages for the API
        const formattedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: formattedMessages,
            temperature: 0.7,
            max_tokens: 4000,
            stream: false
          }),
          signal
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error("Groq API error:", error);
          throw new Error(error.error?.message || response.statusText);
        }
        
        const data = await response.json();
        return data.choices[0]?.message?.content || "";
      } catch (error) {
        const typedError = error as Error;
        
        // If it's an abort signal, don't retry
        if (typedError.name === "AbortError") {
          throw typedError;
        }
        
        // If we've reached the max number of retries, throw the error
        if (retries >= RETRY_COUNT) {
          console.error("Maximum retries reached:", typedError);
          throw typedError;
        }
        
        retries++;
        const delay = RETRY_DELAY * retries;
        console.log(`Retrying in ${delay}ms...`, typedError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error("Failed to generate completion after retries");
  }
} 