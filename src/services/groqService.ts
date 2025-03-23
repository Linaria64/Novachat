import { BaseMessage, MessageRole, GroqModel } from "@/types/chat";
import { getApiKey } from "@/services/localService";

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
export const AVAILABLE_MODELS = [
  { id: "llama3-70b-8192", name: "Llama 3 (70B)" },
  { id: "llama3-8b-8192", name: "Llama 3 (8B)" },
  { id: "mixtral-8x7b-32768", name: "Mixtral (8x7B)" },
  { id: "gemma-7b-it", name: "Gemma (7B)" },
  { id: "qwen-qwq-32b", name: "Qwen QWQ (32B)" }
];

// Default models
export const DEFAULT_MODEL = "llama3-70b-8192";
export const REASONING_MODEL = "qwen-qwq-32b";

/**
 * Check if the connection to the Groq API is successful
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API key not found");
    return false; // Retourne false si pas de clé
  }

  console.log("Tentative de connexion à Groq avec la clé API:", apiKey.substring(0, 10) + "...");
  
  try {
    // Faire un appel d'essai pour vérifier la connexion
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 5
      })
    });
    
    if (response.ok) {
      console.log("Connexion réussie à Groq");
      return true;
    } else {
      console.error("Échec de la connexion à Groq:", await response.text());
      return false;
    }
  } catch (error) {
    console.error("Connection check failed:", error);
    return false;
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
 * Generate a completion using the Groq API
 * @param options Generation options
 * @returns Completion response
 */
export async function generateGroqCompletion(
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    streamCallback?: (chunk: string) => void;
    messages?: BaseMessage[];
  }
): Promise<string> {
  // Get API key
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API key not found");
    return "Je ne peux pas vous aider pour le moment car la clé API n'est pas configurée. Veuillez configurer une clé API Groq dans les paramètres.";
  }

  // Configuration des paramètres de génération
  const model = options?.model || DEFAULT_MODEL;
  const temperature = options?.temperature !== undefined ? options?.temperature : 0.7;
  const maxTokens = options?.maxTokens || 4000;
  const stream = !!options?.streamCallback;
  
  // Messages à envoyer à l'API
  const messages = options?.messages || [{ role: "user" as MessageRole, content: "Présente-toi brièvement." }];
  
  console.log(`Génération de complétion avec le modèle ${model} (streaming: ${stream ? 'oui' : 'non'})`);

  try {
    // Appel à l'API Groq
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: stream
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API Groq: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Erreur API Groq (${response.status}): ${errorText}`);
    }

    // Gérer le streaming si demandé
    if (stream && options?.streamCallback) {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Le corps de la réponse est vide");
      }

      let completeResponse = "";
      
      // Lire le stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convertir la réponse en texte
        const chunk = new TextDecoder().decode(value);
        
        // Traiter chaque ligne du flux SSE
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') continue;
            
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content;
              
              if (content) {
                completeResponse += content;
                options.streamCallback(content);
              }
            } catch (e) {
              console.error("Erreur lors du parsing JSON:", e);
            }
          }
        }
      }
      
      return completeResponse;
    } else {
      // Mode non-streaming
      const data = await response.json();
      return data.choices[0]?.message?.content || "Pas de réponse générée";
    }
  } catch (error) {
    console.error("Erreur lors de la génération:", error);
    return `Une erreur est survenue lors de la communication avec l'API Groq. Détails: ${error instanceof Error ? error.message : String(error)}`;
  }
} 