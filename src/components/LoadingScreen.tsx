import { useEffect, useState, useRef } from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  status?: string;
  progress?: number;
}

const LoadingScreen = ({ 
  status: initialStatus = "Chargement...", 
  progress: initialProgress = 0.5 
}: LoadingScreenProps) => {
  const visible = true;
  const [showText, setShowText] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const animationComplete = useRef(false);
  const timeoutRefs = useRef<number[]>([]);
  
  // Animation plus rapide du chargement
  useEffect(() => {
    let unmounted = false;
    document.body.classList.add("loading-active");
    
    // Animation sequence optimisée
    timeoutRefs.current.push(
      window.setTimeout(() => {
        if (!unmounted) setShowText(true);
      }, 100)
    );
    
    timeoutRefs.current.push(
      window.setTimeout(() => {
        if (!unmounted) setShowProgress(true);
      }, 200)
    );
    
    timeoutRefs.current.push(
      window.setTimeout(() => {
        if (!unmounted) {
          const calculatedWidth = initialProgress * 100;
          setProgressWidth(calculatedWidth);
          animationComplete.current = true;
        }
      }, 300)
    );
    
    // Force exit très rapide pour ne pas bloquer l'utilisateur
    timeoutRefs.current.push(
      window.setTimeout(() => {
        if (!unmounted) {
          document.body.classList.remove("loading-active");
          window.dispatchEvent(new CustomEvent("novachat:loading-complete"));
        }
      }, 400)
    );
    
    // Cleanup function
    return () => {
      unmounted = true;
      timeoutRefs.current.forEach(window.clearTimeout);
      document.body.classList.remove("loading-active");
    };
  }, [initialProgress]);
  
  return (
    <div 
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-black z-50 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Logo animé */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/30 mb-6 animate-fadeIn overflow-hidden">
          <Bot className="w-12 h-12 text-white relative z-10" />
        </div>
        
        {/* Nom de l'application */}
        <h1 className={cn(
          "text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent transition-all duration-300",
          showText ? "opacity-100" : "opacity-0"
        )}>
          Novachat
        </h1>
        
        {/* Texte de statut */}
        <div className={cn(
          "text-gray-400 text-base mb-6 text-center min-h-[24px]",
          showText ? "opacity-100" : "opacity-0"
        )}>
          {initialStatus}
        </div>
        
        {/* Barre de progression simplifiée */}
        <div className={cn(
          "w-64 h-2 bg-gray-800 rounded-full overflow-hidden relative",
          showProgress ? "opacity-100" : "opacity-0"
        )}>
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 