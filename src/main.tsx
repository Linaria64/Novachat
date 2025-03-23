import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from '@/components/ThemeProvider'

// Configuration du gestionnaire d'erreurs global
const errorHandler = (event: ErrorEvent) => {
  console.error('Global error caught:', event.error);
  // Empêcher l'affichage des erreurs dans la console du navigateur en production
  if (import.meta.env.PROD) {
    event.preventDefault();
  }
};

// Ajouter le gestionnaire d'erreurs
window.addEventListener('error', errorHandler);

// Fonction pour signaler que l'application est prête
const signalAppReady = () => {
  document.body.classList.remove("loading-active");
  window.dispatchEvent(new CustomEvent("novachat:loading-complete"));
};

// Rendu de l'application avec gestion propre des erreurs
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="chatopia-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)

// Forcer la suppression de l'écran de chargement immédiatement 
// pour éviter de bloquer l'interface utilisateur
setTimeout(signalAppReady, 300);

// Nettoyer les ressources lors du déchargement de la page
window.addEventListener('unload', () => {
  window.removeEventListener('error', errorHandler);
});
