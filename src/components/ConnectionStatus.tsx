import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getDisplayApiUrl } from "@/services/ollamaService";

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  const apiUrl = getDisplayApiUrl();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75",
                  isConnected 
                    ? "animate-ping bg-green-400" 
                    : "animate-pulse bg-red-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )}
              />
            </div>
            <span className="text-xs font-medium">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            {isConnected
              ? `Connected to Ollama API at ${apiUrl}`
              : `Not connected to Ollama at ${apiUrl}. Make sure it's running.`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatus;
