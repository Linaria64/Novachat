import React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  inline?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ inline = false }) => {
  return (
    <div
      className={cn(
        "flex items-center",
        inline ? "inline-flex ml-1" : "my-4 mx-auto"
      )}
    >
      <div className="flex space-x-1.5">
        <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-typing-bounce1"></div>
        <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-typing-bounce2"></div>
        <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-typing-bounce3"></div>
      </div>
      {!inline && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>}
    </div>
  );
};

export default TypingIndicator;
