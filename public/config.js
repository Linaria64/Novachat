/**
 * Configuration globale de l'application Chatopia
 * Ce fichier peut être modifié sans avoir à recompiler l'application
 */
window.CHATOPIA_CONFIG = {
  // URLs des API
  api: {
    groq: "https://api.groq.com/openai/v1/chat/completions",
    ollama: "http://localhost:11434/api/chat"
  },
  
  // Modèles disponibles
  models: {
    groq: [
      { id: "llama3-70b-8192", name: "Llama 3 (70B)" },
      { id: "llama3-8b-8192", name: "Llama 3 (8B)" },
      { id: "mixtral-8x7b-32768", name: "Mixtral (8x7B)" },
      { id: "gemma-7b-it", name: "Gemma (7B)" }
    ],
    ollama: [
      { id: "llama3", name: "Llama 3" },
      { id: "phi3", name: "Phi 3" },
      { id: "mixtral", name: "Mixtral" }
    ]
  },
  
  // Paramètres par défaut
  defaults: {
    model: "llama3-70b-8192",
    temperature: 0.7,
    maxTokens: 4000
  },
  
  // Options de l'interface
  ui: {
    darkMode: true,
    loadingDuration: 300,
    codeHighlighting: true,
    menuAnimation: true
  },
  
  // Version de l'application
  version: "1.0.0"
}; 