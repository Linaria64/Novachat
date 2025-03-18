import { toast } from "sonner";
import { BaseMessage, MessageRole, GroqModel } from "@/types/chat";

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

// Configuration
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const SETTINGS_KEY = "chatopia-groq-api-key";

// Précharger la clé API
if (!localStorage.getItem(SETTINGS_KEY)) {
  localStorage.setItem(SETTINGS_KEY, "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");
}

// Modèles Groq disponibles
export const AVAILABLE_MODELS: GroqModel[] = [
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
  { id: "llama3-8b-8192", name: "Llama 3 8B" },
  { id: "llama3-70b-8192", name: "Llama 3 70B" },
  { id: "gemma-7b-it", name: "Gemma 7B" }
];

// Obtenir la clé API depuis le localStorage
export function getApiKey(): string {
  const apiKey = localStorage.getItem(SETTINGS_KEY);
  return apiKey || "";
}

// Vérifier la connexion à l'API Groq
export async function checkConnection(): Promise<boolean> {
  try {
    console.log("Checking connection to Groq API...");
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error("No Groq API key found");
      return false;
    }
    
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Groq API error:", error);
      toast.error(`Groq API error: ${error.error?.message || response.statusText}`);
      return false;
    }
    
    console.log("Successfully connected to Groq API");
    return true;
  } catch (error) {
    console.error("Error checking connection to Groq API:", error);
    toast.error("Failed to connect to Groq API");
    return false;
  }
}

// Stream completion
export const generateCompletionStream = async (
  model: string,
  messages: BaseMessage[],
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: () => void
) => {
  try {
    console.log("Generating completion with Groq...");
    const apiKey = getApiKey();
    
    if (!apiKey) {
      toast.error("No Groq API key found. Please set it in the settings.");
      onError();
      return;
    }
    
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
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Groq API error:", error);
      toast.error(`Groq API error: ${error.error?.message || response.statusText}`);
      onError();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No reader available");
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
  } catch (error) {
    console.error("Error in generateCompletionStream:", error);
    toast.error("Failed to generate response");
    onError();
  }
}; 