import React from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  isConnecting = false 
}) => {
  let Icon = isConnected ? CheckCircle2 : isConnecting ? AlertCircle : XCircle;
  let statusText = isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected";
  let color = isConnected ? "text-green-500" : isConnecting ? "text-yellow-500" : "text-red-500";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs">
            <div className={cn(
              "relative flex-shrink-0",
              isConnecting && "animate-pulse"
            )}>
              <Icon className={cn("h-4 w-4", color)} />
              {(isConnected || isConnecting) && (
                <span className={cn(
                  "absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full",
                  isConnected ? "bg-green-500" : "bg-yellow-500",
                  isConnecting && "animate-ping"
                )}></span>
              )}
            </div>
            <span className={cn("hidden md:inline-block", color)}>
              {statusText}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-center">
            <p className="font-semibold">{statusText}</p>
            <p className="text-xs text-muted-foreground">
              {isConnected 
                ? "Groq API is responding" 
                : isConnecting 
                  ? "Connecting to Groq API..."
                  : "Cannot connect to Groq API"
              }
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatus;
