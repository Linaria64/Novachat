import ChatInterface from "./components/ChatInterface";
import { useState } from "react";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full h-screen">
        <ChatInterface />
      </main>
    </div>
  );
}

export default App;
