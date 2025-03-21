import React, { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, Trash2, Send, Loader2, AlertCircle, Plus, Brain, MessageCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import {
  generateCompletionStream as generateGroqCompletion,
  checkConnection as checkGroqConnection,
  AVAILABLE_MODELS as GROQ_MODELS,
  GroqModel
} from "@/services/groqService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BaseMessage, MessageRole } from "@/types/chat";
import { Toaster } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  className?: string;
}

interface ConversationInfo {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  // Commencer par définir tous les états
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GroqModel>(GROQ_MODELS[0]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [abortController, setAbortController] = useState<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>("");
  const [showConversationList, setShowConversationList] = useState(false);
  const [generationMode, setGenerationMode] = useState<"normal" | "reasoning">("normal");
  const [isLoadingComplete, setIsLoadingComplete] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Définir les refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Définir toutes les fonctions callback avec useCallback avant de les utiliser dans les effets
  const fetchModels = useCallback(async () => {
    try {
      setIsLoadingModels(true);
      // Code pour récupérer les modèles...
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models");
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [input, isConnected, isTyping, isLoadingComplete]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !isConnected || isTyping || !isLoadingComplete) return;
    
    const userMessage: BaseMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      let systemPrompt = "";
      
      // Ajouter un système prompt différent selon le mode
      if (generationMode === "reasoning") {
        systemPrompt = "Vous êtes un assistant IA qui expose son raisonnement étape par étape. Pour chaque réponse, commencez par une analyse détaillée du problème, puis développez votre raisonnement de manière claire et structurée avant de donner votre conclusion finale.";
      } else {
        systemPrompt = "Vous êtes un assistant IA concis et direct. Répondez de manière claire et efficace.";
      }
      
      // Fonction pour configurer le contrôleur d'abandon
      const setupAbortController = () => {
        const abort = () => {
          console.log("Generation aborted by user");
          setIsTyping(false);
          toast.info("Génération arrêtée");
        };
        setAbortController(() => abort);
      };
      
      // Configurer le contrôleur d'abandon
      setupAbortController();
      
      // Appeler l'API Groq pour générer une réponse
      generateGroqCompletion(
        selectedModel.id,
        [{ role: "system", content: systemPrompt }, ...messages, userMessage],
        (chunk: string) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage && lastMessage.role === "assistant") {
              return [
                ...newMessages.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + chunk },
              ];
            }
            
            return [
              ...newMessages,
              { role: "assistant" as MessageRole, content: chunk },
            ];
          });
        },
        () => {
          setIsTyping(false);
          setAbortController(null);
        },
        () => {
          setError("Échec de la génération de la réponse");
          setIsTyping(false);
          setAbortController(null);
        }
      );
    } catch (error) {
      console.error("Error in handleSend:", error);
      setError("Échec de la génération de la réponse");
      setIsTyping(false);
      setAbortController(null);
    }
  }, [input, messages, selectedModel, isConnected, isTyping, isLoadingComplete, generationMode]);

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController();
      setAbortController(null);
      setIsTyping(false);
    }
  }, [abortController]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    toast.success("Conversation cleared");
  }, []);

  // Maintenant définir les effets avec useEffect
  // Détecter si l'appareil est mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Vérifier au chargement
    checkIfMobile();
    
    // Ajouter un écouteur de redimensionnement
    window.addEventListener('resize', checkIfMobile);
    
    // Nettoyer l'écouteur
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Message de bienvenue
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "👋 Bonjour et bienvenue sur NovaChat!\n\nJe suis votre assistant IA personnel. Vous pouvez me poser toutes vos questions et je ferai de mon mieux pour vous aider.\n\nPour commencer une nouvelle conversation, cliquez sur l'icône en haut à gauche.\nPour changer de thème, utilisez l'icône soleil/lune en bas de la barre latérale."
        }
      ]);
    }
  }, [messages.length]);

  // Vérifier si l'application est prête
  useEffect(() => {
    // Fonction pour vérifier l'état du chargement
    const checkIfReady = () => {
      const isAppReady = !document.body.classList.contains('loading-active');
      setIsLoadingComplete(isAppReady);
      
      // Si toujours en chargement, vérifier à nouveau dans 500ms
      if (!isAppReady) {
        setTimeout(checkIfReady, 500);
      } else {
        console.log("Application chargée - interface de chat activée");
      }
    };
    
    // Vérifier l'état initial
    checkIfReady();
    
    // Écouter l'événement global de fin de chargement
    const handleLoadingComplete = () => {
      console.log("Événement de fin de chargement reçu");
      setIsLoadingComplete(true);
    };
    
    window.addEventListener('novachat:loading-complete', handleLoadingComplete);
    
    return () => {
      window.removeEventListener('novachat:loading-complete', handleLoadingComplete);
    };
  }, []);

  // Vérifier la connexion au chargement
  useEffect(() => {
    const checkGroqConnectionStatus = async () => {
      try {
        console.log("Vérification de la connexion à Groq...");
        const connected = await checkGroqConnection();
        setIsConnected(connected);
        
        if (connected) {
          fetchModels();
          console.log("Connexion à Groq établie avec succès");
        } else {
          setError("Impossible de se connecter à l'API Groq. Veuillez vérifier votre connexion internet et vos paramètres.");
          console.error("Échec de la connexion à Groq");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la connexion:", error);
        setIsConnected(false);
        setError("Erreur de connexion. Veuillez réessayer plus tard.");
      }
    };

    checkGroqConnectionStatus();
  }, [fetchModels]);

  // Setup interval to check connection status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const connected = await checkGroqConnection();
        
        if (connected !== isConnected) {
          setIsConnected(connected);
          if (connected && !isConnected) {
            fetchModels();
            toast.success("Connexion à Groq établie");
            setError(null);
          } else if (!connected && isConnected) {
            toast.error("Connexion à Groq perdue");
            setError("Connexion à Groq perdue. Tentative de reconnexion...");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la connexion:", error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isConnected, fetchModels]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Save selected model to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chatopia-selected-model", selectedModel.id);
  }, [selectedModel]);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chatopia-messages", JSON.stringify(messages));
  }, [messages]);

  // Focus input when connection status changes
  useEffect(() => {
    if (isConnected && !isTyping) {
      inputRef.current?.focus();
    }
  }, [isConnected, isTyping]);

  // Generate a title for a conversation based on the first message
  const generateConversationTitle = useCallback((content: string) => {
    return content.length > 25 ? content.substring(0, 25) + '...' : content;
  }, []);

  // Create a new conversation
  const createNewConversation = useCallback(() => {
    const newId = Date.now().toString();
    setCurrentConversationId(newId);
    setMessages([
      {
        role: "assistant",
        content: "👋 Bonjour et bienvenue sur NovaChat!\n\nJe suis votre assistant IA personnel. Vous pouvez me poser toutes vos questions et je ferai de mon mieux pour vous aider.\n\nPour commencer une nouvelle conversation, cliquez sur l'icône en haut à gauche.\nPour changer de thème, utilisez l'icône soleil/lune en bas de la barre latérale."
      }
    ]);
    setInput("");
    setError(null);
    toast.success("New conversation started");
  }, []);

  // Ajouter un écouteur d'événements pour la création d'une nouvelle conversation
  useEffect(() => {
    const handleNewConversation = () => {
      createNewConversation();
    };

    window.addEventListener('novachat:new-conversation', handleNewConversation);
    
    return () => {
      window.removeEventListener('novachat:new-conversation', handleNewConversation);
    };
  }, [createNewConversation]);

  // Save current conversation
  const saveCurrentConversation = useCallback(() => {
    if (messages.length === 0) return;
    
    const userMessage = messages.find(msg => msg.role === "user");
    if (!userMessage) return;
    
    const title = generateConversationTitle(userMessage.content);
    const lastMessage = messages[messages.length - 1].content;
    
    const conversation: ConversationInfo = {
      id: currentConversationId || Date.now().toString(),
      title,
      lastMessage,
      timestamp: new Date()
    };
    
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== conversation.id);
      return [conversation, ...filtered];
    });
    
    if (!currentConversationId) {
      setCurrentConversationId(conversation.id);
    }
  }, [messages, currentConversationId, generateConversationTitle]);

  // Load a conversation
  const loadConversation = useCallback((id: string) => {
    // Here you would typically load the conversation from storage
    // For now we'll just set the ID and close the sidebar
    setCurrentConversationId(id);
    setShowConversationList(false);
  }, []);

  // The conversation list sidebar/dialog
  const conversationList = (
    <Dialog open={showConversationList} onOpenChange={setShowConversationList}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your conversations</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-left hover:bg-muted/60 transition-colors",
                  conv.id === currentConversationId && "bg-muted"
                )}
                onClick={() => loadConversation(conv.id)}
              >
                <div className="font-medium truncate">{conv.title}</div>
                <div className="text-xs text-muted-foreground truncate">{conv.lastMessage}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {conv.timestamp.toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
        <Button onClick={createNewConversation} className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" />
          New conversation
        </Button>
      </DialogContent>
    </Dialog>
  );

  // Save conversation when messages change
  useEffect(() => {
    saveCurrentConversation();
  }, [messages, saveCurrentConversation]);

  // Charger le modèle sélectionné depuis le localStorage
  useEffect(() => {
    const loadSelectedModel = () => {
      const savedModelId = localStorage.getItem("chatopia-selected-model");
      if (savedModelId) {
        const foundModel = GROQ_MODELS.find(model => model.id === savedModelId);
        if (foundModel) {
          setSelectedModel(foundModel);
        }
      }
    };
    
    loadSelectedModel();
  }, []);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* Main chat area with iOS-like background */}
      <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
        {/* iOS-like background pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNNTQgMTEwYzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6bTE4IDBjMC0zLjMxMy0yLjY4Ny02LTYtNnMtNiAyLjY4Ny02IDYgMi42ODcgNiA2IDYgNi0yLjY4NyA2LTZ6Ii8+PHBhdGggZD0iTTEyMSAxMTBjMC02LjYyNyA1LjM3My0xMiAxMi0xMnMxMiA1LjM3MyAxMiAxMi01LjM3MyAxMi0xMiAxMi0xMi01LjM3My0xMi0xMnptMTggMGMwLTMuMzEzLTIuNjg3LTYtNi02cy02IDIuNjg3LTYgNiAyLjY4NyA2IDYgNiA2LTIuNjg3IDYtNnptMTIzIDNjMC02LjYyNyA1LjM3My0xMiAxMi0xMnMxMiA1LjM3MyAxMiAxMi01LjM3MyAxMi0xMiAxMi0xMi01LjM3My0xMi0xMnptMTggMGMwLTMuMzEzLTIuNjg3LTYtNi02cy02IDIuNjg3LTYgNiAyLjY4NyA2IDYgNiA2LTIuNjg3IDYtNnp6Ii8+PC9nPjwvZz48L3N2Zz4=')]"></div>

        <ScrollArea className="h-full py-6 px-2 sm:px-4 pb-20">
          <div className="space-y-2 w-full max-w-3xl mx-auto pb-24">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Footer with actions and input */}
      <div className={`bg-gray-50 dark:bg-gray-800 py-3 sm:py-4 px-4 border-t dark:border-gray-700 ${isMobile ? 'mb-16' : ''}`}>
        <div className="flex flex-col gap-3 w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] mx-auto">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Boutons de mode */}
          <div className="flex justify-center space-x-2 mb-2">
            <Button
              variant={generationMode === "normal" ? "default" : "outline"}
              size="sm"
              onClick={() => setGenerationMode("normal")}
              className="rounded-full"
              disabled={!isLoadingComplete}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Normal
            </Button>
            <Button
              variant={generationMode === "reasoning" ? "default" : "outline"}
              size="sm"
              onClick={() => setGenerationMode("reasoning")}
              className="rounded-full"
              disabled={!isLoadingComplete}
            >
              <Brain className="h-4 w-4 mr-1" />
              Reasoning
            </Button>
          </div>
          
          <div className="flex gap-2 items-end">
            {messages.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearConversation}
                title="Clear conversation"
                className="h-9 w-9 flex-shrink-0"
                disabled={!isLoadingComplete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex-1 flex bg-white dark:bg-gray-700 rounded-full shadow-md focus-within:ring-1 focus-within:ring-primary">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoadingComplete ? "Type your message..." : "Chargement en cours..."}
                disabled={!isConnected || isTyping || !isLoadingComplete}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full px-3 sm:px-4 py-2 text-sm sm:text-base"
              />
              
              <div className="flex items-center pr-2">
                {input && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setInput("")}
                    className="h-8 w-8"
                    disabled={isTyping || !isLoadingComplete}
                    aria-label="Effacer la saisie"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  onClick={handleSend}
                  disabled={!isConnected || isTyping || !input.trim() || !isLoadingComplete}
                  variant="ghost"
                  className="rounded-full h-auto flex-shrink-0"
                >
                  {isLoadingModels ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {isTyping && (
              <Button
                variant="outline"
                size="icon"
                onClick={stopGeneration}
                title="Stop generation"
                className="h-9 w-9 flex-shrink-0"
                disabled={!isLoadingComplete}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Render the conversation list dialog */}
      {conversationList}

      <Toaster position="top-center" />
    </div>
  );
};

export default ChatInterface;
