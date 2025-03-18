import React, { useState } from "react";
import { User, Bot, Settings, Copy, CheckCheck, ThumbsUp, ThumbsDown } from "lucide-react";
import { BaseMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatMessageProps {
  role: BaseMessage["role"];
  content: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === "user";
  const isSystem = role === "system";
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      toast.success("Message copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReaction = (type: "like" | "dislike") => {
    setReaction(reaction === type ? null : type);
    if (reaction !== type) {
      toast.success(`Thanks for your ${type === "like" ? "positive" : "negative"} feedback!`);
    }
  };

  return (
    <div className={cn(
      "flex w-full group",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex gap-3 max-w-[85%]",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary/10" : isSystem ? "bg-yellow-500/10" : "bg-blue-500/10"
        )}>
          {isUser ? (
            <User className="h-5 w-5 text-primary" />
          ) : isSystem ? (
            <Settings className="h-5 w-5 text-yellow-500" />
          ) : (
            <Bot className="h-5 w-5 text-blue-500" />
          )}
        </div>
        
        <div className={cn(
          "rounded-2xl p-4 flex flex-col space-y-2 relative",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : isSystem 
              ? "bg-yellow-500/10 text-foreground rounded-tl-none"
              : "bg-muted text-foreground rounded-tl-none"
        )}>
          <div className={cn(
            "text-xs opacity-70",
            isUser ? "text-right" : "text-left"
          )}>
            {isUser ? "You" : isSystem ? "System" : "AI"}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content.split("\n").map((paragraph, index) => (
              <p key={index} className={paragraph.trim() === "" ? "h-4" : "mb-2 last:mb-0"}>
                {paragraph}
              </p>
            ))}
          </div>
          
          {!isUser && !isSystem && (
            <div className={cn(
              "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 right-2",
              "bg-background/80 backdrop-blur-sm rounded-full border shadow-sm p-0.5"
            )}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={copyToClipboard}
                    >
                      {copied ? 
                        <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : 
                        <Copy className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Copy to clipboard</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={reaction === "like" ? "default" : "ghost"} 
                      size="icon" 
                      className={cn("h-7 w-7", reaction === "like" && "bg-green-500")} 
                      onClick={() => handleReaction("like")}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Good response</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={reaction === "dislike" ? "default" : "ghost"} 
                      size="icon" 
                      className={cn("h-7 w-7", reaction === "dislike" && "bg-red-500")} 
                      onClick={() => handleReaction("dislike")}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Bad response</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
