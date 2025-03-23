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
  <h3>✨ <a href="https://novachat-puce.vercel.app" target="_blank">Novachat.ai Click here</a> ✨</h3>
  <a href="https://novachat-puce.vercel.app" target="_blank">
  </a>
</div>

## 🚀 Introduction

**Novachat** is an elegant and powerful interface for conversing with advanced language models. Version 1.0 is now available, offering a smooth and intuitive user experience.

This application allows you to interact with cutting-edge AI models directly from your web browser, with a responsive interface optimized for both mobile and desktop.

<div align="center">
  <h3>Try Ollama for local models</h3>
  <a href="https://ollama.com" target="_blank">
    <img src="https://img.shields.io/badge/Download-Ollama-5A67D8?style=for-the-badge&logo=docker&logoColor=white" alt="Download Ollama" />
  </a>
</div>

## ✨ Features

- **Responsive Interface**: Automatically adapts to desktop and mobile screens
- **Dark Theme**: Optimized for comfortable use day and night
- **Developer Mode**: Advanced features for technical users
- **Data Confidentiality**: Runs locally on your machine thanks to Ollama, ensuring that your data remains confidential.
- **Keyboard Shortcuts**: Quick and efficient navigation with shortcuts

## 🔌 API Connection

### Groq API (Default)

Novachat automatically connects to **Groq API** at startup, providing access to powerful models:

- **Llama 3 (70B)** - Main model for general conversations
- **Qwen QWQ (32B)** - Reasoning model for complex questions

The application intelligently switches between these two models depending on the nature of your questions.

### Ollama (Developer Mode)

For users wanting to run models locally, Novachat supports **Ollama**.

1. [Download and install Ollama](https://ollama.com)
2. Run Ollama on your machine
3. Activate developer mode in Novachat
4. Select Ollama as the service

## 🔍 Usage Modes

### Standard Conversation Mode

Ideal for general discussions, question answering, and assistance on various topics.

### Reasoning Mode

Optimized for complex questions requiring in-depth analysis and step-by-step reasoning.

## 💻 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/novachat.git

# Navigate to the directory
cd novachat

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```



## 📱 Mobile Interface

On mobile, Novachat offers an optimized experience:

- Forced dark theme for better visual comfort
- Simplified interface without navigation bar
- "New conversation" button integrated directly into the input area


## 📝 License

This project is licensed under the MIT License.

---

<div align="center">
  <p>Built with ❤️ using React, TypeScript and Tailwind CSS</p>
  <p>© 2025 Novachat</p>
</div>
