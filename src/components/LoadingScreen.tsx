import React, { useState, useEffect, useMemo } from "react";
import { Bot, Sparkles, WifiOff, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  isConnectedToGroq?: boolean;
  isCheckingConnection?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onLoadingComplete,
  isConnectedToGroq = false,
  isCheckingConnection = true
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initialisation...");
  const [loadingPhase, setLoadingPhase] = useState(0);
  
  // Predefine loading phases
  const loadingPhases = useMemo(() => [
    { text: "Initialisation...", threshold: 0 },
    { text: "Connexion aux serveurs...", threshold: 20 },
    { text: "Chargement des modèles...", threshold: 40 },
    { text: "Préparation de l'interface...", threshold: 60 },
    { text: "Attente de l'API Groq...", threshold: 80 },
    { text: "Prêt !", threshold: 100 }
  ], []);
  
  // Animation effect for progress bar
  useEffect(() => {
    // Calculate maximum progress based on connection status
    const maxProgress = isConnectedToGroq ? 100 : 90;
    
    // Create interval for progress animation
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= maxProgress) {
          clearInterval(interval);
          return maxProgress;
        }
        
        // Non-linear progress calculation for natural feel
        // Slows down as it approaches 90% to allow time for connection
        const increment = Math.max(1, 15 - Math.floor(prevProgress / 8));
        return Math.min(maxProgress, prevProgress + increment);
      });
    }, 150);
    
    // Update immediately to 100% when connected
    if (isConnectedToGroq && progress < 100) {
      setProgress(100);
      setLoadingText("Prêt !");
      
      if (onLoadingComplete) {
        setTimeout(onLoadingComplete, 600);
      }
    }
    
    return () => clearInterval(interval);
  }, [progress, onLoadingComplete, isConnectedToGroq]);
  
  // Update loading text based on progress
  useEffect(() => {
    // Find the appropriate loading phase based on current progress
    const currentPhase = loadingPhases.findIndex(phase => progress < phase.threshold);
    const phaseIndex = currentPhase === -1 ? loadingPhases.length - 1 : currentPhase - 1;
    
    if (phaseIndex !== loadingPhase && phaseIndex >= 0) {
      setLoadingPhase(phaseIndex);
      setLoadingText(loadingPhases[phaseIndex].text);
    }
    
    // Complete loading when reaching 100%
    if (progress === 100 && onLoadingComplete) {
      setTimeout(onLoadingComplete, 600);
    }
  }, [progress, loadingPhases, loadingPhase, onLoadingComplete]);
  
  // Connection status text
  const connectionStatusText = useMemo(() => {
    if (isConnectedToGroq) {
      return "Connecté à l'API Groq";
    } else if (isCheckingConnection) {
      return "Tentative de connexion à l'API Groq...";
    } else {
      return "Impossible de se connecter à l'API Groq. Veuillez vérifier votre connexion internet et votre clé API.";
    }
  }, [isConnectedToGroq, isCheckingConnection]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-indigo-800 p-6 text-white animate-in fade-in duration-700">
      <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-10 text-center">
        {/* Animated logo with improved visual effects */}
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full blur-2xl bg-blue-300/30 animate-pulse-subtle"></div>
          <div className="absolute inset-0 -left-6 -top-6 rounded-full blur-xl bg-indigo-400/20 animate-float" style={{ animationDelay: '-1.5s' }}></div>
          <div className="absolute inset-0 -right-6 -bottom-6 rounded-full blur-xl bg-purple-400/20 animate-float" style={{ animationDelay: '-0.7s' }}></div>
          <div className="relative z-10">
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-xl">
              <Bot className="w-16 h-16 text-white drop-shadow-lg" />
            </div>
            <Sparkles className="w-10 h-10 text-yellow-300 absolute -top-3 -right-3 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        
        {/* Title with enhanced animation */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold animate-in slide-in-from-bottom-2 duration-700 tracking-tight">
            NovaChat
          </h1>
          <p className="text-xl text-blue-100 animate-in slide-in-from-bottom-3 duration-700 delay-200">
            Votre assistant IA personnel
          </p>
        </div>
        
        {/* Progress bar with improved styling */}
        <div className="w-full space-y-3 animate-in slide-in-from-bottom-4 duration-700 delay-300">
          <Progress 
            value={progress} 
            className="h-3 w-full bg-blue-300/30 rounded-lg overflow-hidden"
          />
          <div className="flex items-center justify-between">
            <p className="text-base font-medium">{loadingText}</p>
            <p className="text-sm font-mono bg-blue-600/30 px-2 py-1 rounded-md">{progress}%</p>
          </div>
        </div>
        
        {/* Connection status with enhanced visual feedback */}
        <div className={cn(
          "flex items-center justify-center space-x-2 text-base px-5 py-3 rounded-xl backdrop-blur-md",
          isConnectedToGroq 
            ? "bg-green-400/20 text-green-100 border border-green-400/30" 
            : !isCheckingConnection 
              ? "bg-red-400/20 text-red-100 border border-red-400/30"
              : "bg-blue-400/20 text-blue-100 border border-blue-400/30"
        )}>
          {isConnectedToGroq ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : !isConnectedToGroq && !isCheckingConnection ? (
            <WifiOff className="w-5 h-5 mr-2" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-blue-300 animate-ping mr-2" />
          )}
          <p>{connectionStatusText}</p>
        </div>
      </div>
      
      {/* Version number */}
      <div className="absolute bottom-6 text-sm text-blue-200/70 font-medium">
        Version 1.0.0
      </div>
    </div>
  );
};

export default LoadingScreen; 