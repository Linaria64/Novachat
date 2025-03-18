# Chatopia - Local LLM Chat Interface

Chatopia is a modern web interface for interacting with locally hosted Large Language Models (LLMs) through Ollama.

## Features

- 🚀 **Modern UI/UX**: Clean, responsive interface with dark mode support
- 🔄 **Real-time streaming**: See responses as they're generated
- 💾 **Local storage**: Conversations are saved locally in your browser
- 🎨 **Code highlighting**: Proper formatting for code blocks
- 🌐 **Configurable API**: Connect to any Ollama API endpoint
- 🔌 **Connection management**: Automatic reconnection and status monitoring
- 📱 **Responsive design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

1. Install [Ollama](https://ollama.ai/download) on your machine
2. Pull a model using Ollama (e.g., `ollama pull llama2`)

### Running the Application

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```
npm run build
```

The built files will be in the `dist` directory and can be served by any static file server.

## Connecting to Ollama

By default, Chatopia connects to Ollama at `http://localhost:11434/api`. If you're running Ollama on a different machine or port, you can configure the connection in the settings:

1. Click the ⚙️ (Settings) icon in the top right corner
2. Enter the API URL of your Ollama instance
3. Click "Test Connection" to verify
4. Save your changes

## Usage

1. Select a model from the dropdown menu
2. Type your message in the input field
3. Press Enter or click Send
4. View the AI's response
5. Continue the conversation

## Keyboard Shortcuts

- `Ctrl+Enter` or `Cmd+Enter`: Send message
- `Esc`: Close dialogs

## Troubleshooting

- **Can't connect to Ollama**: Make sure Ollama is running and accessible at the configured URL
- **No models available**: Make sure you've pulled at least one model using Ollama
- **Slow responses**: Large models may take longer to respond, especially on less powerful hardware

## License

MIT
