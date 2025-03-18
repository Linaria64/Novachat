import React, { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, Trash2, Send, Loader2, AlertCircle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import {
  generateCompletionStream as generateGroqCompletion,
  checkConnection as checkGroqConnection,
  AVAILABLE_MODELS as GROQ_MODELS
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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("mixtral-8x7b-32768");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [abortController, setAbortController] = useState<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>("");
  const [showConversationList, setShowConversationList] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Définir un message de bienvenue initial
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "👋 Bienvenue sur NovaChat! Je suis votre assistant IA personnel. Comment puis-je vous aider aujourd'hui?"
        }
      ]);
    }
  }, []);

  // Define fetchModels function before it's used
  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      // Set default model if none selected
      if (!selectedModel) {
        setSelectedModel(GROQ_MODELS[0].id);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models");
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel]);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const connected = await checkGroqConnection();
        
      if (connected !== isConnected) {
        setIsConnected(connected);
        if (connected && !isConnected) {
          fetchModels();
          toast.success("Connected to Groq");
        } else if (!connected && isConnected) {
          toast.error("Lost connection to Groq");
        }
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      setIsConnected(false);
      toast.error("Failed to check connection");
    }
  }, [isConnected, fetchModels]);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chatopia-messages", JSON.stringify(messages));
  }, [messages]);

  // Save selected model to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chatopia-selected-model", selectedModel);
  }, [selectedModel]);

  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
    
    // Setup interval to check connection status
    const interval = setInterval(checkConnectionStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchModels, checkConnectionStatus]);

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

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoadingModels || !isConnected) return;

    const userMessage: BaseMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      await generateGroqCompletion(
        selectedModel,
        [...messages, userMessage],
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
          setIsLoadingModels(false);
        },
        () => {
          setError("Failed to generate response");
          setIsTyping(false);
          setIsLoadingModels(false);
        }
      );
    } catch (error) {
      console.error("Error in handleSend:", error);
      setError("Failed to generate response");
      setIsTyping(false);
      setIsLoadingModels(false);
    }
  }, [input, isLoadingModels, messages, selectedModel, isConnected]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      handleSend();
    }
  }, [handleSend]);

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
    
    setMessages([
      {
        role: "assistant",
        content: "👋 Bienvenue sur NovaChat! Je suis votre assistant IA personnel. Comment puis-je vous aider aujourd'hui?"
      }
    ]);
    toast.success("Conversation cleared");
  }, []);

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
        content: "👋 Bienvenue sur NovaChat! Je suis votre assistant IA personnel. Comment puis-je vous aider aujourd'hui?"
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

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* Main chat area with gradient background */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-blue-500 to-indigo-800 relative">
        <ScrollArea className="h-full py-6 px-4 pb-20">
          <div className="space-y-6 max-w-3xl mx-auto pb-24">
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
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 fixed bottom-0 w-full">
        <div className="flex flex-col gap-3 w-[70%] mx-auto">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2 items-end">
            {messages.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearConversation}
                title="Clear conversation"
                className="h-9 w-9"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex-1 flex bg-white dark:bg-gray-800 rounded-full shadow-md focus-within:ring-1 focus-within:ring-primary">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={!isConnected || isTyping}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full px-4"
              />
              <Button
                onClick={handleSend}
                disabled={!isConnected || isTyping || !input.trim()}
                variant="ghost"
                className="rounded-full h-auto"
              >
                {isLoadingModels ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isTyping && (
              <Button
                variant="outline"
                size="icon"
                onClick={stopGeneration}
                title="Stop generation"
                className="h-9 w-9"
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
