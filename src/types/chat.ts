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