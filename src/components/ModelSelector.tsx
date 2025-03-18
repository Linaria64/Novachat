import React, { useState } from "react";
import { Check, ChevronsUpDown, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Model {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  externalLink?: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string | null;
  setSelectedModel: (value: string) => void;
  disabled?: boolean;
  isLoadingModels: boolean;
}

export default function ModelSelector({
  models,
  selectedModel,
  setSelectedModel,
  disabled = false,
  isLoadingModels,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  // Find the currently selected model object
  const currentModel = models.find((model) => model.id === selectedModel);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoadingModels}
          className={cn(
            "w-full justify-between overflow-hidden text-xs sm:text-sm",
            !selectedModel && "text-muted-foreground"
          )}
        >
          {isLoadingModels ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading models...</span>
            </div>
          ) : (
            <>
              {currentModel ? (
                <div className="flex items-center gap-2 truncate">
                  {/* Model name badge with appropriate styling */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-semibold truncate max-w-[120px] sm:max-w-[180px]",
                      currentModel.provider === "openai" && "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900",
                      currentModel.provider === "anthropic" && "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900",
                      currentModel.provider === "local" && "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900",
                    )}
                  >
                    {currentModel.name}
                  </Badge>
                  {/* Context window badge if available */}
                  {currentModel.contextWindow && (
                    <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                      {currentModel.contextWindow}K
                    </Badge>
                  )}
                </div>
              ) : (
                "Select model..."
              )}
            </>
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[280px] sm:w-[350px]">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandEmpty>No models found.</CommandEmpty>
          <CommandList>
            <ScrollArea className="h-[300px]">
              {Object.entries(
                models.reduce<Record<string, Model[]>>((acc, model) => {
                  if (!acc[model.provider]) {
                    acc[model.provider] = [];
                  }
                  acc[model.provider].push(model);
                  return acc;
                }, {})
              ).map(([provider, providerModels]) => (
                <React.Fragment key={provider}>
                  <CommandGroup heading={provider.toUpperCase()}>
                    {providerModels.map((model) => (
                      <CommandItem
                        key={model.id}
                        value={model.id}
                        onSelect={() => {
                          setSelectedModel(model.id);
                          setOpen(false);
                        }}
                        className="flex justify-between text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                              "h-3 w-3",
                              selectedModel === model.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {model.name}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {model.contextWindow && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">
                              {model.contextWindow}K
                            </Badge>
                          )}
                          {model.externalLink && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(model.externalLink, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <Separator className="my-1" />
                </React.Fragment>
              ))}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
