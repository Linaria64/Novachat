import { Message, Settings, Model } from "@/types/chat";

const API_URL = import.meta.env.VITE_API_URL;
const APP_ENV = import.meta.env.VITE_APP_ENV;

const defaultSettings: Settings = {
  model: 'local-model',
  temperature: 0.7,
  maxTokens: 2000,
  apiKey: '',
  streamingEnabled: true
};

export const getSettings = (): Settings => {
  const savedSettings = localStorage.getItem('chatopia-settings');
  return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem('chatopia-settings', JSON.stringify(settings));
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

export const getModels = async (): Promise<Model[]> => {
  try {
    const response = await fetch(`${API_URL}/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    return await response.json();
  } catch (error) {
    try {
      const settings = getSettings();
      const response = await fetch(`${API_URL}/api/models`, {
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  }
};

export const generateCompletionStream = async (
  messages: Message[],
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<() => void> => {
  const settings = getSettings();
  const controller = new AbortController();

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        messages,
        model: settings.model,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: true
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('Failed to generate completion');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onComplete();
                return;
              }
              try {
                const chunk = JSON.parse(data);
                if (chunk.choices?.[0]?.delta?.content) {
                  onChunk(chunk.choices[0].delta.content);
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }
        onComplete();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          onError(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
      }
    };

    processStream();

    return () => {
      controller.abort();
    };
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    return () => {};
  }
}; 