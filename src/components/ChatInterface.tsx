import { useState, useEffect, useRef, useCallback } from "react";
import { Send, X, Loader2, Bot, Brain, Trash } from "lucide-react";
import { generateGroqCompletion, checkConnection, AVAILABLE_MODELS } from "@/services/groqService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Définir l'énumération MessageRole localement pour éviter les erreurs d'importation
const MessageRole = {
  User: "user" as const,
  Assistant: "assistant" as const,
  System: "system" as const
};

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  // État du chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<"normal" | "reasoning">("normal");
  const [selectedModel] = useState<string>("llama3-70b-8192"); // Remplacé Claude-3 par Llama 3.3 70B
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState<boolean>(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Fonction de récupération des modèles
  const fetchModels = useCallback(async () => {
    try {
      const isConnected = await checkConnection();
      setIsConnected(isConnected);
    } catch (error) {
      console.error("Error fetching models:", error);
      setIsConnected(false);
      toast.error("Impossible de récupérer les modèles. Veuillez vérifier votre connexion.");
    }
  }, []);
  
  // Fonction pour faire défiler vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  
  // Fonction d'arrêt de la génération
  const abortFunction = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      toast.info("Génération arrêtée");
    }
  }, []);
  
  // Gestionnaire d'envoi de message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return;
    
    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.User,
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(false);
    
    // Créer un nouveau AbortController pour cette requête
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Déterminer le modèle à utiliser en fonction du mode
    let modelToUse = selectedModel;
    
    // Si le mode est "reasoning", utiliser Qwen-32B
    if (selectedMode === "reasoning") {
      // Rechercher le modèle Qwen dans les modèles disponibles
      const qwenModel = AVAILABLE_MODELS.find(model => model.id === "qwen-qwq-32b");
      if (qwenModel) {
        modelToUse = qwenModel.id;
      }
    }
    
    try {
      setIsGenerating(true);
      
      // Créer un message vide pour l'assistant
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.Assistant,
        content: "",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Scroll au message vide immédiatement
      setTimeout(scrollToBottom, 100);
      
      // Obtenir le contexte de conversation
      const conversationContext = messages
        .slice(-10) // Utiliser les 10 derniers messages pour le contexte
        .map((msg) => ({
          role: msg.role.toLowerCase(),
          content: msg.content,
        }));
      
      // Ajouter le message de l'utilisateur au contexte
      conversationContext.push({
        role: "user",
        content: input.trim(),
      });
      
      // Générer la complétion
      const response = await generateGroqCompletion(
        modelToUse,
        conversationContext,
        signal
      );
      
      // Mettre à jour le message de l'assistant avec la réponse
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: response }
            : msg
        )
      );
    } catch (error: any) {
      // Vérifier si c'est une erreur d'abandon
      if (error.name === "AbortError") {
        // Supprimer le dernier message (message vide de l'assistant)
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      
      console.error("Error generating completion:", error);
      
      // Afficher le message d'erreur
      toast.error(`Erreur: ${error.message || "Une erreur est survenue"}`);
      
      // Mettre à jour le message de l'assistant avec l'erreur
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
      
      // Scroll après avoir reçu la réponse
      setTimeout(scrollToBottom, 100);
    }
  }, [input, isGenerating, messages, scrollToBottom, selectedMode, selectedModel]);
  
  // Gestionnaire de saisie (typing)
  const handleTyping = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
  }, []);
  
  // Gestionnaire d'appui sur les touches
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  
  // Fonction pour vider les messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    // Stopper toute génération en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);
  
  // Gestionnaire de changement de mode
  const handleModeChange = useCallback((mode: "normal" | "reasoning") => {
    setSelectedMode(mode);
  }, []);
  
  // Vérification de l'état de chargement
  useEffect(() => {
    // Vérifier si le corps a la classe 'loading-active'
    const checkLoading = () => {
      const isLoading = document.body.classList.contains('loading-active');
      setIsLoadingComplete(!isLoading);
    };
    
    // Vérifier immédiatement
    checkLoading();
    
    // Vérifier régulièrement
    const intervalId = setInterval(checkLoading, 500);
    
    // Écouter l'événement de fin de chargement
    const handleLoadingComplete = () => {
      console.log("Loading complete event received");
      setIsLoadingComplete(true);
    };
    
    window.addEventListener('novachat:loading-complete', handleLoadingComplete);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('novachat:loading-complete', handleLoadingComplete);
    };
  }, []);
  
  // Vérifier la connexion au chargement
  useEffect(() => {
    fetchModels();
    
    // Vérifier la connexion périodiquement
    const intervalId = setInterval(fetchModels, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchModels]);
  
  // Effet pour faire défiler vers le bas lorsque les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Écouter l'événement pour créer une nouvelle conversation
  useEffect(() => {
    const handleNewConversation = () => {
      clearMessages();
    };
    
    window.addEventListener('novachat:new-conversation', handleNewConversation);
    
    return () => {
      window.removeEventListener('novachat:new-conversation', handleNewConversation);
    };
  }, [clearMessages]);
  
  // Déterminer l'état de connexion pour l'affichage
  const connectionStatus = isGenerating 
    ? "busy" 
    : isConnected 
      ? "online" 
      : "offline";
  
  // Déterminer le message de statut
  const statusMessage = {
    online: "Connecté",
    busy: "Génération en cours...",
    offline: "Déconnecté"
  };
  
  // Déterminer le modèle affiché
  const displayModel = selectedMode === "reasoning" 
    ? "Qwen-32B" 
    : "Llama 3.3-70B";

  return (
    <div className={cn("h-screen flex flex-col p-4", className)}>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto rounded-xl glassmorphism shadow-lg mb-4 p-4 relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4 floating-effect">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Bienvenue sur NovaChat</h3>
            <p className="text-muted-foreground max-w-md">
              Envoyez un message pour commencer une conversation avec l'IA.
              <br />
              {selectedMode === "normal" 
                ? "Mode normal : réponses concises et directes." 
                : "Mode reasoning : réponses détaillées avec explication du raisonnement."}
            </p>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant={selectedMode === "normal" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("normal")}
                className={cn(
                  "flex items-center gap-2 h-10",
                  selectedMode === "normal" && "bg-gradient-primary",
                  "hover-scale"
                )}
              >
                <Bot className="w-4 h-4" />
                <span>Normal</span>
              </Button>
              
              <Button
                variant={selectedMode === "reasoning" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("reasoning")}
                className={cn(
                  "flex items-center gap-2 h-10",
                  selectedMode === "reasoning" && "bg-gradient-secondary",
                  "hover-scale"
                )}
              >
                <Brain className="w-4 h-4" />
                <span>Reasoning</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2 pb-20">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col relative",
                  message.role === MessageRole.User ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "message-container position-relative",
                    message.role === MessageRole.User
                      ? "user-message"
                      : "assistant-message"
                  )}
                >
                  <div className="whitespace-pre-wrap">
                    {message.content ? (
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
                        {message.content}
                      </Markdown>
                    ) : (
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 px-2">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="chat-input-container">
          <div className="flex items-center gap-2 px-2">
            <div className={`status-indicator status-${connectionStatus}`}>
              <span className={`status-dot ${connectionStatus}`}></span>
              <span className="hidden sm:inline text-xs">{statusMessage[connectionStatus]}</span>
            </div>
            <div className="model-badge">
              <span className="hidden sm:inline">{displayModel}</span>
              <span className="sm:hidden">{selectedMode === "reasoning" ? "Qwen" : "Llama"}</span>
            </div>
          </div>
          
          <Textarea
            ref={inputRef}
            value={input}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={
              !isLoadingComplete
                ? "Chargement..."
                : `Message ${selectedMode === "reasoning" ? "(mode reasoning)" : ""}`
            }
            className="chat-input min-h-[60px] resize-none py-3"
            disabled={!isLoadingComplete || isGenerating}
            rows={1}
            data-mode={selectedMode}
          />
          
          <div className="absolute right-2 bottom-3 flex items-center gap-2">
            {isGenerating ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={abortFunction}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-5 w-5 text-red-500" />
              </Button>
            ) : (
              isTyping && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setInput("")}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </Button>
              )
            )}
            
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSend}
              disabled={!input.trim() || !isLoadingComplete || isGenerating}
              className="h-10 w-10 rounded-full bg-gradient-primary text-white disabled:opacity-50 disabled:pointer-events-none hover:opacity-90"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {messages.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearMessages}
                  className="absolute right-0 -top-12 h-9 w-9 rounded-full"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Vider la conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Button to switch modes */}
        {messages.length > 0 && (
          <div className="absolute left-0 -top-12 flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedMode === "normal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModeChange("normal")}
                    className={cn(
                      "h-9 px-3",
                      selectedMode === "normal" && "bg-gradient-primary"
                    )}
                  >
                    <Bot className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Mode normal</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedMode === "reasoning" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModeChange("reasoning")}
                    className={cn(
                      "h-9 px-3",
                      selectedMode === "reasoning" && "bg-gradient-secondary"
                    )}
                  >
                    <Brain className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Mode reasoning</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
