import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="chatopia-theme">
    <Toaster position="top-center" />
    <App />
  </ThemeProvider>
);
