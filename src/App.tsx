import ChatInterface from "./components/ChatInterface";
import TailwindTest from "./components/TailwindTest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function App() {
  return (
    <div className="flex flex-col h-svh">
      <Tabs defaultValue="chat" className="flex flex-col h-full">
        <TabsList className="mx-auto mb-2 mt-2">
          <TabsTrigger value="chat">Chatopia</TabsTrigger>
          <TabsTrigger value="test">Test Tailwind</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col">
          <ChatInterface className="flex-1" />
        </TabsContent>
        
        <TabsContent value="test" className="flex-1 overflow-auto">
          <TailwindTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
