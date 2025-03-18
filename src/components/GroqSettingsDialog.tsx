import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Settings } from "@/types/chat";
import { getSettings, saveSettings } from "@/services/localService";

interface GroqSettingsDialogProps {
  onSettingsChange: () => void;
}

const GroqSettingsDialog: React.FC<GroqSettingsDialogProps> = ({ onSettingsChange }): JSX.Element => {
  const [settings, setSettings] = React.useState<Settings>(getSettings());
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSave = (): void => {
    saveSettings(settings);
    onSettingsChange();
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSettings({ ...settings, apiKey: e.target.value });
  };

  const handleTemperatureChange = (value: number[]): void => {
    setSettings({ ...settings, temperature: value[0] });
  };

  const handleMaxTokensChange = (value: number[]): void => {
    setSettings({ ...settings, maxTokens: value[0] });
  };

  const handleStreamingChange = (checked: boolean): void => {
    setSettings({ ...settings, streamingEnabled: checked });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="api-key">API Key</Label>
        <Input
          id="api-key"
          type="password"
          value={settings.apiKey}
          onChange={handleInputChange}
          className="w-[200px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature</Label>
        <Slider
          id="temperature"
          min={0}
          max={2}
          step={0.1}
          value={[settings.temperature]}
          onValueChange={handleTemperatureChange}
        />
        <div className="text-sm text-muted-foreground">
          {settings.temperature.toFixed(1)}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-tokens">Max Tokens</Label>
        <Slider
          id="max-tokens"
          min={100}
          max={4000}
          step={100}
          value={[settings.maxTokens]}
          onValueChange={handleMaxTokensChange}
        />
        <div className="text-sm text-muted-foreground">
          {settings.maxTokens}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="streaming">Streaming</Label>
        <Switch
          id="streaming"
          checked={settings.streamingEnabled}
          onCheckedChange={handleStreamingChange}
        />
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Settings
      </Button>
    </div>
  );
};

export default GroqSettingsDialog; 