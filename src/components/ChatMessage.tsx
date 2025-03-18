import React, { memo } from "react";
import { User, Bot, Settings, Copy, Check, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import TypingIndicator from "./TypingIndicator";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  isLast?: boolean;
  onPreview?: (type: "code" | "image" | "text" | "terminal", content: string, language?: string, title?: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, isLast = false, onPreview }) => {
  const isUser = role === "user";
  const isSystem = role === "system";
  const [copied, setCopied] = useState(false);
  
  // Format code blocks
  const formatContent = (text: string) => {
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith("```") && part.endsWith("```")) {
        // Extract language and code
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        
        if (match) {
          const [, language, code] = match;
          return (
            <div key={index} className="my-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-soft">
              <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 text-xs rounded-t-lg">
                <span className="font-medium">{language || "code"}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      setCopied(true);
                      toast.success("Code copied to clipboard");
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  {onPreview && (
                    <button
                      onClick={() => onPreview("code", code, language)}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>
              <pre className="bg-gray-900 text-gray-200 p-4 overflow-x-auto text-sm">
                <code className="font-mono">{code}</code>
              </pre>
            </div>
          );
        }
      }
      
      // Handle normal text with line breaks
      return (
        <p key={index} className="whitespace-pre-wrap leading-relaxed mb-2">
          {part}
        </p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-4 p-5 mb-4 rounded-xl transition-all",
        isUser
          ? "bg-blue-50 dark:bg-blue-950/30 shadow-soft border border-blue-100 dark:border-blue-900/30"
          : isSystem
            ? "bg-amber-50 dark:bg-amber-950/30 text-sm shadow-soft border border-amber-100 dark:border-amber-900/30"
            : "bg-white dark:bg-gray-800 shadow-medium border border-gray-100 dark:border-gray-700"
      )}
    >
      <div className="flex-shrink-0 pt-1">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shadow-soft",
            isUser
              ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
              : isSystem
                ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                : "bg-gradient-to-br from-purple-400 to-purple-600 text-white"
          )}
        >
          {isUser ? (
            <User className="w-5 h-5" />
          ) : isSystem ? (
            <Settings className="w-5 h-5" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden min-w-0">
        <div className="font-medium mb-2 flex items-center">
          <span className={
            isUser 
              ? "text-blue-700 dark:text-blue-300" 
              : isSystem 
                ? "text-amber-700 dark:text-amber-300"
                : "text-purple-700 dark:text-purple-300"
          }>
            {isUser ? "You" : isSystem ? "System" : "Assistant"}
          </span>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {content ? (
            <div className="space-y-2">
              {formatContent(content)}
            </div>
          ) : (
            <TypingIndicator />
          )}
          {isLast && content && <TypingIndicator inline />}
        </div>
      </div>
    </motion.div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(ChatMessage, (prevProps, nextProps) => {
  // Only re-render if content or isLast changes
  return prevProps.content === nextProps.content && 
         prevProps.isLast === nextProps.isLast &&
         prevProps.role === nextProps.role;
});
