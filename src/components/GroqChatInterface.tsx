import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { checkConnection, generateCompletionStream } from "@/services/localService";
import { Message } from "@/types/chat";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const GroqChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConnection().then((connected) => {
      if (!connected) {
        toast.error("Failed to connect to the API");
      }
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let assistantMessage = "";
      await generateCompletionStream(
        [...messages, userMessage],
        (chunk) => {
          assistantMessage += chunk;
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { 
              id: (Date.now() + 1).toString(),
              role: "assistant", 
              content: assistantMessage,
              timestamp: new Date()
            },
          ]);
        },
        () => {
          setIsLoading(false);
        },
        (error) => {
          console.error("Error generating response:", error);
          toast.error("Failed to generate response");
          setIsLoading(false);
        }
      );
    } catch (error) {
      toast.error("Failed to generate response");
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return (
    <div className="flex h-screen flex-col">
      <Toaster />
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-4 p-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 rounded-md border p-2"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroqChatInterface; 