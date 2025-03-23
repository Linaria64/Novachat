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
  id: string;
  name: string;
  size?: string;
  quantization?: string;
  format?: string;
}

export interface GroqModel {
  id: string;
  name: string;
  maxTokens?: number;
  description?: string;
}

export interface Message extends BaseMessage {
  id: string;
  timestamp: Date;
  model?: string;
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

export interface User {
  id: string;
  username: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  notifications: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
} 