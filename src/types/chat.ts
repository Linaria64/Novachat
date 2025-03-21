export type MessageRole = "user" | "assistant" | "system";

export interface BaseMessage {
  role: MessageRole;
  content: string;
}

export interface ChatSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface GroqModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  choices: {
    delta: {
      content?: string;
    };
  }[];
}

export interface Settings {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  streamingEnabled?: boolean;
}

export interface Model {
  id: string;
  name: string;
  description: string;
}

export interface Preview {
  type: "code" | "image" | "text" | "terminal";
  content: string;
  language?: string;
  title?: string;
}

export interface DevModeInfo {
  model: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
  connectionStatus: string;
  messageCount: number;
  lastResponseTime: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
} 