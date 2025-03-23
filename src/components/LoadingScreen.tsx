import { useEffect, useState, useRef } from "react";
import { Bot, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  status?: string;
  progress?: number;
}

const LoadingScreen = ({ 
  status: initialStatus = "Chargement...", 
  progress: initialProgress = 0.5 
}: LoadingScreenProps) => {
  const [visible, setVisible] = useState(true);
  const [showText, setShowText] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const [showPercentage, setShowPercentage] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(initialProgress);
  const animationComplete = useRef(false);
  const previousStatus = useRef(initialStatus);
  const [showStatusAnimation, setShowStatusAnimation] = useState(false);
  
  // Écouter les événements de mise à jour du chargement
  useEffect(() => {
    const handleLoadingUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { status, progress } = customEvent.detail;
        if (status && status !== previousStatus.current) {
          previousStatus.current = status;
          setShowStatusAnimation(true);
          setTimeout(() => setShowStatusAnimation(false), 500);
          setStatus(status);
        }
        if (progress !== undefined) setProgress(progress);
      }
    };
    
    window.addEventListener("novachat:loading-update", handleLoadingUpdate);
    
    return () => {
      window.removeEventListener("novachat:loading-update", handleLoadingUpdate);
    };
  }, []);
  
  // Animation de chargement complète
  useEffect(() => {
    let unmounted = false;
    // Add loading-active class to body
    document.body.classList.add("loading-active");
    
    // Animation sequence
    const textTimer = setTimeout(() => {
      if (!unmounted) setShowText(true);
    }, 500);
    
    const progressTimer = setTimeout(() => {
      if (!unmounted) setShowProgress(true);
    }, 800);
    
    const progressInitialTimer = setTimeout(() => {
      if (!unmounted) {
        setProgressWidth(20);
        setPercentage(20);
      }
    }, 1100);
    
    const percentageTimer = setTimeout(() => {
      if (!unmounted) setShowPercentage(true);
    }, 1300);
    
    const progressMidTimer = setTimeout(() => {
      if (!unmounted) {
        setProgressWidth(40);
        setPercentage(40);
      }
    }, 1600);
    
    const progressAdvancedTimer = setTimeout(() => {
      if (!unmounted) {
        const calculatedWidth = Math.max(70, progress * 100);
        setProgressWidth(calculatedWidth);
        setPercentage(Math.round(calculatedWidth));
        animationComplete.current = true;
      }
    }, 2300);
    
    // Cleanup function
    return () => {
      unmounted = true;
      clearTimeout(textTimer);
      clearTimeout(progressTimer);
      clearTimeout(progressInitialTimer);
      clearTimeout(percentageTimer);
      clearTimeout(progressMidTimer);
      clearTimeout(progressAdvancedTimer);
    };
  }, []);
  
  // Mise à jour du progrès
  useEffect(() => {
    if (animationComplete.current) {
      const calculatedWidth = progress * 100;
      setProgressWidth(calculatedWidth);
      setPercentage(Math.round(calculatedWidth));
    }
  }, [progress]);
  
  // Gestion de la fermeture
  useEffect(() => {
    return () => {
      setVisible(false);
      const fadeTimer = setTimeout(() => {
        document.body.classList.remove("loading-active");
      }, 800);
      
      clearTimeout(fadeTimer);
    };
  }, []);
  
  // Effet lumineux
  const [lightPosition, setLightPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLightPosition({
        x: Math.random() * 100,
        y: Math.random() * 100
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    // Ajouter la classe loading-active au body
    document.body.classList.add("loading-active");
    
    // Forcer la sortie de l'écran de chargement après un délai fixe
    const forceTimeout = setTimeout(() => {
      document.body.classList.remove("loading-active");
      window.dispatchEvent(new CustomEvent("novachat:loading-complete"));
    }, 3000); // Force exit after 3 seconds
    
    return () => {
      // Nettoyer au démontage
      clearTimeout(forceTimeout);
      document.body.classList.remove("loading-active");
    };
  }, []);
  
  return (
    <div 
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-black z-50 transition-opacity duration-800",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10vh] right-[-10vh] w-[50vh] h-[50vh] bg-blue-600/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[-10vh] left-[-10vh] w-[50vh] h-[50vh] bg-purple-600/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Dynamic light effect */}
        <div 
          className="absolute w-[30vh] h-[30vh] rounded-full bg-blue-400/10 filter blur-3xl transition-all duration-3000 ease-in-out"
          style={{ 
            top: `${lightPosition.y}%`, 
            left: `${lightPosition.x}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo container with animation */}
        <div className="w-24 h-24 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/30 mb-8 animate-fadeIn animate-slideUp overflow-hidden relative">
          <Bot className="w-12 h-12 text-white relative z-10" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 w-full bg-white/30 animate-shine" />
        </div>
        
        {/* App name with gradient */}
        <h1 className={cn(
          "text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent transition-all duration-500",
          showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          Novachat
        </h1>
        
        {/* Status text */}
        <div className={cn(
          "text-gray-400 text-lg mb-8 text-center transition-all duration-500 min-h-[28px] relative",
          showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <span className={cn(
            "absolute inset-0 flex items-center justify-center",
            showStatusAnimation ? "animate-slideInRight" : ""
          )}>
            {status}
          </span>
        </div>
        
        {/* Progress container */}
        <div className="flex flex-col items-center gap-2 w-64">
          {/* Progress bar */}
          <div className={cn(
            "w-full h-2 bg-gray-800 rounded-full overflow-hidden transition-all duration-500 relative",
            showProgress ? "opacity-100" : "opacity-0"
          )}>
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out relative"
              style={{ width: `${progressWidth}%` }}
            >
              {/* Shimmer effect inside progress bar */}
              <div className="absolute inset-0 w-full h-full animate-shimmer"></div>
            </div>
            
            {/* Pulse effect over progress bar */}
            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-30 animate-progress-pulse" />
          </div>
          
          {/* Percentage display */}
          <div className={cn(
            "text-xs font-medium text-gray-400 transition-all duration-500 self-end",
            showPercentage ? "opacity-100" : "opacity-0"
          )}>
            {percentage}%
          </div>
        </div>
        
        {/* Spinner */}
        <div className={cn(
          "absolute bottom-[-60px] transition-opacity duration-500",
          showProgress ? "opacity-50" : "opacity-0"
        )}>
          <Loader className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 