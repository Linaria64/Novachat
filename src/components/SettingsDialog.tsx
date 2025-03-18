import React, { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { OllamaSettings, defaultSettings, getSettings, saveSettings, getApiUrl, getBaseUrl } from "@/services/ollamaService";

interface SettingsDialogProps {
  onSettingsChange: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ onSettingsChange }) => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<OllamaSettings>(() => getSettings());
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleSave = () => {
    try {
      // Validate URL format
      new URL(settings.apiUrl.startsWith('/') ? `http://localhost${settings.apiUrl}` : settings.apiUrl);
      
      // Save settings
      saveSettings(settings);
      
      // Notify parent component
      onSettingsChange();
      
      // Close dialog
      setOpen(false);
      
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Invalid API URL format");
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info("Settings reset to default values");
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    
    try {
      // Get the processed URL that will be used for the actual API call
      const testUrl = `${getBaseUrl(settings.apiUrl)}/tags`;
      
      // Test connection using the same function that the app will use
      const response = await fetch(testUrl, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        toast.success("Connection successful!");
      } else {
        toast.error(`Connection failed: ${response.statusText}`);
      }
    } catch (error) {
      toast.error(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ollama API Settings</DialogTitle>
          <DialogDescription>
            Configure the connection to your Ollama API server.
            {import.meta.env.DEV && (
              <div className="mt-1 text-xs opacity-80">
                Tip: Use <code>/ollama-api/api</code> for local development to avoid CORS issues.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiUrl" className="text-right">
              API URL
            </Label>
            <Input
              id="apiUrl"
              value={settings.apiUrl}
              onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
              placeholder="http://localhost:11434/api"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeout" className="text-right">
              Timeout (ms)
            </Label>
            <Input
              id="timeout"
              type="number"
              value={settings.timeout}
              onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) || defaultSettings.timeout })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={testConnection} 
                disabled={isTestingConnection}
                className="w-full"
              >
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog; 