import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: Message["role"];
  content: string;
  isLast?: boolean;
  onPreview?: (type: "code" | "image" | "text" | "terminal", content: string, language?: string, title?: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, isLast, onPreview }): JSX.Element => {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "flex gap-3 p-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2 rounded-lg px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <div className="prose dark:prose-invert max-w-none break-words">
          {content}
        </div>
        {isUser && (
          <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
