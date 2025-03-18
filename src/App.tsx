import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import GroqChatInterface from "@/components/GroqChatInterface";

function App() {
  return (
    <ThemeProvider>
      <Toaster />
      <GroqChatInterface />
    </ThemeProvider>
  );
}

export default App;
