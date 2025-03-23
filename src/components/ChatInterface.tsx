import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Send, X, Bot, Brain, Trash, ChevronDown, MessageSquare, Sparkles } from "lucide-react";
import { generateGroqCompletion } from "@/services/groqService";
import { generateOllamaCompletion } from "@/services/ollamaService";
import { Message, MessageRole } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/components/ChatMessage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Constants
const TEXTAREA_MAX_HEIGHT_MOBILE = 150;
const TEXTAREA_MAX_HEIGHT_DESKTOP = 200;
const AUTO_SCROLL_DELAY = 100;
const MOBILE_BREAKPOINT = 768;

// Message roles
const MessageRoles = {
  User: "user" as MessageRole,
  Assistant: "assistant" as MessageRole,
  System: "system" as MessageRole
};

// Types
interface ChatInterfaceProps {
  className?: string;
}

// Welcome screen component
const WelcomeScreen = memo(({ 
  selectedMode, 
  handleModeChange 
}: { 
  selectedMode: "normal" | "reasoning";
  handleModeChange: (mode: "normal" | "reasoning") => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[50vh] text-center p-4 sm:p-6 space-y-4 sm:space-y-6 animate-[fadeIn_0.5s_ease_forwards,slideUp_0.5s_ease_forwards]">
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 mb-2 sm:mb-4">
        <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Bienvenue sur Novachat
      </h2>
      
      <p className="text-gray-300 max-w-md mx-auto text-sm sm:text-base leading-relaxed px-2">
        {selectedMode === "normal" 
          ? "Posez une question ou démarrez une conversation avec notre assistant IA."
          : "Mode Raisonnement activé. Posez une question complexe pour obtenir un raisonnement étape par étape."
        }
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-md mt-2 sm:mt-4 px-4 sm:px-0">
        <div 
          className={cn(
            "p-3 sm:p-4 rounded-xl border transition-all cursor-pointer", 
            selectedMode === "normal" 
              ? "bg-blue-500/10 border-blue-500/40 shadow-md shadow-blue-500/5" 
              : "bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50"
          )}
          onClick={() => handleModeChange("normal")}
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mb-1.5 sm:mb-2" />
          <h3 className="font-medium text-white text-sm sm:text-base">Mode Normal</h3>
          <p className="text-xs sm:text-sm text-gray-400">Réponses concises et directes</p>
        </div>
        
        <div 
          className={cn(
            "p-3 sm:p-4 rounded-xl border transition-all cursor-pointer", 
            selectedMode === "reasoning" 
              ? "bg-purple-500/10 border-purple-500/40 shadow-md shadow-purple-500/5" 
              : "bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50"
          )}
          onClick={() => handleModeChange("reasoning")}
        >
          <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mb-1.5 sm:mb-2" />
          <h3 className="font-medium text-white text-sm sm:text-base">Mode Raisonnement</h3>
          <p className="text-xs sm:text-sm text-gray-400">Réponses détaillées et explicatives</p>
        </div>
      </div>
    </div>
  );
});

