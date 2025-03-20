import { useState, useEffect, useCallback } from "react";
import { Bot, MessageSquare, Settings, Moon, Sun, HelpCircle, Terminal, Database, FileCode, Code, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ChatInterface from "./components/ChatInterface";
import LoadingScreen from "./components/LoadingScreen";
import { checkConnection as checkGroqConnection } from "@/services/groqService";
import "./App.css";

function App() {
  const [showFullNavbar, setShowFullNavbar] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectedToGroq, setIsConnectedToGroq] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
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
    
    // Sur mobile, fermer automatiquement la navbar après clic
    if (isMobile) {
      setShowFullNavbar(false);
    }
  };

  const handleSettingsClick = () => {
    setShowSettingsDialog(true);
    
    // Sur mobile, fermer automatiquement la navbar après clic
    if (isMobile) {
      setShowFullNavbar(false);
    }
  };

  const handleHelpClick = () => {
    setShowHelpDialog(true);
    
    // Sur mobile, fermer automatiquement la navbar après clic
    if (isMobile) {
      setShowFullNavbar(false);
    }
  };

  // Fonctions simulées pour les outils de développeur
  const handleTerminalClick = () => {
    alert('Terminal (fonctionnalité à venir)');
    
    if (isMobile) {
      setShowFullNavbar(false);
    }
  };

  const handleDatabaseClick = () => {
    alert('Gestionnaire de base de données (fonctionnalité à venir)');
    
    if (isMobile) {
      setShowFullNavbar(false);
    }
  };

  const handleCodeEditorClick = () => {
    alert('Éditeur de code (fonctionnalité à venir)');
    
    if (isMobile) {
      setShowFullNavbar(false);
    }
  };

  // Si l'écran de chargement est actif
  if (isLoading || !isConnectedToGroq) {
    return <LoadingScreen onLoadingComplete={() => null} isConnectedToGroq={isConnectedToGroq} isCheckingConnection={isCheckingConnection} />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Zone de détection pour afficher la navbar complètement */}
      <div 
        className="absolute left-0 top-0 h-full md:w-16 w-10 z-20"
        onMouseEnter={() => setShowFullNavbar(true)}
        onClick={() => setShowFullNavbar(true)}
      />
      
      {/* Navbar semi-visible (50%) */}
      <div className="fixed left-0 top-0 h-full w-10 md:w-12 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md border-r border-white/20 dark:border-gray-800/30 z-30">
        <div className="flex flex-col items-center h-full py-8">
          {/* Logo et indicateur de mode semi-visible */}
          <div 
            className={`w-8 h-8 md:w-10 md:h-10 rounded-l-full transition-all duration-300 flex items-center justify-start pl-1.5 ${
              isDeveloperMode 
                ? "bg-gradient-to-r from-amber-500 to-transparent" 
                : "bg-gradient-to-r from-blue-500 to-transparent"
            }`}
            onClick={toggleDeveloperMode}
            title={isDeveloperMode ? "Passer en mode utilisateur" : "Passer en mode développeur"}
          >
            {isDeveloperMode ? (
              <Code className="w-4 h-4 md:w-5 md:h-5 text-white" />
            ) : (
              <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
            )}
          </div>
          
          {/* Navigation items partiellement visibles */}
          <div className="flex flex-col items-start gap-5 md:gap-6 mt-6 md:mt-8 pl-1.5">
            {/* Bouton de nouvelle conversation semi-visible */}
            <button 
              className="w-8 h-8 md:w-9 md:h-9 rounded-l-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-start pl-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-200/70 dark:hover:bg-blue-800/50 transition-colors"
              onClick={handleNewChat}
              title="Nouvelle conversation"
              aria-label="Nouvelle conversation"
            >
              <MessageSquare size={isMobile ? 16 : 18} />
            </button>
            
            {/* Boutons spécifiques au mode développeur semi-visibles */}
            {isDeveloperMode && (
              <>
                <button 
                  className="w-8 h-8 md:w-9 md:h-9 rounded-l-full bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-start pl-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-200/70 dark:hover:bg-amber-800/50 transition-colors"
                  onClick={handleTerminalClick}
                  title="Terminal"
                  aria-label="Terminal"
                >
                  <Terminal size={isMobile ? 16 : 18} />
                </button>
                
                <button 
                  className="w-8 h-8 md:w-9 md:h-9 rounded-l-full bg-green-100/50 dark:bg-green-900/30 flex items-center justify-start pl-1.5 text-green-600 dark:text-green-400 hover:bg-green-200/70 dark:hover:bg-green-800/50 transition-colors"
                  onClick={handleDatabaseClick}
                  title="Base de données"
                  aria-label="Base de données"
                >
                  <Database size={isMobile ? 16 : 18} />
                </button>
                
                <button 
                  className="w-8 h-8 md:w-9 md:h-9 rounded-l-full bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-start pl-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-200/70 dark:hover:bg-purple-800/50 transition-colors"
                  onClick={handleCodeEditorClick}
                  title="Éditeur de code"
                  aria-label="Éditeur de code"
                >
                  <FileCode size={isMobile ? 16 : 18} />
                </button>
              </>
            )}
            
            {/* Boutons toujours présents semi-visibles */}
            <button 
              className="w-8 h-8 md:w-9 md:h-9 rounded-l-full bg-gray-100/50 dark:bg-gray-800/30 flex items-center justify-start pl-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
              onClick={handleSettingsClick}
              title="Paramètres"
              aria-label="Paramètres"
            >
              <Settings size={isMobile ? 16 : 18} />
            </button>
            
            <button 
              className="w-8 h-8 md:w-9 md:h-9 rounded-l-full bg-gray-100/50 dark:bg-gray-800/30 flex items-center justify-start pl-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
              onClick={handleHelpClick}
              title="Aide"
              aria-label="Aide"
            >
              <HelpCircle size={isMobile ? 16 : 18} />
            </button>
          </div>
          
          {/* Theme toggle at bottom semi-visible */}
          <button 
            className="w-8 h-8 md:w-9 md:h-9 rounded-l-full bg-amber-100/50 dark:bg-indigo-900/30 flex items-center justify-start pl-1.5 text-amber-600 dark:text-indigo-400 hover:bg-amber-200/70 dark:hover:bg-indigo-800/50 transition-colors mt-auto"
            onClick={toggleTheme}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun size={isMobile ? 16 : 18} /> : <Moon size={isMobile ? 16 : 18} />}
          </button>
          
          {/* Indicateur de déploiement complet */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <ChevronRight size={16} className="text-primary/70 animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Navbar latérale complète (déployable) */}
      <div 
        className={`fixed left-0 top-0 h-full md:w-20 w-16 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md border-r border-white/20 dark:border-gray-800/30 z-40 transition-transform duration-300 ease-in-out ${
          showFullNavbar ? 'translate-x-0' : 'translate-x-[calc(-100%+10px)] md:translate-x-[calc(-100%+12px)]'
        }`}
        onMouseLeave={() => !isMobile && setShowFullNavbar(false)}
      >
        <div className="flex flex-col items-center h-full py-8">
          <div className="flex flex-col items-center gap-8">
            {/* Logo et indicateur de mode */}
            <div 
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full transition-all duration-300 flex items-center justify-center ${
                isDeveloperMode 
                  ? "bg-gradient-to-br from-amber-500 to-red-600" 
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
              }`}
              onClick={toggleDeveloperMode}
              title={isDeveloperMode ? "Passer en mode utilisateur" : "Passer en mode développeur"}
            >
              {isDeveloperMode ? (
                <Code className="w-5 h-5 md:w-6 md:h-6 text-white" />
              ) : (
                <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
              )}
            </div>
            
            {/* Navigation items */}
            <div className="flex flex-col items-center gap-5 md:gap-6 mt-6 md:mt-8">
              {/* Bouton de nouvelle conversation (présent dans les deux modes) */}
              <button 
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200/70 dark:hover:bg-blue-800/50 transition-colors"
                onClick={handleNewChat}
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
              >
                <MessageSquare size={isMobile ? 18 : 20} />
              </button>
              
              {/* Boutons spécifiques au mode développeur */}
              {isDeveloperMode && (
                <>
                  <button 
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-200/70 dark:hover:bg-amber-800/50 transition-colors"
                    onClick={handleTerminalClick}
                    title="Terminal"
                    aria-label="Terminal"
                  >
                    <Terminal size={isMobile ? 18 : 20} />
                  </button>
                  
                  <button 
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-green-100/50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-200/70 dark:hover:bg-green-800/50 transition-colors"
                    onClick={handleDatabaseClick}
                    title="Base de données"
                    aria-label="Base de données"
                  >
                    <Database size={isMobile ? 18 : 20} />
                  </button>
                  
                  <button 
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-200/70 dark:hover:bg-purple-800/50 transition-colors"
                    onClick={handleCodeEditorClick}
                    title="Éditeur de code"
                    aria-label="Éditeur de code"
                  >
                    <FileCode size={isMobile ? 18 : 20} />
                  </button>
                </>
              )}
              
              {/* Boutons toujours présents */}
              <button 
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100/50 dark:bg-gray-800/30 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
                onClick={handleSettingsClick}
                title="Paramètres"
                aria-label="Paramètres"
              >
                <Settings size={isMobile ? 18 : 20} />
              </button>
              
              <button 
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100/50 dark:bg-gray-800/30 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
                onClick={handleHelpClick}
                title="Aide"
                aria-label="Aide"
              >
                <HelpCircle size={isMobile ? 18 : 20} />
              </button>
            </div>
          </div>
          
          {/* Theme toggle at bottom */}
          <button 
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-amber-100/50 dark:bg-indigo-900/30 flex items-center justify-center text-amber-600 dark:text-indigo-400 hover:bg-amber-200/70 dark:hover:bg-indigo-800/50 transition-colors mt-auto"
            onClick={toggleTheme}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun size={isMobile ? 18 : 20} /> : <Moon size={isMobile ? 18 : 20} />}
          </button>
        </div>
      </div>
      
      {/* Masque de fermeture pour mobile */}
      {isMobile && showFullNavbar && (
        <div
          className="fixed inset-0 bg-transparent z-20"
          onClick={() => setShowFullNavbar(false)}
          aria-hidden="true"
        />
      )}

      <main className="w-full h-screen pl-10 md:pl-12">
        <ChatInterface />
      </main>
      
      {/* Étiquette de version en bas à droite */}
      <div className="fixed bottom-2 right-2 text-xs text-muted-foreground/60 pointer-events-none select-none z-10">
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
              <li>Pour changer entre le mode clair et sombre, utilisez l'icône de lune/soleil dans la barre latérale</li>
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
