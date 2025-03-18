import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SendHorizontal, Download, Trash2, MessageSquarePlus, ChevronLeft, ChevronRight, Code2, Image, FileText, Terminal, X, Mic, FilePlus, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import GroqSettingsDialog from "./GroqSettingsDialog";
import { Message, Model, getModels, checkConnection, getSettings, generateCompletionStream } from "@/services/localService";
import { useDevMode } from "@/hooks/useDevMode";

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface Preview {
  type: "code" | "image" | "text" | "terminal";
  content: string;
  language?: string;
  title?: string;
}

interface DevModeInfo {
  model: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
  connectionStatus: string;
  messageCount: number;
  lastResponseTime: number;
}

const GroqChatInterface: React.FC = () => {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem("chatopia-conversations");
    return saved ? JSON.parse(saved) : [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem("chatopia-selected-model") || getSettings().model;
  });
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [abortController, setAbortController] = useState<(() => void) | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [isDevMode, setIsDevMode] = useState(false);
  const [devInfo, setDevInfo] = useState<DevModeInfo>({
    model: "local",
    temperature: 0.7,
    maxTokens: 2000,
    streamingEnabled: true,
    connectionStatus: "Connected",
    messageCount: 0,
    lastResponseTime: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get active conversation or create a new one
  const activeConversation = useMemo(() => {
    if (!activeConversationId) {
      // If no active conversation, find the most recent one
      const mostRecent = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      if (mostRecent) {
        return mostRecent;
      }
      
      // If no conversations exist, create a new one
      const newId = crypto.randomUUID();
      const newConversation: Conversation = {
        id: newId,
        title: "New Conversation",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      setConversations(prev => [...prev, newConversation]);
      setActiveConversationId(newId);
      return newConversation;
    }
    
    return conversations.find(c => c.id === activeConversationId) || conversations[0];
  }, [activeConversationId, conversations]);

  // Save conversations to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chatopia-conversations", JSON.stringify(conversations));
  }, [conversations]);

  // Save selected model to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("chatopia-selected-model", selectedModel);
  }, [selectedModel]);

  // Fetch models and check connection on component mount
  useEffect(() => {
    fetchModels();
    
    // Setup interval to check connection status
    const interval = setInterval(checkConnectionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isTyping]);

  // Focus input when connection status changes
  useEffect(() => {
    if (isConnected && !isTyping) {
      inputRef.current?.focus();
    }
  }, [isConnected, isTyping]);

  const checkConnectionStatus = useCallback(async () => {
    const connected = await checkConnection();
    setIsConnected(connected);
  }, []);

  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const modelList = await getModels();
      setModels(modelList);
      
      // Check connection status
      const connected = await checkConnection();
      setIsConnected(connected);
      
      // Set default model if available and none selected
      if (connected && (!selectedModel || selectedModel === "")) {
        setSelectedModel(getSettings().model);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel]);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id 
          ? { ...conv, ...updates, updatedAt: Date.now() } 
          : conv
      )
    );
  }, []);

  const createNewConversation = useCallback(() => {
    const newId = crypto.randomUUID();
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setConversations(prev => [...prev, newConversation]);
    setActiveConversationId(newId);
    toast.success("Created new conversation");
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    // If the deleted conversation was active, set the most recent as active
    if (id === activeConversationId) {
      const remainingConversations = conversations.filter(conv => conv.id !== id);
      if (remainingConversations.length > 0) {
        const mostRecent = [...remainingConversations].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setActiveConversationId(mostRecent.id);
      } else {
        createNewConversation();
      }
    }
    
    toast.success("Conversation deleted");
  }, [activeConversationId, conversations, createNewConversation]);

  const updateConversationTitle = useCallback((id: string, messages: Message[]) => {
    // If there are at least 2 messages and the conversation title is still the default
    const conversation = conversations.find(c => c.id === id);
    if (
      conversation && 
      messages.length >= 2 && 
      conversation.title === "New Conversation" &&
      messages[0].role === "user"
    ) {
      // Use the first few words of the first user message as the title
      const firstUserMessage = messages[0].content;
      const title = firstUserMessage.split(" ").slice(0, 6).join(" ") + (firstUserMessage.split(" ").length > 6 ? "..." : "");
      updateConversation(id, { title });
    }
  }, [conversations, updateConversation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    if (!isConnected) {
      toast.error("Not connected to Groq API. Please configure your API key.");
      return;
    }
    
    // Add user message
    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...activeConversation.messages, userMessage];
    
    updateConversation(activeConversation.id, { messages: updatedMessages });
    setInput("");
    setIsTyping(true);
    
    // Add placeholder for assistant response
    const assistantPlaceholder: Message = { 
      role: "assistant", 
      content: "" 
    };
    
    const messagesWithPlaceholder = [...updatedMessages, assistantPlaceholder];
    updateConversation(activeConversation.id, { messages: messagesWithPlaceholder });
    
    try {
      // Try to update the conversation title if it's still the default
      updateConversationTitle(activeConversation.id, updatedMessages);
      
      // Use streaming API for better UX
      const abort = await generateCompletionStream(
        updatedMessages,
        // On chunk received
        (chunk) => {
          setConversations(prev => {
            return prev.map(conv => {
              if (conv.id === activeConversation.id) {
                const newMessages = [...conv.messages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === "assistant") {
                  lastMessage.content += chunk;
                }
                return {
                  ...conv,
                  messages: newMessages,
                  updatedAt: Date.now()
                };
              }
              return conv;
            });
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
          setConversations(prev => {
            return prev.map(conv => {
              if (conv.id === activeConversation.id) {
                // Remove the placeholder if there was an error
                return {
                  ...conv,
                  messages: conv.messages.slice(0, -1),
                  updatedAt: Date.now()
                };
              }
              return conv;
            });
          });
          setIsTyping(false);
          setAbortController(null);
        }
      );
      
      setAbortController(() => abort);
    } catch (error) {
      console.error("Error generating response:", error);
      // Remove placeholder
      updateConversation(activeConversation.id, { 
        messages: updatedMessages 
      });
      setIsTyping(false);
    }
  }, [input, isConnected, activeConversation, updateConversation, updateConversationTitle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [handleSubmit]);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    // Model is now managed separately from conversations
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
    if (activeConversation.messages.length === 0) return;
    
    updateConversation(activeConversation.id, { 
      messages: [],
      title: "New Conversation"
    });
    
    toast.success("Conversation cleared");
  }, [activeConversation, updateConversation]);

  const downloadConversation = useCallback(() => {
    if (activeConversation.messages.length === 0) {
      toast.info("No conversation to download");
      return;
    }
    
    const text = activeConversation.messages
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
  }, [activeConversation]);

  const copyConversation = useCallback(() => {
    if (activeConversation.messages.length === 0) {
      toast.info("No conversation to copy");
      return;
    }
    
    const text = activeConversation.messages
      .map((msg) => `${msg.role === "user" ? "You" : "AI"}: ${msg.content}`)
      .join("\n\n");
    
    navigator.clipboard.writeText(text);
    toast.success("Conversation copied to clipboard");
  }, [activeConversation]);

  const handleSettingsChange = useCallback(() => {
    // Apply the new selected model from settings
    const newSettings = getSettings();
    setSelectedModel(newSettings.model);
    
    // Check connection with new settings
    checkConnectionStatus();
    
    // Fetch models with new settings
    fetchModels();
  }, [checkConnectionStatus, fetchModels]);

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Voice input (placeholder for web speech API implementation)
  const startVoiceInput = () => {
    toast.info("Voice input coming soon!");
    // Actual implementation would use the Web Speech API
  };

  // File upload (placeholder)
  const handleFileUpload = () => {
    toast.info("File upload coming soon!");
    // Actual implementation would involve file input and processing
  };

  const handlePreview = useCallback((type: Preview["type"], content: string, language?: string, title?: string) => {
    setPreview({ type, content, language, title });
  }, []);

  const closePreview = useCallback(() => {
    setPreview(null);
  }, []);

  // Welcome Screen
  const welcomeScreen = useMemo(() => {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="max-w-md space-y-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Welcome to Chatopia
          </motion.h2>
          <p className="text-gray-500 dark:text-gray-400">
            Your private AI assistant
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-soft hover:shadow-medium transition-all cursor-pointer"
            >
              <Code2 className="h-6 w-6 text-purple-500 mb-3" />
              <h3 className="font-medium mb-1">Code Generation</h3>
              <p className="text-xs text-gray-500">Generate and preview code in real-time</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-soft hover:shadow-medium transition-all cursor-pointer"
            >
              <Image className="h-6 w-6 text-blue-500 mb-3" />
              <h3 className="font-medium mb-1">Art Generation</h3>
              <p className="text-xs text-gray-500">Create and preview images</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-soft hover:shadow-medium transition-all cursor-pointer"
            >
              <FileText className="h-6 w-6 text-green-500 mb-3" />
              <h3 className="font-medium mb-1">Text Generation</h3>
              <p className="text-xs text-gray-500">Generate and format text content</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-soft hover:shadow-medium transition-all cursor-pointer"
            >
              <Terminal className="h-6 w-6 text-amber-500 mb-3" />
              <h3 className="font-medium mb-1">Terminal Commands</h3>
              <p className="text-xs text-gray-500">Generate and preview shell commands</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="flex h-screen max-h-screen chat-area-gradient">
      {/* Sidebar Trigger */}
      <div 
        className="sidebar-trigger"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />

      {/* Sidebar */}
      <div 
        className={`sidebar ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-glass-border">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chatopia
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={createNewConversation}
                title="New conversation"
                className="h-8 w-8"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDevMode(!isDevMode)}
                title={isDevMode ? "Switch to User Mode" : "Switch to Developer Mode"}
                className="h-8 w-8"
              >
                {isDevMode ? <User className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                  No conversations yet
                </div>
              ) : (
                [...conversations]
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      whileHover={{ scale: 1.01 }}
                      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors glassmorphism-light ${
                        activeConversationId === conversation.id
                          ? "bg-blue-100/50 dark:bg-blue-900/30"
                          : "hover:bg-gray-100/50 dark:hover:bg-gray-700/30"
                      }`}
                      onClick={() => setActiveConversationId(conversation.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{conversation.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(conversation.updatedAt)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  ))
              )}
            </div>
          </ScrollArea>
          
          {isDevMode && (
            <div className="p-4 border-t border-glass-border">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="font-mono">{devInfo.model}</span>
                </div>
                <div className="flex justify-between">
                  <span>Temperature:</span>
                  <span className="font-mono">{devInfo.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Tokens:</span>
                  <span className="font-mono">{devInfo.maxTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span>Streaming:</span>
                  <span className="font-mono">{devInfo.streamingEnabled ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-mono">{devInfo.connectionStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span className="font-mono">{devInfo.messageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Response:</span>
                  <span className="font-mono">{devInfo.lastResponseTime}ms</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-4 border-t border-glass-border">
            {isDevMode && <GroqSettingsDialog onSettingsChange={handleSettingsChange} />}
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pl-2">
        {/* Header */}
        <header className="flex justify-between items-center p-3 glassmorphism">
          <div className="flex items-center space-x-2">
            {activeConversation?.title}
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glassmorphism">
                <DropdownMenuItem onClick={downloadConversation} disabled={activeConversation?.messages.length === 0}>
                  Download conversation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyConversation} disabled={activeConversation?.messages.length === 0}>
                  Copy to clipboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              disabled={activeConversation?.messages.length === 0}
              title="Clear conversation"
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 pb-0">
          {activeConversation?.messages.length === 0 ? (
            welcomeScreen
          ) : (
            <AnimatePresence>
              {activeConversation?.messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  isLast={index === activeConversation.messages.length - 1 && message.role === "assistant" && isTyping}
                  onPreview={handlePreview}
                />
              ))}
            </AnimatePresence>
          )}
          {isTyping && activeConversation?.messages.length === 0 && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={isConnected ? "Type your message... (Enter to send, Shift+Enter for new line)" : "Configure settings..."}
                className={`chat-input ${isExpanded ? "h-32" : "h-12"}`}
                disabled={!isConnected}
                onClick={() => !isExpanded && setIsExpanded(true)}
                onBlur={() => !input && setIsExpanded(false)}
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <Button 
                  type="button" 
                  size="icon"
                  variant="ghost"
                  onClick={startVoiceInput}
                  className="h-8 w-8"
                  title="Voice input"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  size="icon"
                  variant="ghost"
                  onClick={handleFileUpload}
                  className="h-8 w-8"
                  title="Upload file"
                >
                  <FilePlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isDevMode && (
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[250px]">
                    <TabsList className="h-8">
                      <TabsTrigger value="chat" className="text-xs px-2 py-1">Chat</TabsTrigger>
                      <TabsTrigger value="creative" className="text-xs px-2 py-1">Creative</TabsTrigger>
                      <TabsTrigger value="analyze" className="text-xs px-2 py-1">Analyze</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="preview-modal"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="preview-content glassmorphism"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-glass-border">
                <h3 className="font-medium">{preview.title || "Preview"}</h3>
                <Button variant="ghost" size="icon" onClick={closePreview}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-4 overflow-auto max-h-[calc(80vh-4rem)]">
                {preview.type === "code" && (
                  <pre className="bg-gray-900 text-gray-200 p-4 rounded-lg overflow-x-auto">
                    <code className={`language-${preview.language || "plaintext"}`}>
                      {preview.content}
                    </code>
                  </pre>
                )}
                {preview.type === "image" && (
                  <img src={preview.content} alt="Preview" className="max-w-full rounded-lg" />
                )}
                {preview.type === "text" && (
                  <div className="prose dark:prose-invert max-w-none">
                    {preview.content}
                  </div>
                )}
                {preview.type === "terminal" && (
                  <div className="bg-gray-900 text-gray-200 p-4 rounded-lg font-mono">
                    {preview.content}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroqChatInterface; 