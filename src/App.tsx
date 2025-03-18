import ChatInterface from "./components/ChatInterface";
import { useState } from "react";
import { Bot, MessageSquare, Settings, Moon, Sun, HelpCircle } from "lucide-react";
import { useTheme } from "./components/theme-provider";

function App() {
  const [showNavbar, setShowNavbar] = useState(false);
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Zone de détection pour afficher la navbar */}
      <div 
        className="absolute left-0 top-0 h-full w-16 z-20"
        onMouseEnter={() => setShowNavbar(true)}
      />

      {/* Navbar latérale avec effet de verre */}
      <div 
        className={`fixed left-0 top-0 h-full w-20 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md border-r border-white/20 dark:border-gray-800/30 z-30 transition-transform duration-300 ease-in-out ${
          showNavbar ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseLeave={() => setShowNavbar(false)}
      >
        <div className="flex flex-col items-center h-full py-8">
          <div className="flex flex-col items-center gap-8">
            {/* Logo */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            
            {/* Navigation items */}
            <div className="flex flex-col items-center gap-6 mt-8">
              <button className="w-10 h-10 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200/70 dark:hover:bg-blue-800/50 transition-colors">
                <MessageSquare size={20} />
              </button>
              <button className="w-10 h-10 rounded-full bg-gray-100/50 dark:bg-gray-800/30 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors">
                <Settings size={20} />
              </button>
              <button className="w-10 h-10 rounded-full bg-gray-100/50 dark:bg-gray-800/30 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors">
                <HelpCircle size={20} />
              </button>
            </div>
          </div>
          
          {/* Theme toggle at bottom */}
          <button 
            className="w-10 h-10 rounded-full bg-amber-100/50 dark:bg-indigo-900/30 flex items-center justify-center text-amber-600 dark:text-indigo-400 hover:bg-amber-200/70 dark:hover:bg-indigo-800/50 transition-colors mt-auto"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <main className="w-full h-screen">
        <ChatInterface />
      </main>
    </div>
  );
}

export default App;
