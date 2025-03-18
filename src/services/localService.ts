export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Model {
  id: string;
  name: string;
  description?: string;
}

export interface Settings {
  model: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
}

const defaultSettings: Settings = {
  model: "local",
  temperature: 0.7,
  maxTokens: 2000,
  streamingEnabled: true
};

export const AVAILABLE_MODELS: Model[] = [
  {
    id: "local",
    name: "Local Model",
    description: "Default local model"
  }
];

export const getSettings = (): Settings => {
  const saved = localStorage.getItem("chatopia-settings");
  return saved ? JSON.parse(saved) : defaultSettings;
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem("chatopia-settings", JSON.stringify(settings));
};

export const checkConnection = async (): Promise<boolean> => {
  return true; // Always connected in local mode
};

export const getModels = async (): Promise<Model[]> => {
  return AVAILABLE_MODELS;
};

export const generateCompletionStream = async (
  messages: Message[],
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<() => void> => {
  try {
    // Simulate streaming response
    const words = "I am a local AI assistant. I can help you with various tasks.".split(" ");
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < words.length) {
        onChunk(words[i] + " ");
        i++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 100);
    
    return () => {
      clearInterval(interval);
      onComplete();
    };
  } catch (error) {
    onError(error as Error);
    return () => {};
  }
}; 