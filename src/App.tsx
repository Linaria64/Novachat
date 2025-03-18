import { useState, useEffect } from "react";
import { Bot, MessageSquare, Settings, Moon, Sun, HelpCircle, Terminal, Database, FileCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ChatInterface from "./components/ChatInterface";
import LoadingScreen from "./components/LoadingScreen";
import "./App.css";

function App() {
  const [showNavbar, setShowNavbar] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Fonction pour gérer la fin du chargement
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <div className="flex flex-col h-screen relative bg-background text-foreground">
      {/* Navbar */}
      <div className="bg-primary/10 backdrop-blur-sm py-2 px-4 sm:px-6 border-b border-border shadow-sm">
        <div className="flex items-center justify-between">
          {/* Logo et Menu */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowNavbar(!showNavbar)}
              className="flex items-center space-x-2 font-bold text-lg"
            >
              <Bot className="w-6 h-6" />
              <span className="hidden sm:inline">NovaChat</span>
            </button>
            
            {/* Indicateur de mode */}
            {isDeveloperMode && (
              <span className="hidden sm:flex text-xs py-0.5 px-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-full">
                Mode développeur
              </span>
            )}
          </div>
          
          {/* Boutons de droite */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Boutons du mode développeur */}
            {isDeveloperMode && (
              <>
                <button 
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                  title="Terminal"
                >
                  <Terminal className="w-5 h-5" />
                </button>
                <button 
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                  title="Base de données"
                >
                  <Database className="w-5 h-5" />
                </button>
                <button 
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                  title="Éditeur de code"
                >
                  <FileCode className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Boutons communs aux deux modes */}
            <button 
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              title="Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setShowHelpDialog(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              title="Aide"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <button 
              onClick={toggleTheme}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            <button 
              onClick={() => setShowSettingsDialog(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              title="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
      
      {/* Boîte de dialogue des paramètres */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Mode développeur</h4>
                <p className="text-sm text-muted-foreground">
                  Activer les fonctionnalités avancées
                </p>
              </div>
              <Switch 
                checked={isDeveloperMode} 
                onCheckedChange={toggleDeveloperMode} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Mode sombre</h4>
                <p className="text-sm text-muted-foreground">
                  Basculer entre les thèmes clair et sombre
                </p>
              </div>
              <Switch 
                checked={theme === "dark"} 
                onCheckedChange={toggleTheme} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Boîte de dialogue d'aide */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <h4 className="font-medium">Bienvenue sur NovaChat</h4>
            <p className="text-sm">
              NovaChat est un assistant IA personnel qui utilise des modèles de langage avancés pour vous aider.
            </p>
            
            <h4 className="font-medium mt-4">Comment utiliser</h4>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Posez simplement vos questions dans la zone de texte</li>
              <li>Utilisez le bouton + pour démarrer une nouvelle conversation</li>
              <li>Basculez entre le mode normal et le mode développeur depuis les paramètres</li>
            </ul>
            
            <h4 className="font-medium mt-4">Mode développeur</h4>
            <p className="text-sm">
              Le mode développeur débloque des fonctionnalités avancées comme l'accès au terminal, à la base de données et à l'éditeur de code.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
