import React from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex w-full justify-start">
      <div className="flex gap-3 max-w-[85%]">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500/10 animate-pulse">
          <Bot className="h-5 w-5 text-blue-500" />
        </div>
        
        <div className="rounded-2xl p-4 pb-3 flex flex-col bg-muted text-foreground rounded-tl-none">
          <div className="text-xs opacity-70 text-left mb-1">
            AI is typing
          </div>
          <div className="flex items-center">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-[bounceDot_1.4s_infinite_-.32s]" />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-[bounceDot_1.4s_infinite_-.16s]" />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-[bounceDot_1.4s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
