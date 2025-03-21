import { useState, useEffect, useCallback } from "react";
import { Bot, MessageSquare, Settings, Moon, Sun, HelpCircle, Terminal, Database, FileCode, Code, Brain } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ChatInterface from "./components/ChatInterface";
import LoadingScreen from "./components/LoadingScreen";
import { checkConnection as checkGroqConnection } from "@/services/groqService";
import "./App.css";

function App() {
  // États
  const [showNavbar, setShowNavbar] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    const savedMode = localStorage.getItem("chatopia-developer-mode");
    return savedMode ? savedMode === "true" : false;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectedToGroq, setIsConnectedToGroq] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
  // Gestion du thème
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("chatopia-theme", theme);
  }, [theme]);
  
  // Chargement du thème depuis localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("chatopia-theme");
    if (savedTheme) {
      setTheme(savedTheme as "light" | "dark");
    }
  }, []);
  
  // Détecter les appareils mobiles
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);
  
  // Enregistrer le mode développeur
  useEffect(() => {
    localStorage.setItem("chatopia-developer-mode", isDeveloperMode.toString());
  }, [isDeveloperMode]);
  
  // Vérifier la connexion à l'API
  useEffect(() => {
    const checkApiConnection = async () => {
      setIsCheckingConnection(true);
      try {
        const isConnected = await checkGroqConnection();
        setIsConnectedToGroq(isConnected);
      } catch (error) {
        console.error("Error checking API connection:", error);
        setIsConnectedToGroq(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    checkApiConnection();
    
    // Ajouter un écouteur d'événements pour le chargement
    const handleLoadingComplete = () => {
      setIsLoading(false);
      // Supprimer la classe de chargement
      document.body.classList.remove("loading-active");
    };
    
    const timeout = setTimeout(() => {
      if (isConnectedToGroq) {
        handleLoadingComplete();
        
        // Émettre un événement pour indiquer la fin du chargement
        const event = new CustomEvent("novachat:loading-complete");
        window.dispatchEvent(event);
      }
    }, 1000);
    
    // Ajouter une classe pour indiquer le chargement
    document.body.classList.add("loading-active");
    
    return () => {
      clearTimeout(timeout);
    };
  }, [isConnectedToGroq]);
  
  // Handlers
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === "dark" ? "light" : "dark");
  }, []);

  const toggleDeveloperMode = useCallback(() => {
    setIsDeveloperMode(prev => !prev);
  }, []);

  const handleNewChat = useCallback(() => {
    const event = new CustomEvent('novachat:new-conversation');
    window.dispatchEvent(event);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setShowSettingsDialog(true);
  }, []);

  const handleHelpClick = useCallback(() => {
    setShowHelpDialog(true);
  }, []);

  // Fonctions pour les outils développeur
  const handleTerminalClick = useCallback(() => {
    alert('Terminal (fonctionnalité à venir)');
  }, []);

  const handleDatabaseClick = useCallback(() => {
    alert('Base de données (fonctionnalité à venir)');
  }, []);

  const handleCodeEditorClick = useCallback(() => {
    alert('Éditeur de code (fonctionnalité à venir)');
  }, []);

  return (
    <div className={`min-h-screen bg-background relative ${isMobile ? 'main-container' : 'overflow-hidden'}`}>
      {isLoading ? (
        <LoadingScreen 
          onLoadingComplete={() => setIsLoading(false)}
          isConnectedToGroq={isConnectedToGroq}
          isCheckingConnection={isCheckingConnection}
        />
      ) : (
        <>
          {/* Navbar pour Desktop */}
          {!isMobile && (
            <div 
              className={`fixed left-0 top-0 h-full glassmorphism z-30 transition-all duration-300 ease-out shadow-lg ${
                showNavbar ? 'w-64 translate-x-0' : 'w-24 translate-x-[-70%]'
              }`}
              onMouseEnter={() => setShowNavbar(true)}
              onMouseLeave={() => setShowNavbar(false)}
            >
              {/* Logo et titre */}
              <div className="w-full flex justify-center items-center py-6 mb-8">
                <div className={`flex items-center justify-center transition-all duration-300 ${showNavbar ? 'ml-0' : 'ml-14'}`}>
                  <div className={`p-2 rounded-full transition-all ${isDeveloperMode ? "bg-gradient-to-br from-amber-500 to-red-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}>
                    <Bot size={28} className="text-white" />
                  </div>
                  {showNavbar && <span className="ml-3 font-bold text-lg opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>NovaChat</span>}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex flex-col items-center gap-4 mt-6 px-3">
                {/* Mode toggle */}
                <button 
                  className={`nav-button w-full ${showNavbar ? 'pl-4 pr-3 justify-between' : 'w-10 mx-auto justify-center'} ${
                    isDeveloperMode 
                      ? "text-amber-600 dark:text-amber-400" 
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                  onClick={toggleDeveloperMode}
                  title={isDeveloperMode ? "Passer en mode utilisateur" : "Passer en mode développeur"}
                >
                  <div className="flex items-center">
                    {isDeveloperMode ? <Code size={18} /> : <Bot size={18} />}
                    {showNavbar && <span className="ml-3 text-sm font-medium">Mode {isDeveloperMode ? "Développeur" : "Utilisateur"}</span>}
                  </div>
                  {showNavbar && (
                    <Switch 
                      checked={isDeveloperMode}
                      className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-blue-500"
                    />
                  )}
                </button>
                
                {/* Bouton nouvelle conversation */}
                <button 
                  className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-10 mx-auto'} bg-gradient-primary text-white`}
                  onClick={handleNewChat}
                  title="Nouvelle conversation"
                >
                  <MessageSquare size={18} />
                  {showNavbar && <span className="ml-3 text-sm font-medium">Nouvelle conversation</span>}
                </button>
                
                {/* Boutons spécifiques au mode développeur */}
                {isDeveloperMode && (
                  <div className={`flex flex-col gap-4 w-full ${showNavbar ? '' : 'items-center'}`}>
                    <button 
                      className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-10 mx-auto'} bg-gradient-secondary text-white`}
                      onClick={handleTerminalClick}
                      title="Terminal"
                    >
                      <Terminal size={18} />
                      {showNavbar && <span className="ml-3 text-sm font-medium">Terminal</span>}
                    </button>
                    
                    <button 
                      className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-10 mx-auto'} bg-gradient-secondary text-white`}
                      onClick={handleDatabaseClick}
                      title="Base de données"
                    >
                      <Database size={18} />
                      {showNavbar && <span className="ml-3 text-sm font-medium">Base de données</span>}
                    </button>
                    
                    <button 
                      className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-10 mx-auto'} bg-gradient-secondary text-white`}
                      onClick={handleCodeEditorClick}
                      title="Éditeur de code"
                    >
                      <FileCode size={18} />
                      {showNavbar && <span className="ml-3 text-sm font-medium">Éditeur de code</span>}
                    </button>
                  </div>
                )}
                
                {/* Séparateur */}
                <div className={`my-2 ${showNavbar ? 'w-full' : 'w-10'} h-px bg-gray-200 dark:bg-gray-700 opacity-50`}></div>
                
                {/* Boutons toujours présents */}
                <button 
                  className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-10 mx-auto'} text-gray-600 dark:text-gray-300`}
                  onClick={handleSettingsClick}
                  title="Paramètres"
                >
                  <Settings size={18} />
                  {showNavbar && <span className="ml-3 text-sm font-medium">Paramètres</span>}
                </button>
                
                <button 
                  className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-10 mx-auto'} text-gray-600 dark:text-gray-300`}
                  onClick={handleHelpClick}
                  title="Aide"
                >
                  <HelpCircle size={18} />
                  {showNavbar && <span className="ml-3 text-sm font-medium">Aide</span>}
                </button>
                
                <button 
                  className={`nav-button ${showNavbar ? 'w-full pl-4' : 'w-10 mx-auto'} text-gray-600 dark:text-gray-300 mt-auto mb-6`}
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  {showNavbar && <span className="ml-3 text-sm font-medium">Mode {theme === 'dark' ? 'clair' : 'sombre'}</span>}
                </button>
              </div>
            </div>
          )}
          
          {/* Mobile navbar */}
          {isMobile && (
            <div className="mobile-navbar">
              <button 
                className={`mobile-navbar-button transition-all ${
                  isDeveloperMode
                    ? "bg-gradient-to-br from-amber-500 to-red-600"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600"
                }`}
                onClick={toggleDeveloperMode}
                title={isDeveloperMode ? "Passer en mode utilisateur" : "Passer en mode développeur"}
              >
                {isDeveloperMode ? (
                  <Code className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </button>
              
              <button 
                className="mobile-navbar-button bg-gradient-primary text-white"
                onClick={handleNewChat}
                title="Nouvelle conversation"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
              
              {isDeveloperMode && (
                <>
                  <button 
                    className="mobile-navbar-button bg-gradient-secondary text-white"
                    onClick={handleTerminalClick}
                    title="Terminal"
                  >
                    <Terminal className="h-5 w-5" />
                  </button>
                  
                  <button 
                    className="mobile-navbar-button bg-gradient-secondary text-white"
                    onClick={handleDatabaseClick}
                    title="Base de données"
                  >
                    <Database className="h-5 w-5" />
                  </button>
                </>
              )}
              
              <button 
                className="mobile-navbar-button bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                onClick={handleSettingsClick}
                title="Paramètres"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button 
                className="mobile-navbar-button bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                onClick={toggleTheme}
                title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          )}

          <main className={`w-full ${isMobile ? 'pb-32 min-h-screen' : 'h-screen'}`}>
            <ChatInterface className={isMobile ? 'pb-16' : 'ml-8'} />
          </main>
          
          {/* Boîtes de dialogue */}
          {/* Dialogue des paramètres */}
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogContent className="sm:max-w-md glassmorphism">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Paramètres</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-6">
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
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Thème sombre</h3>
                    <p className="text-sm text-muted-foreground">Changer l'apparence de l'application</p>
                  </div>
                  <Switch 
                    checked={theme === "dark"} 
                    onCheckedChange={() => toggleTheme()} 
                    className="data-[state=checked]:bg-indigo-600"
                  />
                </div>
                
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
          
          {/* Dialogue d'aide */}
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
        </>
      )}
    </div>
  );
}

export default App;
