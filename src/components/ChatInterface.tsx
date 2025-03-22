import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, X, Bot, Brain, Trash, ChevronDown, MessageSquare } from "lucide-react";
import { generateGroqCompletion, checkConnection, AVAILABLE_MODELS } from "@/services/groqService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
  
  // Process content for reasoning mode
  const processReasoningContent = useCallback((content: string): React.ReactNode => {
    // Look for content separator markers
    const thinkingMatch = content.match(/(?:Thinking:|Reasoning:|Let's think|Let me think|Let's analyze|I need to analyze|Step by step|First,)/i);
    const answerMatch = content.match(/(?:Answer:|Final answer:|In conclusion:|Therefore,|To summarize:|The answer is:|So,\s+the|Thus,\s+the)/i);
    
    if (!thinkingMatch && !answerMatch) {
      // No clear separation, return normal content
      return (
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre({ node, className, children, ...props }) {
              return (
                <pre className="bg-gray-800 text-gray-100 rounded-md p-4 overflow-x-auto my-2 text-sm" {...props}>
                  {children}
                </pre>
              );
            },
            code({ node, className, children, ...props }) {
              return <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>;
            }
          }}
        >
          {content}
        </Markdown>
      );
    }
    
    let thinkingContent = content;
    let answerContent = "";
    
    // If answer marker found, separate content
    if (answerMatch && answerMatch.index !== undefined) {
      thinkingContent = content.substring(0, answerMatch.index);
      answerContent = content.substring(answerMatch.index);
    }
    
    return (
      <div className="w-full">
        <div className="thinking-section bg-gray-100/70 dark:bg-gray-800/30 rounded-lg p-4 mb-4 shadow-sm">
          <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-2">Raisonnement</div>
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre({ node, className, children, ...props }) {
                return (
                  <pre className="bg-gray-800 text-gray-100 rounded-md p-4 overflow-x-auto my-2 text-sm" {...props}>
                    {children}
                  </pre>
                );
              },
              code({ node, className, children, ...props }) {
                return <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>;
              }
            }}
          >
            {thinkingContent}
          </Markdown>
        </div>
        
        {answerContent && (
          <div className="final-answer bg-blue-50/80 dark:bg-blue-900/10 rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
            <div className="text-xs uppercase font-semibold text-blue-500 dark:text-blue-400 mb-2">Réponse finale</div>
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ node, className, children, ...props }) {
                  return (
                    <pre className="bg-gray-800 text-gray-100 rounded-md p-4 overflow-x-auto my-2 text-sm" {...props}>
                      {children}
                    </pre>
                  );
                },
                code({ node, className, children, ...props }) {
                  return <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>;
                }
              }}
            >
              {answerContent}
            </Markdown>
          </div>
        )}
      </div>
    );
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
  
  // Memoized UI components
  const MessageList = useMemo(() => (
    <div 
      ref={chatContainerRef}
      className={cn(
        "flex-1 overflow-y-auto pt-6 pb-4 px-5 space-y-8",
        isMobile ? "mobile-messages-container" : "desktop-messages-container"
      )}
    >
      {messages.length === 0 ? (
        <div className="welcome-message">
          <div className="welcome-icon">
            <Bot className="h-8 w-8 text-blue-500" />
          </div>
          <h2>Bienvenue sur NovaChat</h2>
          <p>
            {selectedMode === "normal" 
              ? "Posez une question ou démarrez une conversation."
              : "Mode Raisonnement activé. Posez une question complexe pour obtenir un raisonnement étape par étape."
            }
          </p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div 
              key={message.id}
              className={cn(
                "message-container",
                message.role === MessageRole.User ? "user-message" : "assistant-message",
                "animate-in fade-in slide-in-from-bottom-1"
              )}
            >
              <div className={cn(
                "message-sender-badge",
                message.role === MessageRole.User ? "user-badge" : "assistant-badge"
              )}>
                {message.role === MessageRole.User ? (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-md">
                    <span className="text-sm font-semibold">Vous</span>
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white shadow-md">
                    <Bot size={18} />
                  </div>
                )}
              </div>
              
              <div className={cn(
                "content-container p-4 rounded-2xl max-w-[85%]",
                message.role === MessageRole.User 
                  ? "bg-gradient-primary text-white shadow-md user-message-bubble" 
                  : "glassmorphism-light shadow-sm assistant-message-bubble"
              )}>
                {message.role === MessageRole.User ? (
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                ) : (
                  message.content ? (
                    selectedMode === "reasoning" ? (
                      processReasoningContent(message.content)
                    ) : (
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          pre({ node, className, children, ...props }) {
                            return (
                              <pre className="bg-gray-800 text-gray-100 rounded-md p-4 overflow-x-auto my-3 text-sm" {...props}>
                                {children}
                              </pre>
                            );
                          },
                          code({ node, className, children, ...props }) {
                            return <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>;
                          },
                          p({ node, className, children, ...props }) {
                            return <p className="mb-3 last:mb-0" {...props}>{children}</p>;
                          }
                        }}
                      >
                        {message.content}
                      </Markdown>
                    )
                  ) : (
                    <div className="typing-indicator">
                      <span className="animate-typing-bounce1">.</span>
                      <span className="animate-typing-bounce2">.</span>
                      <span className="animate-typing-bounce3">.</span>
                    </div>
                  )
                )}
                
                <div className="text-xs text-right mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty div for auto-scrolling */}
          <div ref={messagesEndRef} />
        </>
      )}
      
      {/* Scroll to bottom button */}
      {showScrollButton && messages.length > 0 && (
        <button
          className={`scroll-to-bottom ${showScrollButton ? "visible" : ""}`}
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </button>
      )}
    </div>
  ), [messages, selectedMode, isMobile, showScrollButton, scrollToBottom, processReasoningContent, handleModeChange]);
  
  // Chat input component
  const ChatInputArea = useMemo(() => (
    <div className={cn(
      "relative",
      isMobile ? "mobile-input-wrapper" : "mx-auto max-w-3xl"
    )}>
      <div className={cn(
        "flex items-end space-x-3 rounded-2xl p-3",
        isMobile 
          ? "mobile-input-container" 
          : "chat-input glassmorphism-heavy mx-auto"
      )}>
        {/* Mode selector on desktop */}
        {!isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "rounded-full w-11 h-11 flex-shrink-0 shadow-sm transition-all",
                    selectedMode === "normal" 
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                  )}
                  onClick={() => handleModeChange(selectedMode === "normal" ? "reasoning" : "normal")}
                >
                  {selectedMode === "normal" ? (
                    <MessageSquare size={18} />
                  ) : (
                    <Brain size={18} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {selectedMode === "normal" 
                  ? "Passer en mode raisonnement" 
                  : "Passer en mode normal"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Input area */}
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
          className={cn(
            "min-h-[50px] border-0 focus-visible:ring-0 resize-none text-base py-2.5 px-4 rounded-xl shadow-inner bg-background/70",
            isMobile ? "mobile-chat-input" : "flex-1"
          )}
          disabled={!isLoadingComplete || isGenerating}
        />
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {isGenerating ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={abortFunction}
              className="rounded-full w-11 h-11 flex-shrink-0 shadow-md"
              disabled={!isLoadingComplete}
              aria-label="Stop generating"
            >
              <X size={18} />
            </Button>
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
                        className="rounded-full w-11 h-11 flex-shrink-0 bg-gray-100/70 hover:bg-gray-200/70 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 shadow-sm"
                        disabled={!isLoadingComplete || messages.length === 0}
                        aria-label="Clear chat"
                      >
                        <Trash size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Effacer la conversation
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          )}
          
          <Button
            size="icon"
            onClick={handleSend}
            className={cn(
              "rounded-full w-11 h-11 flex-shrink-0 shadow-md transition-all",
              isMobile ? "mobile-send-button" : "",
              selectedMode === "reasoning" 
                ? "bg-purple-500 hover:bg-purple-600"
                : "bg-gradient-primary hover:opacity-90"
            )}
            disabled={!isLoadingComplete || isGenerating || !input.trim()}
            aria-label="Send message"
          >
            <Send size={18} className="text-white" />
          </Button>
        </div>
      </div>
      
      {/* Mode indicators for mobile */}
      {isMobile && (
        <div className="flex justify-center space-x-4 mt-3 mb-1">
          <button
            className={cn(
              "mobile-mode-button glassmorphism-light",
              selectedMode === "normal" ? "bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : ""
            )}
            onClick={() => handleModeChange("normal")}
          >
            <MessageSquare size={14} />
            <span>Normal</span>
          </button>
          
          <button
            className={cn(
              "mobile-mode-button glassmorphism-light",
              selectedMode === "reasoning" ? "bg-purple-100/50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" : ""
            )}
            onClick={() => handleModeChange("reasoning")}
          >
            <Brain size={14} />
            <span>Raisonnement</span>
          </button>
        </div>
      )}
    </div>
  ), [input, isGenerating, isLoadingComplete, messages.length, selectedMode, isMobile, handleModeChange, handleSend, handleTyping, handleKeyDown, abortFunction, clearMessages]);
  
  return (
    <div className="flex flex-col h-screen bg-black">
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="text-center py-8 px-6 rounded-2xl bg-gray-900/50 border border-gray-800">
                <Bot className="w-8 h-8 text-gray-400 mx-auto mb-4" />
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
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 bg-black">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-end gap-2 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
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
                  <MessageSquare className="w-5 h-5" />
                ) : (
                  <Brain className="w-5 h-5" />
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
                  className="rounded-full w-10 h-10 bg-gray-900 text-red-400 hover:shadow-[0_0_5px_rgba(239,68,68,0.5)] hover:border-red-500/30"
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
                      className="rounded-full w-10 h-10 bg-gray-900 text-gray-400 hover:shadow-[0_0_5px_rgba(156,163,175,0.3)] hover:border-gray-500/30"
                      disabled={!isLoadingComplete || messages.length === 0}
                    >
                      <Trash className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    onClick={handleSend}
                    className={cn(
                      "rounded-full w-10 h-10 transition-all duration-300",
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
            <div className="flex justify-center gap-4 mt-4">
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