// Input bar component
const InputBar = memo(({
  input,
  handleTyping,
  handleKeyDown,
  handleSend,
  isLoadingComplete,
  isGenerating,
  abortFunction,
  selectedMode,
  handleModeChange,
  messages,
  clearMessages,
  isMobile,
  inputRef,
  isConnected,
  handleNewChat,
}: {
  input: string;
  handleTyping: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSend: () => Promise<void>;
  isLoadingComplete: boolean;
  isGenerating: boolean;
  abortFunction: () => void;
  selectedMode: "normal" | "reasoning";
  handleModeChange: (mode: "normal" | "reasoning") => void;
  messages: Message[];
  clearMessages: () => void;
  isMobile: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  isConnected: boolean;
  handleNewChat: () => void;
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      {/* Connection status indicator */}
      <div className="flex justify-center mb-1">
        <div className="bg-gray-900/70 backdrop-blur-sm rounded-full py-1 px-3 text-xs flex items-center gap-1.5 border border-gray-700/30">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
          <span className="text-gray-300">
            {isConnected 
              ? (window as any).isDeveloperMode 
                ? (window as any).selectedService === "ollama" && (window as any).isConnectedToOllama 
                  ? `Connecté à Ollama (${(window as any).selectedOllamaModel || "llama3"})`
                  : `Connecté à Groq (${(window as any).selectedGroqModel || "llama3-70b-8192"})`
                : "Connecté"
              : "Déconnecté"}
          </span>
        </div>
      </div>
      
      <div className={cn(
        "backdrop-blur-md w-full py-2 sm:py-3 px-2 sm:px-4 "
        
      )}>
        <div className="max-w-4xl mx-auto relative">
          <div className="flex items-end gap-1.5 sm:gap-2 rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-md p-1.5 sm:p-2 shadow-lg">
            {/* Mode toggle button for desktop */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "rounded-lg w-8 h-8 sm:w-10 sm:h-10 transition-all duration-200 hidden md:flex",
                      selectedMode === "normal" 
                        ? "text-blue-400 hover:bg-blue-500/10" 
                        : "text-purple-400 hover:bg-purple-500/10"
                    )}
                    onClick={() => handleModeChange(selectedMode === "normal" ? "reasoning" : "normal")}
                  >
                    {selectedMode === "normal" ? (
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs sm:text-sm">Mode {selectedMode === "normal" ? "Normal" : "Raisonnement"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* New Chat button for mobile */}
            {isMobile && (
              <Button
                size="icon"
                variant="ghost"
                className="rounded-lg w-8 h-8 text-blue-400 hover:bg-blue-500/10 md:hidden"
                onClick={handleNewChat}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}

            <div className="relative flex-1">
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
                className="min-h-[40px] sm:min-h-[50px] max-h-[120px] sm:max-h-[200px] bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none placeholder:text-gray-500 text-sm sm:text-base py-1.5 px-2 sm:py-2 sm:px-3"
                disabled={!isLoadingComplete || isGenerating}
              />
              
              {selectedMode === "reasoning" && (
                <div className="absolute left-2 sm:left-3 bottom-1 flex items-center text-[10px] sm:text-xs text-purple-400 pointer-events-none gap-0.5 sm:gap-1">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>Mode Raisonnement</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {isGenerating ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={abortFunction}
                        className="rounded-lg w-8 h-8 sm:w-10 sm:h-10 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        disabled={!isLoadingComplete}
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs sm:text-sm">Arrêter la génération</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <>
                  {messages.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={clearMessages}
                            className="rounded-lg w-8 h-8 sm:w-10 sm:h-10 text-gray-400 hover:bg-gray-700/60 hidden md:flex"
                            disabled={!isLoadingComplete || messages.length === 0}
                          >
                            <Trash className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs sm:text-sm">Effacer la conversation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <Button
                    size="icon"
                    onClick={handleSend}
                    className={cn(
                      "rounded-lg w-8 h-8 sm:w-10 sm:h-10 transition-all",
                      selectedMode === "reasoning" 
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20 hover:shadow-purple-500/30"
                        : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30"
                    )}
                    disabled={!isLoadingComplete || isGenerating || !input.trim()}
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile mode toggles */}
          {isMobile && (
            <div className="flex justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
              <button
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs transition-all",
                  selectedMode === "normal"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-gray-800/40 text-gray-400 border border-gray-700/30"
                )}
                onClick={() => handleModeChange("normal")}
              >
                <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Normal</span>
              </button>
              
              <button
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs transition-all",
                  selectedMode === "reasoning"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-gray-800/40 text-gray-400 border border-gray-700/30"
                )}
                onClick={() => handleModeChange("reasoning")}
              >
                <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Raisonnement</span>
              </button>
              
              {messages.length > 0 && (
                <button
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs transition-all bg-gray-800/40 text-gray-400 border border-gray-700/30"
                  onClick={clearMessages}
                >
                  <Trash className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>Effacer</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Main component
const ChatInterface = ({ className }: ChatInterfaceProps) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"normal" | "reasoning">("normal");
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Clear messages and start a new chat
  const handleNewChat = useCallback(() => {
    if (window.confirm("Démarrer une nouvelle conversation ?")) {
      clearMessages();
      // Add an event to notify other components
      window.dispatchEvent(new CustomEvent('novachat:new-conversation'));
    }
  }, []);
  
  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    // Stop ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);
  
  // Effects for global state synchronization
  useEffect(() => {
    // Update from global state
    const updateFromGlobalState = () => {
      // Toujours considérer comme connecté pour éviter le blocage de l'interface
      setIsConnected(true);
    };
    
    // Run once initially
    updateFromGlobalState();
    
    // Setup interval to check for changes
    const intervalId = setInterval(updateFromGlobalState, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      // En cas de problème avec le scroll, forcer un second scroll après un court délai
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, []);
  
  // Abort generation function
  const abortFunction = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);
  
  // Handle send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return;
    
    // Determine model based on selected service and mode
    let modelToUse = (window as any).selectedService === "groq" 
      ? (window as any).selectedGroqModel || "llama3-70b-8192"
      : (window as any).selectedOllamaModel || "llama3";
    
    // Override with reasoning model for Groq if in reasoning mode
    if ((window as any).selectedService === "groq" && selectedMode === "reasoning") {
      modelToUse = (window as any).selectedQwqModel || "qwen-qwq-32b";
      console.log("Mode raisonnement activé, utilisation du modèle:", modelToUse);
    }
    
    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: MessageRoles.User,
      content: input.trim(),
      timestamp: new Date(),
    };
    
    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: MessageRoles.Assistant,
      content: "",
      timestamp: new Date(),
      model: modelToUse
    };
    
    // Update messages with user input and empty assistant response
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    
    // Clear input
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    // Set generating state
    setIsGenerating(true);
    
    try {
      // Scroll to bottom after a short delay
      setTimeout(scrollToBottom, AUTO_SCROLL_DELAY);
      
      // Format messages for API
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Generate completion based on selected service
      let response: string | void;
      if ((window as any).selectedService === "groq") {
        response = await generateGroqCompletion({
          model: modelToUse,
          temperature: 0.7,
          maxTokens: 4000,
          streamCallback: (chunk: string) => {
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.role === MessageRoles.Assistant) {
                lastMessage.content += chunk;
              }
              return newMessages;
            });
            // Scroll to bottom during streaming
            scrollToBottom();
          },
          messages: apiMessages
        });
      } else {
        response = await generateOllamaCompletion(
          modelToUse,
          apiMessages,
          abortControllerRef.current?.signal
        );
      }
      
      // Update assistant message with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: response as string || "" }
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
  }, [input, isGenerating, messages, scrollToBottom, selectedMode]);
  
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
  
  // Mode change handler
  const handleModeChange = useCallback((mode: "normal" | "reasoning") => {
    setSelectedMode(mode);
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
      }
    };
    
    // Handle loading complete event
    const handleLoadingComplete = () => {
      setIsLoadingComplete(true);
      inputRef.current?.focus();
    };
    
    // Check initial loading state
    checkLoading();
    
    // Listen for loading complete event
    window.addEventListener("novachat:loading-complete", handleLoadingComplete);
    
    // Clean up event listener
    return () => {
      window.removeEventListener("novachat:loading-complete", handleLoadingComplete);
    };
  }, []);
  
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
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Listen for resize events
    window.addEventListener("resize", handleResize);
    
    // Clean up event listener
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  
  // Chat scroll detection
  useEffect(() => {
    const checkScroll = () => {
      if (!chatContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShowScrollButton(!isNearBottom);
    };
    
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      
      // Vérifier la position initiale
      checkScroll();
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
    };
  }, [messages]); // Re-appliquer lorsque les messages changent

  // Scroll automatiquement lorsque les messages changent
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Background gradient elements - memoized to prevent unnecessary rerenders
  const backgroundElements = useMemo(() => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-full filter blur-3xl opacity-40 animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
      <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-gradient-to-tr from-emerald-600/5 to-blue-600/5 rounded-full filter blur-3xl opacity-40 animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite] delay-1000"></div>
    </div>
  ), []);
  
  // Render messages or welcome screen
  const renderContent = useMemo(() => {
    if (messages.length === 0) {
      return <WelcomeScreen selectedMode={selectedMode} handleModeChange={handleModeChange} />;
    }
    
    return (
      <div className="relative z-10 py-4 sm:py-8 px-2 sm:px-4">
        <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-28 md:pb-32">
          {messages.map((message, index) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              isGenerating={isGenerating && index === messages.length - 1}
              isLastMessage={index === messages.length - 1}
            />
          ))}
        </div>
        <div ref={messagesEndRef} className="h-1" />
      </div>
    );
  }, [messages, selectedMode, handleModeChange, isGenerating]);

  return (
    <div className={cn("flex flex-col h-full relative", className)}>
      {/* Background gradient elements */}
      {backgroundElements}
      
      {/* Chat container */}
      <div 
        ref={chatContainerRef}
        className="h-full overflow-y-auto pb-36 md:pb-40"
        onScroll={() => {
          if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
          }
        }}
      >
        {renderContent}
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollButton && messages.length > 0 && (
        <button
          className="fixed bottom-32 right-4 sm:right-8 bg-gray-900/80 backdrop-blur-sm text-white rounded-full p-2 shadow-lg border border-gray-700/40 hover:bg-gray-800/90 transition-all z-20"
          onClick={scrollToBottom}
          aria-label="Descendre"
        >
          <ChevronDown size={20} />
        </button>
      )}
      
      {/* Input bar */}
      <InputBar 
        input={input}
        isConnected={isConnected}
        isGenerating={isGenerating}
        isLoadingComplete={isLoadingComplete}
        isMobile={isMobile}
        messages={messages}
        selectedMode={selectedMode}
        inputRef={inputRef}
        handleTyping={handleTyping}
        handleKeyDown={handleKeyDown}
        handleSend={handleSend}
        handleModeChange={handleModeChange}
        clearMessages={clearMessages}
        abortFunction={abortFunction}
        handleNewChat={handleNewChat}
      />
    </div>
  );
};

export default memo(ChatInterface);

// Export for use in other components
export { InputBar };
