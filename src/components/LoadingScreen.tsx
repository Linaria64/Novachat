import React, { useState, useEffect } from "react";
import { Bot, Sparkles, WifiOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  
  // Simuler une progression de chargement jusqu'à 90% seulement
  // Les 10% restants seront débloqués une fois la connexion établie
  useEffect(() => {
    const texts = [
      "Initialisation...",
      "Connexion aux serveurs...",
      "Chargement des modèles...",
      "Préparation de l'interface...",
      "Attente de l'API Groq..."
    ];
    
    let interval: number;
    let step = 0;
    
    const updateProgress = () => {
      // Limite à 90% si pas connecté à Groq
      const maxProgress = isConnectedToGroq ? 100 : 90;
      
      if (progress < maxProgress) {
        // Calcul non-linéaire pour une progression plus naturelle
        // Ralentit à l'approche de 90% pour donner le temps à la connexion
        const increment = Math.max(1, 15 - Math.floor(progress / 8));
        const newProgress = Math.min(maxProgress, progress + increment);
        
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
    
    // Mise à jour immédiate à 100% quand la connexion est établie
    if (isConnectedToGroq && progress < 100) {
      setProgress(100);
      setLoadingText("Prêt !");
      if (onLoadingComplete) {
        setTimeout(() => {
          onLoadingComplete();
        }, 500);
      }
      return;
    }
    
    interval = window.setInterval(updateProgress, 200);
    
    return () => window.clearInterval(interval);
  }, [progress, onLoadingComplete, isConnectedToGroq]);
  
  // Texte contextuel basé sur l'état de connexion
  const getConnectionStatusText = () => {
    if (isConnectedToGroq) {
      return "Connecté à l'API Groq";
    } else if (isCheckingConnection) {
      return "Tentative de connexion à l'API Groq...";
    } else {
      return "Impossible de se connecter à l'API Groq. Veuillez vérifier votre connexion internet et votre clé API.";
    }
  };
  
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
        
        {/* État de connexion */}
        <div className={`mt-8 flex items-center justify-center space-x-2 ${!isConnectedToGroq && !isCheckingConnection ? 'text-red-300' : 'text-blue-200'}`}>
          {!isConnectedToGroq && !isCheckingConnection && (
            <WifiOff className="w-5 h-5 mr-1" />
          )}
          <p className="text-sm">{getConnectionStatusText()}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 