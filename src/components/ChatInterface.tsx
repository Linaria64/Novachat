import { useState, useEffect, useRef, useCallback } from "react";
import { Send, X, Bot, Brain, Trash, ChevronDown, MessageSquare } from "lucide-react";
import { generateGroqCompletion, checkConnection, AVAILABLE_MODELS } from "@/services/groqService";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/components/ChatMessage";

// Constants
const MESSAGE_HISTORY_LIMIT = 10;
const TEXTAREA_MAX_HEIGHT_MOBILE = 150;
const TEXTAREA_MAX_HEIGHT_DESKTOP = 200;
const AUTO_SCROLL_DELAY = 100;

// Message roles
const MessageRole = {
  User: "user" as const,
  Assistant: "assistant" as const,
  System: "system" as const
};

// Types
interface ChatInterfaceProps {
  className?: string;
}

// Main component
const ChatInterface = ({ className }: ChatInterfaceProps) => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<"normal" | "reasoning">("normal");
  const [selectedModel] = useState<string>("llama3-70b-8192");
  const [_isConnected, setIsConnected] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Check API connection
  const fetchModels = useCallback(async () => {
    try {
      const isConnected = await checkConnection();
      setIsConnected(isConnected);
      
      if (isConnected) {
        toast.success("Connecté à l'API Groq");
      } else {
        toast.error("Impossible de se connecter à l'API Groq");
      }
    } catch (error) {
      console.error("Error checking API connection:", error);
      setIsConnected(false);
      toast.error("Impossible de récupérer les modèles. Veuillez vérifier votre connexion.");
    }
  }, []);
  
  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  
  // Abort generation function
  const abortFunction = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      toast.info("Génération arrêtée");
    }
  }, []);
  
  // Send message handler
  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.User,
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    
    // Create AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Determine model based on selected mode
    let modelToUse = selectedModel;
    
    if (selectedMode === "reasoning") {
      const qwenModel = AVAILABLE_MODELS.find(model => model.id === "qwen-qwq-32b");
      if (qwenModel) {
        modelToUse = qwenModel.id;
      }
    }
    
    try {
      setIsGenerating(true);
      
      // Create empty assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.Assistant,
        content: "",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Scroll to empty message immediately
      setTimeout(scrollToBottom, AUTO_SCROLL_DELAY);
      
      // Get conversation context
      const conversationContext = messages
        .slice(-MESSAGE_HISTORY_LIMIT)
        .map((msg) => ({
          role: msg.role.toLowerCase(),
          content: msg.content,
        }));
      
      // Add user message to context
      conversationContext.push({
        role: "user",
        content: input.trim(),
      });
      
      // Generate completion
      const response = await generateGroqCompletion(
        modelToUse,
        conversationContext,
        signal
      );
      
      // Update assistant message with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: response }
            : msg
        )
      );
    } catch (error: any) {
      // Check if abort error
      if (error.name === "AbortError") {
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      
      console.error("Error generating completion:", error);
      
      // Show error toast
      toast.error(`Erreur: ${error.message || "Une erreur est survenue"}`);
      
      // Update assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === (prev[prev.length - 1]?.id || "")
            ? {
                ...msg,
                content:
                  "Désolé, une erreur est survenue lors de la génération de la réponse.",
              }
            : msg
        )
      );
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
      
      // Scroll after response
      setTimeout(scrollToBottom, AUTO_SCROLL_DELAY);
    }
  }, [input, isGenerating, messages, scrollToBottom, selectedMode, selectedModel]);
  
  // Input handler
  const handleTyping = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const target = e.target;
    target.style.height = 'auto';
    const maxHeight = isMobile ? TEXTAREA_MAX_HEIGHT_MOBILE : TEXTAREA_MAX_HEIGHT_DESKTOP;
    const newHeight = Math.min(target.scrollHeight, maxHeight);
    target.style.height = `${newHeight}px`;
  }, [isMobile]);
  
  // Key handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  
  // Clear messages function
  const clearMessages = useCallback(() => {
    setMessages([]);
    // Stop ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);
  
  // Mode change handler
  const handleModeChange = useCallback((mode: "normal" | "reasoning") => {
    setSelectedMode(mode);
    toast.info(`Mode ${mode === "normal" ? "normal" : "raisonnement"} activé`);
  }, []);
  
  // Effects
  useEffect(() => {
    const checkLoading = () => {
      // Check if application has loaded
      const bodyClass = document.body.classList;
      setIsLoadingComplete(!bodyClass.contains("loading-active"));
      
      if (!bodyClass.contains("loading-active")) {
        // Focus input when loaded
        inputRef.current?.focus();
        fetchModels();
      }
    };
    
    // Handle loading complete event
    const handleLoadingComplete = () => {
      setIsLoadingComplete(true);
      inputRef.current?.focus();
      fetchModels();
    };
    
    // Check initial loading state
    checkLoading();
    
    // Listen for loading complete event
    window.addEventListener("novachat:loading-complete", handleLoadingComplete);
    
    // Clean up event listener
    return () => {
      window.removeEventListener("novachat:loading-complete", handleLoadingComplete);
    };
  }, [fetchModels]);
  
  // Listen for conversation events
  useEffect(() => {
    // Handle new conversation event
    const handleNewConversation = () => {
      // Clear messages and abort any ongoing generation
      clearMessages();
      
      // Focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      // Show toast
      toast.success("Nouvelle conversation démarrée");
    };
    
    // Listen for new conversation event
    window.addEventListener("novachat:new-conversation", handleNewConversation);
    
    // Clean up event listener
    return () => {
      window.removeEventListener("novachat:new-conversation", handleNewConversation);
    };
  }, [clearMessages]);
  
  // Check window size
  useEffect(() => {
    // Resize handler
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Listen for resize events
    window.addEventListener("resize", handleResize);
    
    // Clean up event listener
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  
  // Scroll button visibility
  useEffect(() => {
    // Check scroll position
    const checkScroll = () => {
      if (!chatContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShowScrollButton(!isNearBottom);
    };
    
    // Add scroll event listener to chat container
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", checkScroll);
    }
    
    // Clean up event listener
    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener("scroll", checkScroll);
      }
    };
  }, []);
  
  return (
    <div className={cn("flex flex-col h-screen bg-black", className)}>
      <div className="flex-1 overflow-hidden relative">
        <div 
          ref={chatContainerRef}
          className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="text-center py-8 px-6 rounded-2xl bg-gray-900/50 border border-gray-800 animate-fade-in-up">
                <Bot className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-300 text-sm">
                  {selectedMode === "normal" 
                    ? "Posez une question ou démarrez une conversation."
                    : "Mode Raisonnement activé. Posez une question complexe pour obtenir un raisonnement étape par étape."
                  }
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
            
            {/* Scroll to bottom button */}
            {showScrollButton && messages.length > 0 && (
              <button
                className="fixed bottom-[80px] right-4 bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:bg-gray-700 animate-bounce-slow"
                onClick={scrollToBottom}
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 bg-black">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-end gap-2 bg-gray-900/50 p-4 rounded-2xl border border-gray-800 animate-fade-in">
            {!isMobile && (
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "rounded-full w-10 h-10 bg-gray-900 transition-all duration-300",
                  selectedMode === "normal" 
                    ? "text-blue-400 hover:shadow-[0_0_5px_rgba(59,130,246,0.5)] hover:border-blue-500/30"
                    : "text-purple-400 hover:shadow-[0_0_5px_rgba(124,58,237,0.5)] hover:border-purple-500/30"
                )}
                onClick={() => handleModeChange(selectedMode === "normal" ? "reasoning" : "normal")}
              >
                {selectedMode === "normal" ? (
                  <MessageSquare className="w-5 h-5 transition-transform hover:scale-110" />
                ) : (
                  <Brain className="w-5 h-5 transition-transform hover:scale-110" />
                )}
              </Button>
            )}

            <Textarea
              ref={inputRef}
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedMode === "normal"
                  ? "Posez votre question..."
                  : "Posez une question complexe pour obtenir un raisonnement détaillé..."
              }
              className="min-h-[50px] flex-1 resize-none rounded-xl bg-gray-900 border-gray-800 placeholder-gray-500 text-white focus:ring-0 focus:border-gray-700 transition-all"
              disabled={!isLoadingComplete || isGenerating}
            />

            <div className="flex items-center gap-2">
              {isGenerating ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={abortFunction}
                  className="rounded-full w-10 h-10 bg-gray-900 text-red-400 hover:shadow-[0_0_5px_rgba(239,68,68,0.5)] hover:border-red-500/30 animate-pulse"
                  disabled={!isLoadingComplete}
                >
                  <X className="w-5 h-5" />
                </Button>
              ) : (
                <>
                  {messages.length > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={clearMessages}
                      className="rounded-full w-10 h-10 bg-gray-900 text-gray-400 hover:shadow-[0_0_5px_rgba(156,163,175,0.3)] hover:border-gray-500/30 transition-transform hover:scale-105"
                      disabled={!isLoadingComplete || messages.length === 0}
                    >
                      <Trash className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    onClick={handleSend}
                    className={cn(
                      "rounded-full w-10 h-10 transition-all duration-300 hover:scale-105",
                      selectedMode === "reasoning" 
                        ? "bg-gray-900 text-purple-400 border border-purple-500/30 shadow-[0_0_8px_rgba(124,58,237,0.5)]"
                        : "bg-gray-900 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    )}
                    disabled={!isLoadingComplete || isGenerating || !input.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {isMobile && (
            <div className="flex justify-center gap-4 mt-4 animate-fade-in">
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all duration-300",
                  selectedMode === "normal"
                    ? "bg-gray-900 text-blue-400 shadow-[0_0_5px_rgba(59,130,246,0.3)] border border-blue-500/20"
                    : "bg-gray-900 text-gray-400"
                )}
                onClick={() => handleModeChange("normal")}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Normal</span>
              </button>
              
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all duration-300",
                  selectedMode === "reasoning"
                    ? "bg-gray-900 text-purple-400 shadow-[0_0_5px_rgba(124,58,237,0.3)] border border-purple-500/20"
                    : "bg-gray-900 text-gray-400"
                )}
                onClick={() => handleModeChange("reasoning")}
              >
                <Brain className="w-4 h-4" />
                <span>Raisonnement</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
