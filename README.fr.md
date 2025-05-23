# Novachat v1 🤖

<div align="center">
  <a href="README.md">
    <img src="https://img.shields.io/badge/English-🇬🇧-blue?style=for-the-badge" alt="English" />
  </a>
  <a href="README.fr.md">
    <img src="https://img.shields.io/badge/Français-🇫🇷-blue?style=for-the-badge" alt="Français" />
  </a>
</div>

<div align="center">
  <h3>✨ <a href="https://novachat-puce.vercel.app" target="_blank">Novachat.ai Clique ici !</a> ✨</h3>
  <a href="https://novachat-puce.vercel.app" target="_blank">
  </a>
</div>

## 🚀 Introduction

**Novachat** est une interface élégante et performante pour converser avec des modèles de langage avancés. La version 1.0 est maintenant disponible, offrant une expérience utilisateur fluide et intuitive.

Cette application vous permet de dialoguer avec des modèles d'IA de pointe, directement depuis votre navigateur web, avec une interface responsive optimisée pour mobile et desktop.

<div align="center">
  <h3>Essayez Ollama pour des modèles locaux</h3>
  <a href="https://ollama.com" target="_blank">
    <img src="https://img.shields.io/badge/Télécharger-Ollama-5A67D8?style=for-the-badge&logo=docker&logoColor=white" alt="Télécharger Ollama" />
  </a>
</div>

## ✨ Caractéristiques

- **Interface Responsive**: Adaptée automatiquement aux écrans de bureau et mobiles
- **Thème Sombre**: Optimisé pour une utilisation confortable de jour comme de nuit
- **Mode Développeur**: Fonctionnalités avancées pour les utilisateurs techniques ( uniquement sur pc )
- **Raccourcis Clavier**: Navigation rapide et efficace avec des raccourcis
- **Confidentialité des Données** : Tourne en local sur votre machine grâce a Ollama 

## 🔌 Connexion API

### Groq API (Par défaut)

Novachat se connecte automatiquement à **Groq API** dès le démarrage, offrant accès à des modèles puissants :

- **Llama 3 (70B)** - Modèle principal pour les conversations générales
- **Qwen QWQ (32B)** - Modèle de raisonnement pour les questions complexes

L'application bascule intelligemment entre ces deux modèles selon la nature de vos questions.

### Ollama (Mode développeur)

Pour les utilisateurs souhaitant exécuter des modèles localement, Novachat prend en charge **Ollama**.

1. [Téléchargez et installez Ollama](https://ollama.com)
2. Lancez Ollama sur votre machine
3. Activez le mode développeur dans Novachat
4. Sélectionnez Ollama comme service

## 🔍 Modes d'utilisation

### Mode Conversation standard

Idéal pour les discussions générales, questions-réponses, et assistance sur divers sujets.

### Mode Raisonnement

Optimisé pour les questions complexes nécessitant une analyse approfondie et un raisonnement étape par étape.

## 💻 Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/novachat.git

# Naviguer dans le répertoire
cd novachat

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build
```

## 📱 Interface Mobile

Sur mobile, Novachat offre une expérience optimisée :

- Thème sombre forcé pour un meilleur confort visuel
- Interface simplifiée sans barre de navigation
- Bouton "Nouvelle conversation" intégré directement dans la zone de saisie


## 📝 Licence

Ce projet est sous licence MIT.

---

<div align="center">
  <p>Construit avec ❤️ en utilisant React, TypeScript et Tailwind CSS</p>
  <p>© 2025 Novachat</p>
</div> 
