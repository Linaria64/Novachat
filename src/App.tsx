import { useState, useEffect, useCallback } from "react";
import { Bot, MessageSquare, Settings, Moon, Sun, HelpCircle, Terminal, Database, FileCode, Code, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ChatInterface from "./components/ChatInterface";
import LoadingScreen from "./components/LoadingScreen";
import { checkConnection as checkGroqConnection } from "@/services/groqService";
import "./App.css";

function App() {
  // Définition de tous les états au début du composant
  const [showNavbar, setShowNavbar] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectedToGroq, setIsConnectedToGroq] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
  // Définir les fonctions et callbacks
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleDeveloperMode = () => {
    setIsDeveloperMode(!isDeveloperMode);
  };

  const handleNewChat = () => {
    // Créer une nouvelle conversation
    const event = new CustomEvent('novachat:new-conversation');
    window.dispatchEvent(event);
  };

  const handleSettingsClick = () => {
    setShowSettingsDialog(true);
  };

  const handleHelpClick = () => {
    setShowHelpDialog(true);
  };

  // Fonctions simulées pour les outils de développeur
  const handleTerminalClick = () => {
    alert('Terminal (fonctionnalité à venir)');
  };

  const handleDatabaseClick = () => {
    alert('Gestionnaire de base de données (fonctionnalité à venir)');
  };

  const handleCodeEditorClick = () => {
    alert('Éditeur de code (fonctionnalité à venir)');
  };
  
  // Vérifier la connexion à l'API Groq
  const checkConnectionStatus = useCallback(async () => {
    try {
      setIsCheckingConnection(true);
      const connected = await checkGroqConnection();
      setIsConnectedToGroq(connected);
      
      // Si connecté, désactiver l'écran de chargement
      if (connected) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      setIsConnectedToGroq(false);
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);
  
  // Détecter si l'appareil est mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Vérifier au chargement
    checkIfMobile();
    
    // Ajouter un écouteur de redimensionnement
    window.addEventListener('resize', checkIfMobile);
    
    // Nettoyer l'écouteur
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Vérifier la connexion au chargement et périodiquement
  useEffect(() => {
    // Vérifier la connexion immédiatement
    checkConnectionStatus();
    
    // Configurer une vérification périodique
    const interval = setInterval(checkConnectionStatus, 30000);
    
    return () => clearInterval(interval);
  }, [checkConnectionStatus]);
  
  // Gérer le thème
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Charger le mode développeur depuis le localStorage
  useEffect(() => {
    const savedDevMode = localStorage.getItem('novachat-dev-mode');
    if (savedDevMode) {
      setIsDeveloperMode(savedDevMode === 'true');
    }
  }, []);

  // Sauvegarder le mode développeur dans le localStorage
  useEffect(() => {
    localStorage.setItem('novachat-dev-mode', isDeveloperMode.toString());
  }, [isDeveloperMode]);

  // Marquer visuellement que l'application est chargée
  useEffect(() => {
    // Ajouter une classe au body pendant le chargement
    if (isLoading || !isConnectedToGroq) {
      document.body.classList.add('loading-active');
    } else {
      document.body.classList.remove('loading-active');
      // Émission d'un événement pour indiquer que le chargement est terminé
      const event = new CustomEvent('novachat:loading-complete');
      window.dispatchEvent(event);
    }
  }, [isLoading, isConnectedToGroq]);

  // Si l'écran de chargement est actif
  if (isLoading || !isConnectedToGroq) {
    return <LoadingScreen 
      onLoadingComplete={() => {
        if (isConnectedToGroq) {
          setIsLoading(false);
          // Émettre un événement pour indiquer que le chargement est terminé
          const event = new CustomEvent('novachat:loading-complete');
          window.dispatchEvent(event);
          // Ajouter une classe au body pour permettre une détection facile de l'état
          document.body.classList.remove('loading-active');
        }
      }} 
      isConnectedToGroq={isConnectedToGroq} 
      isCheckingConnection={isCheckingConnection} 
    />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Desktop Navbar - visible uniquement sur desktop */}
      {!isMobile && (
        <>
          {/* Navbar latérale semi-visible avec effet de glassmorphism */}
          <div 
            className={`fixed left-0 top-0 h-full w-24 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-white/20 dark:border-gray-800/30 z-30 transition-all duration-300 ease-in-out shadow-md ${
              showNavbar ? 'translate-x-0 w-64' : 'translate-x-[-50%]'
            }`}
            onMouseEnter={() => setShowNavbar(true)}
            onMouseLeave={() => setShowNavbar(false)}
          >
            {/* Logo en haut de la barre latérale */}
            <div className="w-full flex justify-center items-center py-4 mb-6">
              <div className={`flex items-center justify-center transition-all duration-300 ${showNavbar ? 'ml-0' : 'ml-12'}`}>
                <Bot size={32} className="text-primary" />
                {showNavbar && <span className="ml-2 font-bold text-lg">NovaChat</span>}
              </div>
            </div>

            {/* Conteneur des boutons avec espacement uniforme */}
            <div className="flex flex-col items-center gap-6 mt-8">
              {/* Bouton de nouvelle conversation (présent dans les deux modes) */}
              <button 
                className={`h-12 rounded-l-full rounded-r-full ${showNavbar ? 'w-48 pl-4 pr-6' : 'w-12 rounded-r-full'} bg-gradient-to-r from-blue-100/80 to-blue-200/50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-start text-blue-600 dark:text-blue-400 hover:bg-blue-200/70 dark:hover:bg-blue-800/50 transition-all shadow-md ${showNavbar ? 'ml-8' : 'ml-12'}`}
                onClick={handleNewChat}
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
              >
                <MessageSquare size={20} className="flex-shrink-0" />
                {showNavbar && <span className="ml-3 whitespace-nowrap overflow-hidden">Nouvelle conversation</span>}
              </button>
              
              {/* Boutons spécifiques au mode développeur */}
              {isDeveloperMode && (
                <>
                  <button 
                    className={`h-12 rounded-l-full rounded-r-full ${showNavbar ? 'w-48 pl-4 pr-6' : 'w-12 rounded-r-full'} bg-gradient-to-r from-amber-100/80 to-amber-200/50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-start text-amber-600 dark:text-amber-400 hover:bg-amber-200/70 dark:hover:bg-amber-800/50 transition-all shadow-md ${showNavbar ? 'ml-8' : 'ml-12'}`}
                    onClick={handleTerminalClick}
                    title="Terminal"
                    aria-label="Terminal"
                  >
                    <Terminal size={20} className="flex-shrink-0" />
                    {showNavbar && <span className="ml-3 whitespace-nowrap overflow-hidden">Terminal</span>}
                  </button>
                  
                  <button 
                    className={`h-12 rounded-l-full rounded-r-full ${showNavbar ? 'w-48 pl-4 pr-6' : 'w-12 rounded-r-full'} bg-gradient-to-r from-green-100/80 to-green-200/50 dark:from-green-900/30 dark:to-green-800/20 flex items-center justify-start text-green-600 dark:text-green-400 hover:bg-green-200/70 dark:hover:bg-green-800/50 transition-all shadow-md ${showNavbar ? 'ml-8' : 'ml-12'}`}
                    onClick={handleDatabaseClick}
                    title="Base de données"
                    aria-label="Base de données"
                  >
                    <Database size={20} className="flex-shrink-0" />
                    {showNavbar && <span className="ml-3 whitespace-nowrap overflow-hidden">Base de données</span>}
                  </button>
                  
                  <button 
                    className={`h-12 rounded-l-full rounded-r-full ${showNavbar ? 'w-48 pl-4 pr-6' : 'w-12 rounded-r-full'} bg-gradient-to-r from-purple-100/80 to-purple-200/50 dark:from-purple-900/30 dark:to-purple-800/20 flex items-center justify-start text-purple-600 dark:text-purple-400 hover:bg-purple-200/70 dark:hover:bg-purple-800/50 transition-all shadow-md ${showNavbar ? 'ml-8' : 'ml-12'}`}
                    onClick={handleCodeEditorClick}
                    title="Éditeur de code"
                    aria-label="Éditeur de code"
                  >
                    <FileCode size={20} className="flex-shrink-0" />
                    {showNavbar && <span className="ml-3 whitespace-nowrap overflow-hidden">Éditeur de code</span>}
                  </button>
                </>
              )}
              
              {/* Boutons toujours présents */}
              <button 
                className={`h-12 rounded-l-full rounded-r-full ${showNavbar ? 'w-48 pl-4 pr-6' : 'w-12 rounded-r-full'} bg-gradient-to-r from-gray-100/80 to-gray-200/50 dark:from-gray-800/30 dark:to-gray-700/20 flex items-center justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-all shadow-md ${showNavbar ? 'ml-8' : 'ml-12'}`}
                onClick={handleSettingsClick}
                title="Paramètres"
                aria-label="Paramètres"
              >
                <Settings size={20} className="flex-shrink-0" />
                {showNavbar && <span className="ml-3 whitespace-nowrap overflow-hidden">Paramètres</span>}
              </button>
              
              <button 
                className={`h-12 rounded-l-full rounded-r-full ${showNavbar ? 'w-48 pl-4 pr-6' : 'w-12 rounded-r-full'} bg-gradient-to-r from-blue-100/80 to-blue-200/50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-start text-blue-600 dark:text-blue-400 hover:bg-blue-200/70 dark:hover:bg-blue-800/50 transition-all shadow-md ${showNavbar ? 'ml-8' : 'ml-12'}`}
                onClick={handleHelpClick}
                title="Aide"
                aria-label="Aide"
              >
                <HelpCircle size={20} className="flex-shrink-0" />
                {showNavbar && <span className="ml-3 whitespace-nowrap overflow-hidden">Aide</span>}
              </button>
              
              <button 
                className={`h-12 rounded-l-full rounded-r-full ${showNavbar ? 'w-48 pl-4 pr-6' : 'w-12 rounded-r-full'} bg-gradient-to-r from-gray-100/80 to-gray-200/50 dark:from-gray-800/30 dark:to-gray-700/20 flex items-center justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-all shadow-md ${showNavbar ? 'ml-8' : 'ml-12'}`}
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={20} className="flex-shrink-0" />
                    {showNavbar && <span className="ml-3 whitespace-nowrap overflow-hidden">Mode clair</span>}
                  </>
                ) : (
                  <>
                    <Moon size={20} className="flex-shrink-0" />
                    {showNavbar && <span className="ml-3 whitespace-nowrap overflow-hidden">Mode sombre</span>}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <main className={`w-full ${isMobile ? 'pb-20' : 'h-screen'}`}>
        <ChatInterface />
      </main>
      
      {/* Barre de navigation mobile en bas */}
      {isMobile && (
        <div className="mobile-navbar mobile-navbar-enter">
          {/* Icon pour toggle le mode (utilisateur/développeur) */}
          <button
            className={`mobile-navbar-button transition-all ${
              isDeveloperMode 
                ? "bg-gradient-to-br from-amber-500 to-red-600" 
                : "bg-gradient-to-br from-blue-500 to-purple-600"
            }`}
            onClick={toggleDeveloperMode}
            aria-label={isDeveloperMode ? "Passer en mode utilisateur" : "Passer en mode développeur"}
          >
            {isDeveloperMode ? (
              <Code className="w-5 h-5 text-white" />
            ) : (
              <Bot className="w-5 h-5 text-white" />
            )}
          </button>
          
          {/* Nouvelle conversation */}
          <button
            className="mobile-navbar-button bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
            onClick={handleNewChat}
            aria-label="Nouvelle conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Boutons conditionnels pour le mode développeur */}
          {isDeveloperMode && (
            <>
              <button
                className="mobile-navbar-button bg-amber-100/80 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                onClick={handleTerminalClick}
                aria-label="Terminal"
              >
                <Terminal className="w-5 h-5" />
              </button>
              
              <button
                className="mobile-navbar-button bg-green-100/80 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                onClick={handleDatabaseClick}
                aria-label="Base de données"
              >
                <Database className="w-5 h-5" />
              </button>
              
              <button
                className="mobile-navbar-button bg-purple-100/80 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                onClick={handleCodeEditorClick}
                aria-label="Éditeur de code"
              >
                <FileCode className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* Paramètres */}
          <button
            className="mobile-navbar-button bg-gray-100/80 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400"
            onClick={handleSettingsClick}
            aria-label="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Aide */}
          <button
            className="mobile-navbar-button bg-gray-100/80 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400"
            onClick={handleHelpClick}
            aria-label="Aide"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          {/* Thème */}
          <button
            className="mobile-navbar-button bg-amber-100/80 dark:bg-indigo-900/40 text-amber-600 dark:text-indigo-400"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      )}
      
      {/* Étiquette de version en bas à droite */}
      <div className={`fixed ${isMobile ? 'bottom-20' : 'bottom-2'} right-2 text-xs text-muted-foreground/60 pointer-events-none select-none z-10`}>
        NovaChat v alpha 0.01
      </div>
      
      {/* Dialogs */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Paramètres</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <p className="text-muted-foreground text-sm">
              Configurez ici les paramètres de votre application NovaChat.
            </p>
            
            <div className="space-y-4">
              {/* Mode thème */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Mode sombre</span>
                  <p className="text-muted-foreground text-xs mt-1">Basculer entre le mode clair et sombre</p>
                </div>
                <button 
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
              
              {/* Mode développeur */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Mode développeur</span>
                  <p className="text-muted-foreground text-xs mt-1">
                    Activer les fonctionnalités avancées pour les développeurs
                  </p>
                </div>
                <Switch 
                  checked={isDeveloperMode} 
                  onCheckedChange={toggleDeveloperMode} 
                  aria-label="Mode développeur"
                />
              </div>
              
              {/* Autres options de paramètres */}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Aide</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm mb-4">
              Bienvenue sur NovaChat ! Voici quelques conseils pour utiliser l'application :
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>Entrez votre message dans la zone de texte en bas de l'écran</li>
              <li>Appuyez sur Entrée ou cliquez sur l'icône d'envoi pour envoyer votre message</li>
              <li>Pour effacer la conversation, utilisez l'icône de corbeille</li>
              <li>Pour changer entre le mode clair et sombre, utilisez l'icône de lune/soleil</li>
              {isDeveloperMode && (
                <>
                  <li className="mt-4 text-amber-600 dark:text-amber-400 font-medium">Fonctionnalités du mode développeur :</li>
                  <li>Terminal : Accès à un terminal intégré pour exécuter des commandes</li>
                  <li>Base de données : Visualiser et gérer les données de l'application</li>
                  <li>Éditeur de code : Modifier le code source de l'application</li>
                </>
              )}
            </ul>
            
            {!isDeveloperMode && (
              <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
                <p>Conseil : <span className="text-blue-600 dark:text-blue-400">Activez le mode développeur</span> dans les paramètres pour accéder à des fonctionnalités avancées.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
