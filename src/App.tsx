import { useState, useEffect, useCallback, useMemo } from "react";
import { Bot, MessageSquare, Settings, Moon, Sun, HelpCircle, Code } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChatInterface from "./components/ChatInterface";
import LoadingScreen from "./components/LoadingScreen";
import { useTheme } from "@/components/ThemeProvider";
import { checkConnection as checkGroqConnection, AVAILABLE_MODELS as GROQ_MODELS } from "@/services/groqService";
import { checkConnection as checkOllamaConnection, AVAILABLE_MODELS as OLLAMA_MODELS, fetchOllamaModels } from "@/services/ollamaService";
import "./App.css";

// Constants
const MOBILE_BREAKPOINT = 768;

function App() {
  // Theme
  const { theme, setTheme } = useTheme();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  
  // Developer mode states
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isConnectedToOllama, setIsConnectedToOllama] = useState(false);
  const [selectedService, setSelectedService] = useState<"groq" | "ollama">("groq");
  const [selectedGroqModel, setSelectedGroqModel] = useState<string>("llama3-70b-8192");
  const [selectedQwqModel, setSelectedQwqModel] = useState<string>("qwen-qwq-32b");
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>("llama3");
  
  // Application states
  const [isConnectedToGroq, setIsConnectedToGroq] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [showNavbar, setShowNavbar] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  
  // Function to check if viewport is mobile
  const checkIsMobile = () => {
    const isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(isMobileView);
    
    // Automatically disable developer mode on mobile
    if (isMobileView && isDeveloperMode) {
      setIsDeveloperMode(false);
    }
  };
  
  // API connection check function
  const checkApi = async () => {
    try {
      setIsCheckingConnection(true);
      // Définir les modèles par défaut
      setSelectedGroqModel("llama3-70b-8192");
      (window as any).selectedGroqModel = "llama3-70b-8192";
      (window as any).selectedQwqModel = "qwen-qwq-32b";
      
      console.log("Tentative de connexion à Groq avec la clé API...");
      const isConnected = await checkGroqConnection();
      console.log("Résultat de la connexion à Groq:", isConnected);
      setIsConnectedToGroq(isConnected);
      
      // Force connection to Groq by default
      if (isConnected) {
        setSelectedService("groq");
        (window as any).selectedService = "groq";
      }
      
      // Also check Ollama if in developer mode
      if (isDeveloperMode) {
        const isOllamaConnected = await checkOllamaConnection();
        setIsConnectedToOllama(isOllamaConnected);
        
        // Fetch Ollama models if connected
        if (isOllamaConnected) {
          await fetchOllamaModels();
        }
      }
    } catch (error) {
      console.error("Error checking API connection:", error);
      setIsConnectedToGroq(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };
  
  // Share state with other components
  useEffect(() => {
    // Make these states globally accessible for components that need them
    (window as any).isDeveloperMode = isDeveloperMode;
    (window as any).isConnectedToOllama = isConnectedToOllama;
    (window as any).selectedService = selectedService;
    (window as any).selectedGroqModel = selectedGroqModel;
    (window as any).selectedQwqModel = selectedQwqModel;
    (window as any).selectedOllamaModel = selectedOllamaModel;
  }, [isDeveloperMode, isConnectedToOllama, selectedService, selectedGroqModel, selectedQwqModel, selectedOllamaModel]);
  
  // Theme management
  useEffect(() => {
    // Set theme on body element
    document.body.classList.toggle("dark", theme === "dark");
  }, [theme]);
  
  // Mobile detection and theme adjustment
  useEffect(() => {
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    
    // Force dark theme on mobile
    if (isMobile) {
      setTheme("dark");
    }
    
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [isDeveloperMode, setTheme]);
  
  // Disable developer mode when switching to mobile
  useEffect(() => {
    if (isMobile && isDeveloperMode) {
      setIsDeveloperMode(false);
    }
  }, [isMobile]);
  
  // Set initial app state
  useEffect(() => {
    // Stocker la clé API Groq avec la nouvelle fonction sécurisée
    const apiKey = "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";
    // Importer le service de stockage
    import("@/services/localService").then(({ setApiKey }) => {
      setApiKey(apiKey);
      
      // Attendre que la clé soit enregistrée avant de masquer l'écran de chargement
      setTimeout(() => {
        setIsLoading(false);
        // Mettre à jour les éléments du DOM pour indiquer que le chargement est terminé
        document.body.classList.remove("loading-active");
        window.dispatchEvent(new CustomEvent("novachat:loading-complete"));
      }, 500);
    });
    
    // Check API connection
    checkApi();
    
    // Set up resize event listener
    window.addEventListener("resize", checkIsMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);
  
  // Recheck API when developer mode changes
  useEffect(() => {
    if (isDeveloperMode) {
      checkApi();
    }
  }, [isDeveloperMode]);
  
  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Event handlers
  const toggleDeveloperMode = useCallback(() => {
    setIsDeveloperMode(prev => !prev);
  }, []);

  const handleNewChat = useCallback(() => {
    window.dispatchEvent(new CustomEvent('novachat:new-conversation'));
  }, []);

  // Developer mode feature handlers
  const handleOllamaConnection = useCallback(() => {
    if (selectedService === "ollama") {
      setIsConnectedToOllama(prev => !prev);
    } else {
      // Toggle service selection
      setSelectedService("ollama");
      // Disconnect Groq when switching to Ollama
      if (isConnectedToGroq) {
        setIsConnectedToGroq(false);
      }
    }
  }, [isConnectedToOllama, selectedService, isConnectedToGroq]);

  const handleGroqConnection = useCallback(() => {
    if (selectedService === "groq") {
      // Groq connection is handled by the API check
      setIsConnectedToGroq(prev => !prev);
    } else {
      // Toggle service selection
      setSelectedService("groq");
      // Disconnect Ollama when switching to Groq
      if (isConnectedToOllama) {
        setIsConnectedToOllama(false);
      }
    }
  }, [isConnectedToGroq, selectedService, isConnectedToOllama]);

  // Secret developer mode activation
  const handleLogoClick = useCallback(() => {
    if (!isDeveloperMode && !isMobile) {
      setIsDeveloperMode(true);
    }
  }, [isDeveloperMode, isMobile]);

  // Memoized components
  const DesktopNavbar = useMemo(() => (
    <div 
      className={`fixed left-0 top-0 h-full bg-gray-900/50 backdrop-blur-md border border-gray-700/30 z-30 transition-all duration-300 ease-out shadow-lg ${
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
          {showNavbar && <span className="ml-3 font-bold text-xl opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>Novachat</span>}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-col items-center gap-5 mt-6 px-3">
        {/* Developer mode toggle */}
        {isDeveloperMode && (
          <button 
            className={`flex items-center h-10 px-3 rounded-lg text-sm transition-all duration-200 hover:bg-gray-100/10 active:bg-gray-100/20 w-full ${showNavbar ? 'pl-4 pr-3 justify-between' : 'w-12 mx-auto justify-center'} ${
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
          className={`flex items-center h-10 px-3 rounded-lg text-sm transition-all duration-200 hover:bg-gray-100/10 active:bg-gray-100/20 ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} bg-gradient-to-br from-blue-600 to-indigo-700 text-white`}
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
              className={`flex items-center h-10 px-3 rounded-lg text-sm transition-all duration-200 hover:bg-gray-100/10 active:bg-gray-100/20 ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} ${
                selectedService === "ollama" 
                  ? (isConnectedToOllama 
                    ? "bg-gradient-to-br from-green-600 to-emerald-700 text-white" 
                    : "bg-gradient-to-br from-purple-600 to-indigo-700 text-white")
                  : "bg-gray-800/80 text-gray-400"
              }`}
              onClick={handleOllamaConnection}
              title="Ollama"
            >
              <Bot size={20} />
              {showNavbar && (
                <div className="flex items-center justify-between w-full ml-3">
                  <span className="text-sm font-medium">Ollama</span>
                  {selectedService === "ollama" && isConnectedToOllama && (
                    <div className="h-2 w-2 rounded-full bg-green-400 ml-2"></div>
                  )}
                </div>
              )}
            </button>

            <button 
              className={`flex items-center h-10 px-3 rounded-lg text-sm transition-all duration-200 hover:bg-gray-100/10 active:bg-gray-100/20 ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} ${
                selectedService === "groq" 
                  ? (isConnectedToGroq 
                    ? "bg-gradient-to-br from-green-600 to-emerald-700 text-white" 
                    : "bg-gradient-to-br from-purple-600 to-indigo-700 text-white")
                  : "bg-gray-800/80 text-gray-400"
              }`}
              onClick={handleGroqConnection}
              title="Groq"
            >
              <MessageSquare size={20} />
              {showNavbar && (
                <div className="flex items-center justify-between w-full ml-3">
                  <span className="text-sm font-medium">Groq</span>
                  {selectedService === "groq" && isConnectedToGroq && (
                    <div className="h-2 w-2 rounded-full bg-green-400 ml-2"></div>
                  )}
                </div>
              )}
            </button>
          </div>
        )}
        
        {/* Separator */}
        <div className={`my-2 ${showNavbar ? 'w-full' : 'w-12'} h-px bg-gray-200 dark:bg-gray-700 opacity-50`}></div>
        
        {/* Settings and theme buttons */}
        <button 
          className={`flex items-center h-10 px-3 rounded-lg text-sm transition-all duration-200 hover:bg-gray-100/10 active:bg-gray-100/20 ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} text-gray-600 dark:text-gray-300`}
          onClick={() => setShowSettingsDialog(true)}
          title="Paramètres"
        >
          <Settings size={20} />
          {showNavbar && <span className="ml-3 text-sm font-medium">Paramètres</span>}
        </button>
        
        <button 
          className={`flex items-center h-10 px-3 rounded-lg text-sm transition-all duration-200 hover:bg-gray-100/10 active:bg-gray-100/20 ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} text-gray-600 dark:text-gray-300`}
          onClick={() => setShowHelpDialog(true)}
          title="Aide"
        >
          <HelpCircle size={20} />
          {showNavbar && <span className="ml-3 text-sm font-medium">Aide</span>}
        </button>
        
        <button 
          className={`flex items-center h-10 px-3 rounded-lg text-sm transition-all duration-200 hover:bg-gray-100/10 active:bg-gray-100/20 ${showNavbar ? 'w-full pl-4' : 'w-12 mx-auto'} text-gray-600 dark:text-gray-300 mt-auto mb-6`}
          onClick={toggleTheme}
          title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          {showNavbar && <span className="ml-3 text-sm font-medium">{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>}
        </button>
      </div>
    </div>
  ), [showNavbar, isDeveloperMode, toggleDeveloperMode, handleNewChat, handleOllamaConnection, handleGroqConnection, setShowSettingsDialog, setShowHelpDialog, 
     toggleTheme, theme, handleLogoClick]);

  const SettingsDialog = useMemo(() => (
    <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
      <DialogContent className="sm:max-w-md bg-gray-900/50 backdrop-blur-md border border-gray-700/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Paramètres</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {/* Developer mode option */}
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
          
          {/* Developer mode options */}
          {isDeveloperMode && (
            <>
              {/* Ollama connection status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Ollama</h3>
                  <p className="text-sm text-muted-foreground">Status de connexion à Ollama</p>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${selectedService === "ollama" && isConnectedToOllama ? "bg-green-500" : "bg-red-500"}`}></div>
                  <span className="text-sm">{selectedService === "ollama" && isConnectedToOllama ? "Connecté" : "Déconnecté"}</span>
                </div>
              </div>
              
              {/* Service selection */}
              <div className="flex flex-col gap-2">
                <h3 className="font-medium">Service d'IA</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center ${
                      selectedService === "groq" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      setSelectedService("groq");
                      // Disconnect Ollama when switching to Groq
                      if (isConnectedToOllama) {
                        setIsConnectedToOllama(false);
                      }
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span>Groq</span>
                  </button>
                  
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center ${
                      selectedService === "ollama" 
                        ? "bg-purple-600 text-white" 
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      setSelectedService("ollama");
                      // Disconnect Groq when switching to Ollama
                      if (isConnectedToGroq) {
                        setIsConnectedToGroq(false);
                      }
                    }}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    <span>Ollama</span>
                  </button>
                </div>
              </div>
              
              {/* Model selection */}
              {selectedService === "groq" ? (
                <>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium">Modèle Groq</h3>
                    <Select value={selectedGroqModel} onValueChange={setSelectedGroqModel}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Sélectionner un modèle" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {GROQ_MODELS.map(model => (
                          <SelectItem key={model.id} value={model.id} className="focus:bg-gray-700">
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Modèle de raisonnement */}
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium">Modèle de raisonnement</h3>
                    <p className="text-sm text-muted-foreground">Utilisé en mode raisonnement</p>
                    <Select value={selectedQwqModel} onValueChange={(value) => {
                      setSelectedQwqModel(value);
                      (window as any).selectedQwqModel = value;
                    }}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Sélectionner un modèle de raisonnement" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="qwen-qwq-32b" className="focus:bg-gray-700">
                          Qwen QWQ (32B)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">Modèle Ollama</h3>
                  <Select value={selectedOllamaModel} onValueChange={setSelectedOllamaModel}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Sélectionner un modèle" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {OLLAMA_MODELS.map(model => (
                        <SelectItem key={model.id} value={model.id} className="focus:bg-gray-700">
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  ), [showSettingsDialog, setShowSettingsDialog, isDeveloperMode, toggleDeveloperMode, theme, toggleTheme, isConnectedToGroq, selectedService, isConnectedToOllama, selectedGroqModel, setSelectedGroqModel, selectedOllamaModel, setSelectedOllamaModel, setIsConnectedToGroq, setIsConnectedToOllama]);

  const HelpDialog = useMemo(() => (
    <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
      <DialogContent className="sm:max-w-lg bg-gray-900/50 backdrop-blur-md border border-gray-700/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Aide</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Que puis-je demander ?</h3>
            <div className="space-y-2 text-sm text-gray-200">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm">Chat - Posez des questions générales, discutez et obtenez des réponses</span>
              </div>
              
              <div className="flex items-center">
                <Code className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Code - Écrivez, analysez ou expliquez du code dans différents langages</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ), [showHelpDialog, setShowHelpDialog, isDeveloperMode]);

  return (
    <div className={`min-h-screen bg-background relative ${isMobile ? 'pb-20 pt-4' : 'overflow-hidden'}`}>
      {/* Animated background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gradient-to-b from-gray-950 via-indigo-950/30 to-gray-950">
        <div className="absolute top-[-50vh] right-[-50vh] w-[100vh] h-[100vh] rounded-full blur-3xl opacity-20 bg-blue-500/30 animate-pulse-slow"></div>
        <div className="absolute bottom-[-50vh] left-[-50vh] w-[100vh] h-[100vh] rounded-full blur-3xl opacity-20 bg-violet-500/30 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {isLoading ? (
        <LoadingScreen 
          status={isConnectedToGroq 
            ? "Connexion établie, initialisation de l'interface" 
            : isCheckingConnection 
              ? "Tentative de connexion à l'API..." 
              : "Impossible de se connecter à l'API"
          }
          progress={isConnectedToGroq ? 0.9 : isCheckingConnection ? 0.5 : 0.7}
        />
      ) : (
        <>
          {/* Responsive navigation - only display on desktop */}
          {!isMobile && DesktopNavbar}

          {/* Main chat area */}
          <main className={`w-full ${isMobile ? 'min-h-screen' : 'h-screen'}`}>
            <ChatInterface 
              className={isMobile ? 'mobile-optimized' : 'ml-12'}
            />
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