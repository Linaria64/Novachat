export interface Model {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  externalLink?: string;
}

export interface GroqModel {
  id: string;
  name: string;
  context_length: number;
  created_at: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  messages: Message[];
  modelId?: string;
} 