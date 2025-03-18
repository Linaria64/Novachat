import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SendHorizontal, Download, RefreshCw, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ModelSelector from "./ModelSelector";
import ConnectionStatus from "./ConnectionStatus";
import { 
  OllamaMessage, 
  OllamaModel,
  getModels, 
  generateCompletionStream,
  checkConnection,
  getDisplayApiUrl
} from "@/services/ollamaService";
import ThemeToggle from "./ThemeToggle";
import SettingsDialog from "./SettingsDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/types/chat";
import { Toaster } from "@/components/ui/sonner";

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => {
    // Load selected model from localStorage if available
    return localStorage.getItem("chatopia-selected-model") || "llama2";
  });
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [abortController, setAbortController] = useState<(() => void) | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chatopia-messages", JSON.stringify(messages));
  }, [messages]);

  // Save selected model to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("chatopia-selected-model", selectedModel);
  }, [selectedModel]);

  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
    
    // Setup interval to check connection status
    const interval = setInterval(checkConnectionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when connection status changes
  useEffect(() => {
    if (isConnected && !isTyping) {
      inputRef.current?.focus();
    }
  }, [isConnected, isTyping]);

  const checkConnectionStatus = useCallback(async () => {
    const connected = await checkConnection();
    if (connected !== isConnected) {
      setIsConnected(connected);
      if (connected && !isConnected) {
        fetchModels();
        toast.success("Connected to Ollama");
      }
    }
  }, [isConnected]);

  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const modelList = await getModels();
      setModels(modelList);
      setIsConnected(true);
      
      // Set default model if available and none selected
      if (modelList.length > 0 && selectedModel === "") {
        setSelectedModel(modelList[0].name);
      }
    } catch (error) {
      setIsConnected(false);
      if (models.length > 0) {
        toast.error("Lost connection to Ollama");
      }
    } finally {
      setIsLoadingModels(false);
    }
  }, [models.length, selectedModel]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoadingModels) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const ollamaMessages: OllamaMessage[] = [...messages, userMessage].map(msg => ({
        role: msg.role === "system" ? "assistant" : msg.role,
        content: msg.content
      }));

      generateCompletionStream(
        selectedModel,
        ollamaMessages,
        (chunk: string) => {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              return [
                ...prevMessages.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + chunk },
              ];
            }
            return [
              ...prevMessages,
              { role: "assistant", content: chunk },
            ];
          });
        },
        () => {
          setIsTyping(false);
          setAbortController(null);
        },
        (error: Error) => {
          console.error("Error generating completion:", error);
          toast.error("Failed to generate response");
          setIsTyping(false);
          setAbortController(null);
        }
      );
    } catch (error) {
      toast.error("Failed to generate response");
      setIsTyping(false);
    }
  }, [input, isLoadingModels, messages, selectedModel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSend();
    }
  }, [handleSend]);

  const handleModelChange = useCallback((modelName: string) => {
    setSelectedModel(modelName);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController();
      setAbortController(null);
      setIsTyping(false);
      toast.info("Response generation stopped");
    }
  }, [abortController]);

  const clearConversation = useCallback(() => {
    if (messages.length === 0) return;
    
    setMessages([]);
    toast.success("Conversation cleared");
  }, [messages.length]);

  const downloadConversation = useCallback(() => {
    if (messages.length === 0) {
      toast.info("No conversation to download");
      return;
    }
    
    const text = messages
      .map((msg) => `${msg.role === "user" ? "You" : "AI"}: ${msg.content}`)
      .join("\n\n");
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatopia-conversation-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Conversation downloaded");
  }, [messages]);

  const handleSettingsChange = useCallback(() => {
    // Clear connection status cache to force a recheck
    setIsConnected(false);
    // Clear models cache
    setModels([]);
    // Check connection with new settings
    checkConnectionStatus();
    // Fetch models with new settings
    fetchModels();
  }, [checkConnectionStatus, fetchModels]);

  // Memoize the welcome screen to prevent unnecessary re-renders
  const welcomeScreen = useMemo(() => {
    const apiUrl = getDisplayApiUrl();
    
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-bold">Welcome to Chatopia</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Your private and secure way to chat with locally hosted AI models.
            {!isConnected && (
              <span className="block mt-2 text-red-500 font-medium">
                Please start Ollama to begin chatting.
              </span>
            )}
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Connected to: <span className="font-mono">{apiUrl}</span>
          </div>
          {isConnected && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-sm text-left shadow-sm">
              <p className="font-medium mb-2">Try asking:</p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Tell me about the benefits of local AI models</li>
                <li>• Write a short story about a robot learning to cook</li>
                <li>• Explain quantum computing like I'm five</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }, [isConnected]);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster />
      {/* Header */}
      <header className="flex justify-between items-center border-b p-4 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Chatopia
          </h1>
          <div className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
            Local LLM
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ConnectionStatus isConnected={isConnected} />
          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            isLoading={isLoadingModels}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchModels()}
            title="Refresh models"
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={clearConversation}
            disabled={messages.length === 0}
            title="Clear conversation"
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={downloadConversation}
            disabled={messages.length === 0}
            title="Download conversation"
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
          <SettingsDialog onSettingsChange={handleSettingsChange} />
          <ThemeToggle />
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-0">
        {messages.length === 0 ? (
          welcomeScreen
        ) : (
          // Message list
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 p-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role === "system" ? "assistant" : message.role}
                  content={message.content}
                />
              ))}
            </div>
          </ScrollArea>
        )}
        {isTyping && messages.length === 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white dark:bg-gray-800 shadow-inner">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type your message... (Ctrl+Enter to send)" : "Start Ollama to begin chatting..."}
            className="flex-1"
            disabled={!isConnected || isLoadingModels}
          />
          {isTyping ? (
            <Button 
              type="button" 
              onClick={stopGeneration}
              variant="destructive"
            >
              Stop
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!isConnected || !input.trim() || isLoadingModels}
            >
              <SendHorizontal className="h-4 w-4 mr-2" />
              Send
            </Button>
          )}
        </form>
        {!isConnected && (
          <div className="text-xs mt-2 text-red-500">
            Not connected to Ollama. Please make sure it's running on http://localhost:11434
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
