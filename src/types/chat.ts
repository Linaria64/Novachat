export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
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