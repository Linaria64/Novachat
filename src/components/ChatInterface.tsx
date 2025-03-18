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

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<OllamaMessage[]>(() => {
    // Load messages from localStorage if available
    const saved = localStorage.getItem("chatopia-messages");
    return saved ? JSON.parse(saved) : [];
  });
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    if (!isConnected) {
      toast.error("Not connected to Ollama. Please start Ollama and refresh.");
      return;
    }
    
    // Add user message
    const userMessage: OllamaMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    
    // Add placeholder for assistant response
    const assistantPlaceholder: OllamaMessage = { 
      role: "assistant", 
      content: "" 
    };
    
    setMessages((prev) => [...prev, assistantPlaceholder]);
    
    try {
      // Get all messages for context (excluding the empty placeholder)
      const completionMessages = [...messages, userMessage];
      
      // Use streaming API for better UX
      const abort = await generateCompletionStream(
        selectedModel,
        completionMessages,
        // On chunk received
        (chunk) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              lastMessage.content += chunk;
            }
            return newMessages;
          });
        },
        // On complete
        () => {
          setIsTyping(false);
          setAbortController(null);
        },
        // On error
        (error) => {
          console.error("Error generating response:", error);
          setMessages((prev) => {
            const newMessages = [...prev];
            // Remove the placeholder if there was an error
            return newMessages.slice(0, -1);
          });
          setIsTyping(false);
          setAbortController(null);
        }
      );
      
      setAbortController(() => abort);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prev) => prev.slice(0, -1)); // Remove placeholder
      setIsTyping(false);
    }
  }, [input, isConnected, messages, selectedModel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [handleSubmit]);

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
          messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              isLast={index === messages.length - 1 && message.role === "assistant" && isTyping}
            />
          ))
        )}
        {isTyping && messages.length === 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white dark:bg-gray-800 shadow-inner">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type your message... (Ctrl+Enter to send)" : "Start Ollama to begin chatting..."}
            className="flex-1"
            disabled={!isConnected}
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
              disabled={!isConnected || !input.trim()}
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
