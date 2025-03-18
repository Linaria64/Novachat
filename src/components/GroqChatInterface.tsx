import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Download, Trash2, MessageSquarePlus, Terminal, X, Mic, FilePlus, User, Send, Menu, Copy, Code2, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import GroqSettingsDialog from "@/components/GroqSettingsDialog";
import { checkConnection, getSettings, generateCompletionStream, getModels } from "@/services/localService";
import { Message, Settings, Model, Preview, Conversation, DevModeInfo } from "@/types/chat";

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
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [settings, setSettings] = useState<Settings>(getSettings());

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
    if (!activeConversation || activeConversation.messages.length === 0) {
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
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex flex-col border-r"
          >
            <div className="p-4 border-b">
              <Button
                variant="outline"
                className="w-full"
                onClick={createNewConversation}
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {conversations.map((conversation) => (
                  <Button
                    key={conversation.id}
                    variant={conversation.id === activeConversationId ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{conversation.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(conversation.updatedAt)}
                      </span>
                    </div>
                  </Button>
                ))}
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
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pl-2">
        {/* Header */}
        <header className="flex justify-between items-center p-3 glassmorphism">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chatopia
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDevMode(!isDevMode)}
            >
              <Terminal className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={copyConversation}
              disabled={!activeConversation || activeConversation.messages.length === 0}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleFileUpload}
            >
              <FilePlus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={startVoiceInput}
            >
              <Mic className="h-4 w-4" />
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium">{preview.title || 'Preview'}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePreview}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(80vh-4rem)]">
                {preview.type === 'code' && (
                  <pre className="bg-muted p-4 rounded-lg">
                    <code className={`language-${preview.language}`}>
                      {preview.content}
                    </code>
                  </pre>
                )}
                {preview.type === 'image' && (
                  <img
                    src={preview.content}
                    alt={preview.title || 'Preview image'}
                    className="max-w-full rounded-lg"
                  />
                )}
                {preview.type === 'text' && (
                  <div className="prose dark:prose-invert max-w-none">
                    {preview.content}
                  </div>
                )}
                {preview.type === 'terminal' && (
                  <pre className="bg-black text-white p-4 rounded-lg font-mono">
                    {preview.content}
                  </pre>
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