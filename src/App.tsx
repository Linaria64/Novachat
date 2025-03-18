import { useState } from "react";
import ChatInterface from "./components/ChatInterface";
import { Bot, MessageSquare, Settings, Moon, Sun, HelpCircle } from "lucide-react";
import { useTheme } from "./components/theme-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog";

function App() {
  const [showNavbar, setShowNavbar] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const { setTheme, theme } = useTheme();

  const handleNewChat = () => {
    // Créer une nouvelle conversation
    const event = new CustomEvent('novachat:new-conversation');
    window.dispatchEvent(event);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleChatButtonClick = () => {
    handleNewChat();
  };

  const handleSettingsClick = () => {
    setShowSettingsDialog(true);
  };

  const handleHelpClick = () => {
    setShowHelpDialog(true);
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
              <button 
                className="w-10 h-10 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200/70 dark:hover:bg-blue-800/50 transition-colors"
                onClick={handleChatButtonClick}
                title="Nouvelle conversation"
              >
                <MessageSquare size={20} />
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-gray-100/50 dark:bg-gray-800/30 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
                onClick={handleSettingsClick}
                title="Paramètres"
              >
                <Settings size={20} />
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-gray-100/50 dark:bg-gray-800/30 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
                onClick={handleHelpClick}
                title="Aide"
              >
                <HelpCircle size={20} />
              </button>
            </div>
          </div>
          
          {/* Theme toggle at bottom */}
          <button 
            className="w-10 h-10 rounded-full bg-amber-100/50 dark:bg-indigo-900/30 flex items-center justify-center text-amber-600 dark:text-indigo-400 hover:bg-amber-200/70 dark:hover:bg-indigo-800/50 transition-colors mt-auto"
            onClick={toggleTheme}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <main className="w-full h-screen">
        <ChatInterface />
      </main>

      {/* Dialogs */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              Configurez ici les paramètres de votre application NovaChat.
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span>Mode sombre</span>
                <button 
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
              {/* Autres options de paramètres pourraient être ajoutées ici */}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent>
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
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
