import { useState, useEffect, useCallback, useMemo } from "react";
import { Bot, MessageSquare, Settings, Moon, Sun, HelpCircle, Terminal, Database, FileCode, Code, Brain } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ChatInterface from "./components/ChatInterface";
import LoadingScreen from "./components/LoadingScreen";
import { checkConnection } from "@/services/groqService";
import "./App.css";
import { toast } from "sonner";

// Constants
const LOADING_DELAY = 1000;
const THEME_STORAGE_KEY = "chatopia-theme";
const MOBILE_BREAKPOINT = 768;

function App() {
  // State
  const [isLoading, setIsLoading] = useState(true);
  
  // Developer mode states
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  
  // Application states
  const [isConnectedToGroq, setIsConnectedToGroq] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(
    localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light"
  );
  const [showNavbar, setShowNavbar] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  
  // Theme management
  useEffect(() => {
    // Set theme on body element
    document.body.classList.toggle("dark", theme === "dark");
    
    // Store theme preference
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);
  
  // Mobile detection
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);
  
  // Check API connection
  useEffect(() => {
    setIsCheckingConnection(true);
    
    const checkApi = async () => {
      try {
        const isConnected = await checkConnection();
        setIsConnectedToGroq(isConnected);
      } catch (error) {
        console.error("Error checking API connection:", error);
        setIsConnectedToGroq(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    const timeout = setTimeout(checkApi, 1500);
    return () => clearTimeout(timeout);
  }, []);
  
  // Simulate loading process
  useEffect(() => {
    // Set initial theme based on system preference or stored value
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme) {
      setTheme(storedTheme as "light" | "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
    
    // Simulate loading process with a delay
    const loadingTimeout = setTimeout(() => {
      if (isConnectedToGroq || !isCheckingConnection) {
        setIsLoading(false);
        window.dispatchEvent(new CustomEvent("novachat:loading-complete"));
      }
    }, LOADING_DELAY * 3); 
    
    return () => clearTimeout(loadingTimeout);
  }, [isConnectedToGroq, isCheckingConnection]);
  
  // Event handlers
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === "dark" ? "light" : "dark");
  }, []);

  const toggleDeveloperMode = useCallback(() => {
    setIsDeveloperMode(prev => !prev);
    
    if (!isDeveloperMode) {
      toast.success("Mode développeur activé");
    }
  }, [isDeveloperMode]);

  const handleNewChat = useCallback(() => {
    window.dispatchEvent(new CustomEvent('novachat:new-conversation'));
  }, []);

  // Developer mode feature handlers
  const handleTerminalClick = useCallback(() => {
    toast.info('Terminal (fonctionnalité à venir)');
  }, []);

  const handleDatabaseClick = useCallback(() => {
    toast.info('Base de données (fonctionnalité à venir)');
  }, []);

  const handleCodeEditorClick = useCallback(() => {
    toast.info('Éditeur de code (fonctionnalité à venir)');
  }, []);

  // Secret developer mode activation
  const handleLogoClick = useCallback(() => {
    if (!isDeveloperMode) {
      setIsDeveloperMode(true);
    }
  }, [isDeveloperMode]);

  // Memoized components
  const DesktopNavbar = useMemo(() => (
    <div 
      className={`fixed left-0 top-0 h-full glassmorphism z-30 transition-all duration-300 ease-out shadow-lg ${
        showNavbar ? 'w-64 translate-x-0' : 'w-24 translate-x-[-70%]'
      }`}
      onMouseEnter={() => setShowNavbar(true)}
      onMouseLeave={() => setShowNavbar(false)}
    >
      {/* Hover trigger area */}
      <div 
        className="absolute top-0 -right-6 h-full w-6" 
        onMouseEnter={() => setShowNavbar(true)}
      />
      
      {/* Logo and title */}
      <div className="w-full flex justify-center items-center py-8 mb-8">
        <div className={`flex items-center justify-center transition-all duration-300 ${showNavbar ? 'ml-0' : 'ml-14'}`}>
          <div 
            className={`p-3 rounded-full transition-all cursor-pointer shadow-md ${
              isDeveloperMode ? "bg-gradient-to-br from-amber-500 to-red-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"
            }`}
            onClick={handleLogoClick}
            aria-label="Logo"
          >
            <Bot size={30} className="text-white" />
          </div>
          {showNavbar && <span className="ml-3 font-bold text-xl opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>NovaChat</span>}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-col items-center gap-5 mt-6 px-3">
        {/* Developer mode toggle */}
        {isDeveloperMode && (
          <button 
            className={`nav-button w-full ${showNavbar ? 'pl-4 pr-3 justify-between' : 'w-12 mx-auto justify-center'} ${
              isDeveloperMode 
                ? "text-amber-600 dark:text-amber-400" 
                : "text-blue-600 dark:text-blue-400"
            }`}
            onClick={toggleDeveloperMode}
            title={isDeveloperMode ? "Passer en mode utilisateur" : "Passer en mode développeur"}
          >
            <div className="flex items-center">
              {isDeveloperMode ? <Code size={20} /> : <Bot size={20} />}
              {showNavbar && <span className="ml-3 text-sm font-medium">Mode {isDeveloperMode ? "Développeur" : "Utilisateur"}</span>}
            </div>
            {showNavbar && (
              <Switch 
                checked={isDeveloperMode}
                className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-blue-500"
              />
            )}
          </button>
        )}
        
        {/* New chat button */}
        <button 
          className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} bg-gradient-primary text-white`}
          onClick={handleNewChat}
          title="Nouvelle conversation"
        >
          <MessageSquare size={20} />
          {showNavbar && <span className="ml-3 text-sm font-medium">Nouvelle conversation</span>}
        </button>
        
        {/* Developer mode buttons */}
        {isDeveloperMode && (
          <div className={`flex flex-col gap-4 w-full ${showNavbar ? '' : 'items-center'}`}>
            <button 
              className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} bg-gradient-secondary text-white`}
              onClick={handleTerminalClick}
              title="Terminal"
            >
              <Terminal size={20} />
              {showNavbar && <span className="ml-3 text-sm font-medium">Terminal</span>}
            </button>
            
            <button 
              className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} bg-gradient-secondary text-white`}
              onClick={handleDatabaseClick}
              title="Base de données"
            >
              <Database size={20} />
              {showNavbar && <span className="ml-3 text-sm font-medium">Base de données</span>}
            </button>
            
            <button 
              className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} bg-gradient-secondary text-white`}
              onClick={handleCodeEditorClick}
              title="Éditeur de code"
            >
              <FileCode size={20} />
              {showNavbar && <span className="ml-3 text-sm font-medium">Éditeur de code</span>}
            </button>
          </div>
        )}
        
        {/* Separator */}
        <div className={`my-2 ${showNavbar ? 'w-full' : 'w-12'} h-px bg-gray-200 dark:bg-gray-700 opacity-50`}></div>
        
        {/* Settings and theme buttons */}
        <button 
          className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} text-gray-600 dark:text-gray-300`}
          onClick={() => setShowSettingsDialog(true)}
          title="Paramètres"
        >
          <Settings size={20} />
          {showNavbar && <span className="ml-3 text-sm font-medium">Paramètres</span>}
        </button>
        
        <button 
          className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} text-gray-600 dark:text-gray-300`}
          onClick={() => setShowHelpDialog(true)}
          title="Aide"
        >
          <HelpCircle size={20} />
          {showNavbar && <span className="ml-3 text-sm font-medium">Aide</span>}
        </button>
        
        <button 
          className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} text-gray-600 dark:text-gray-300 mt-auto mb-6`}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {showNavbar && <span className="ml-3 text-sm font-medium">Mode {theme === 'dark' ? 'clair' : 'sombre'}</span>}
        </button>
      </div>
    </div>
  ), [showNavbar, isDeveloperMode, handleLogoClick, toggleDeveloperMode, handleNewChat, handleTerminalClick, handleDatabaseClick, handleCodeEditorClick, toggleTheme, theme]);

  const MobileNavbar = useMemo(() => (
    <div className="mobile-navbar">
      {/* Logo button de gauche */}
      <button 
        className={`mobile-navbar-button ${
          isDeveloperMode
            ? "bg-gradient-to-br from-amber-500 to-red-600"
            : "bg-gradient-to-br from-blue-500 to-indigo-600"
        }`}
        onClick={handleLogoClick}
        title="NovaChat"
        aria-label="Logo NovaChat"
      >
        <Bot className="h-6 w-6 text-white" />
      </button>
    
      {/* Developer mode button */}
      {isDeveloperMode && (
        <button 
          className={`mobile-navbar-button ${
            isDeveloperMode
              ? "bg-amber-500"
              : "bg-blue-500"
          }`}
          onClick={toggleDeveloperMode}
          title={isDeveloperMode ? "Passer en mode utilisateur" : "Passer en mode développeur"}
          aria-label={isDeveloperMode ? "Passer en mode utilisateur" : "Passer en mode développeur"}
        >
          {isDeveloperMode ? (
            <Code className="h-6 w-6 text-white" />
          ) : (
            <Bot className="h-6 w-6 text-white" />
          )}
        </button>
      )}
      
      {/* New chat button - central et plus gros */}
      <button 
        className="mobile-navbar-button bg-gradient-primary text-white scale-110"
        onClick={handleNewChat}
        title="Nouvelle conversation"
        aria-label="Nouvelle conversation"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
      
      {/* Developer mode buttons */}
      {isDeveloperMode && (
        <>
          <button 
            className="mobile-navbar-button bg-gradient-secondary text-white"
            onClick={handleTerminalClick}
            title="Terminal"
            aria-label="Terminal"
          >
            <Terminal className="h-6 w-6" />
          </button>
        </>
      )}
      
      {/* Settings and theme buttons */}
      <button 
        className="mobile-navbar-button bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        onClick={() => setShowSettingsDialog(true)}
        title="Paramètres"
        aria-label="Paramètres"
      >
        <Settings className="h-6 w-6" />
      </button>
      
      <button 
        className="mobile-navbar-button bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        onClick={toggleTheme}
        title={theme === "dark" ? "Mode clair" : "Mode sombre"}
        aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
      >
        {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>
    </div>
  ), [isDeveloperMode, toggleDeveloperMode, handleNewChat, handleTerminalClick, toggleTheme, theme, handleLogoClick]);

  const SettingsDialog = useMemo(() => (
    <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
      <DialogContent className="sm:max-w-md glassmorphism">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Paramètres</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {/* Developer mode option */}
          {isDeveloperMode && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Mode développeur</h3>
                <p className="text-sm text-muted-foreground">Activer les fonctionnalités avancées</p>
              </div>
              <Switch 
                checked={isDeveloperMode} 
                onCheckedChange={toggleDeveloperMode} 
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          )}
          
          {/* Dark theme option */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Thème sombre</h3>
              <p className="text-sm text-muted-foreground">Changer l'apparence de l'application</p>
            </div>
            <Switch 
              checked={theme === "dark"} 
              onCheckedChange={toggleTheme} 
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>
          
          {/* API connection status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">État de connexion</h3>
              <p className="text-sm text-muted-foreground">Statut de l'API Groq</p>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isConnectedToGroq ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-sm">{isConnectedToGroq ? "Connecté" : "Déconnecté"}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ), [showSettingsDialog, setShowSettingsDialog, isDeveloperMode, toggleDeveloperMode, theme, toggleTheme, isConnectedToGroq]);

  const HelpDialog = useMemo(() => (
    <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
      <DialogContent className="sm:max-w-lg glassmorphism">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Aide</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <h3 className="font-medium mb-2">À propos de NovaChat</h3>
            <p className="text-sm text-muted-foreground">NovaChat est un assistant IA personnel propulsé par les modèles de langage de Groq.</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Commandes disponibles</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm">Nouvelle conversation - Démarrer une nouvelle discussion</span>
              </div>
              
              {isDeveloperMode && (
                <>
                  <div className="flex items-center">
                    <Terminal className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-sm">Terminal - Accéder au terminal (bientôt disponible)</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Base de données - Gérer les données (bientôt disponible)</span>
                  </div>
                  
                  <div className="flex items-center">
                    <FileCode className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-sm">Éditeur de code - Modifier du code (bientôt disponible)</span>
                  </div>
                </>
              )}
              
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Paramètres - Configurer l'application</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Modes de conversation</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm">Normal - Réponses concises et directes</span>
              </div>
              
              <div className="flex items-center">
                <Brain className="h-4 w-4 mr-2 text-purple-500" />
                <span className="text-sm">Reasoning - Réponses détaillées avec un raisonnement étape par étape</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ), [showHelpDialog, setShowHelpDialog, isDeveloperMode]);

  return (
    <div className={`min-h-screen bg-background relative ${isMobile ? 'main-container' : 'overflow-hidden'}`}>
      {/* Fond d'écran animé */}
      <div className="app-background">
        <div className="app-background-accent-1"></div>
        <div className="app-background-accent-2"></div>
      </div>
      
      {isLoading ? (
        <LoadingScreen 
          onLoadingComplete={() => setIsLoading(false)}
          isConnectedToGroq={isConnectedToGroq}
          isCheckingConnection={isCheckingConnection}
        />
      ) : (
        <>
          {/* Responsive navigation */}
          {!isMobile ? DesktopNavbar : MobileNavbar}

          {/* Main chat area */}
          <main className={`w-full ${isMobile ? 'pb-20 min-h-screen' : 'h-screen'}`}>
            <ChatInterface className={isMobile ? 'mobile-optimized' : 'ml-12'} />
          </main>
          
          {/* Dialogs */}
          {SettingsDialog}
          {HelpDialog}
        </>
      )}
    </div>
  );
}

export default App;
