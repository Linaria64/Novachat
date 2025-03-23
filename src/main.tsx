import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from '@/components/ThemeProvider'

// Fonction pour signaler que l'application est prête
const signalAppReady = () => {
  document.body.classList.remove("loading-active");
  window.dispatchEvent(new CustomEvent("novachat:loading-complete"));
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="chatopia-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)

// Forcer la suppression de l'écran de chargement après un délai
setTimeout(signalAppReady, 1500);
