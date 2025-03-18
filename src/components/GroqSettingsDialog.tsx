import React, { useState, useEffect } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings as SettingsType, getSettings, saveSettings, checkConnection } from "@/services/localService";

interface GroqSettingsDialogProps {
  onSettingsChange: () => void;
}

const GroqSettingsDialog: React.FC<GroqSettingsDialogProps> = ({ onSettingsChange }) => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsType>(getSettings());
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, [open]);

  const handleSave = async () => {
    try {
      saveSettings(settings);
      onSettingsChange();
      setOpen(false);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleReset = () => {
    const defaultSettings = getSettings();
    setSettings(defaultSettings);
    toast.info("Settings reset to default values");
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const isConnected = await checkConnection();
      if (isConnected) {
        toast.success("Connection successful!");
      } else {
        toast.error("Connection failed");
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      toast.error("Connection test failed");
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AI assistant settings
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temperature" className="text-right">
              Temperature
            </Label>
            <div className="col-span-3 flex items-center gap-4">
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[settings.temperature]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, temperature: value }))}
                className="flex-1"
              />
              <span className="w-12 text-sm">{settings.temperature}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxTokens" className="text-right">
              Max Tokens
            </Label>
            <div className="col-span-3 flex items-center gap-4">
              <Slider
                id="maxTokens"
                min={100}
                max={4000}
                step={100}
                value={[settings.maxTokens]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, maxTokens: value }))}
                className="flex-1"
              />
              <span className="w-12 text-sm">{settings.maxTokens}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="streaming" className="text-right">
              Streaming
            </Label>
            <div className="col-span-3 flex items-center gap-4">
              <Switch
                id="streaming"
                checked={settings.streamingEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, streamingEnabled: checked }))}
              />
              <span className="text-sm">Enable streaming responses</span>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? "Testing..." : "Test Connection"}
            </Button>
          </div>
          <Button type="submit" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroqSettingsDialog; 