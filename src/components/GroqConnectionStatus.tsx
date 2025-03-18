import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface GroqConnectionStatusProps {
  isConnected: boolean;
}

const GroqConnectionStatus: React.FC<GroqConnectionStatusProps> = ({ isConnected }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                isConnected
                  ? "bg-green-500 animate-pulse"
                  : "bg-red-500"
              )}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isConnected ? "Connected to AI service" : "Not connected. Please check your API key in settings."}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GroqConnectionStatus; 