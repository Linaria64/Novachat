import React, { useState, useEffect } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initialisation...");
  
  // Simuler une progression de chargement
  useEffect(() => {
    const texts = [
      "Initialisation...",
      "Connexion aux serveurs...",
      "Chargement des modèles...",
      "Préparation de l'interface...",
      "Presque prêt..."
    ];
    
    let interval: number;
    let step = 0;
    
    const updateProgress = () => {
      if (progress < 100) {
        // Calcul non-linéaire pour une progression plus naturelle
        const increment = Math.max(1, 15 - Math.floor(progress / 10));
        const newProgress = Math.min(100, progress + increment);
        
        setProgress(newProgress);
        
        // Mettre à jour le texte de chargement à des étapes spécifiques
        if (newProgress >= step * 20 && step < texts.length) {
          setLoadingText(texts[step]);
          step++;
        }
        
        // Si on a atteint 100%, appeler le callback après un délai
        if (newProgress === 100 && onLoadingComplete) {
          setTimeout(() => {
            onLoadingComplete();
          }, 500);
        }
      }
    };
    
    interval = window.setInterval(updateProgress, 200);
    
    return () => window.clearInterval(interval);
  }, [progress, onLoadingComplete]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-indigo-800 p-6 text-white">
      <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-8 text-center">
        {/* Logo/Icon animé */}
        <div className="relative">
          <Bot className="w-24 h-24 text-white animate-pulse" />
          <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
        </div>
        
        {/* Titre */}
        <h1 className="text-4xl font-bold mb-2">NovaChat</h1>
        <p className="text-xl mb-8">Votre assistant IA personnel</p>
        
        {/* Barre de progression */}
        <div className="w-full space-y-2">
          <Progress value={progress} className="h-2 w-full bg-blue-300/50" />
          <p className="text-sm font-medium">{loadingText}</p>
          <p className="text-xs">{progress}%</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 