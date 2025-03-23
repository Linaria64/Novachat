import { useEffect, useState } from "react";
import { Bot, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  status?: string;
  progress?: number;
}

const LoadingScreen = ({ 
  status = "Chargement...", 
  progress = 0.5 
}: LoadingScreenProps) => {
  const [visible, setVisible] = useState(true);
  const [showText, setShowText] = useState(false);
  
  useEffect(() => {
    // Add loading-active class to body
    document.body.classList.add("loading-active");
    
    // Animate in text after a short delay
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 300);
    
    // Cleanup function
    return () => {
      clearTimeout(textTimer);
      
      // Add a fade-out animation before removing
      setVisible(false);
      const fadeTimer = setTimeout(() => {
        document.body.classList.remove("loading-active");
      }, 500);
      
      clearTimeout(fadeTimer);
    };
  }, []);
  
  return (
    <div 
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-gray-950 z-50 transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10vh] right-[-10vh] w-[50vh] h-[50vh] bg-blue-600/10 rounded-full filter blur-3xl animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
        <div className="absolute bottom-[-10vh] left-[-10vh] w-[50vh] h-[50vh] bg-purple-600/10 rounded-full filter blur-3xl animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite] delay-1000"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo container with animation */}
        <div className="w-24 h-24 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/30 mb-8 animate-[fadeIn_0.5s_ease_forwards,slideUp_0.5s_ease_forwards]">
          <Bot className="w-12 h-12 text-white" />
        </div>
        
        {/* App name with gradient */}
        <h1 className={cn(
          "text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent transition-all duration-500 animate-fadeIn",
          showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          Novachat
        </h1>
        
        {/* Status text */}
        <div className={cn(
          "text-gray-400 text-lg mb-8 text-center transition-all duration-500 animate-fadeIn delay-100",
          showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          {status}
        </div>
        
        {/* Progress bar */}
        <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        
        {/* Spinner */}
        <div className="absolute bottom-[-60px] opacity-50">
          <Loader className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 