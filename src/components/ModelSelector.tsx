import React from "react";
import { CloudCog } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { GroqModel } from "@/types/chat";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  models: GroqModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  isLoading?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  isLoading
}) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 h-9 px-2 rounded-md border">
              <CloudCog className="h-4 w-4" />
              <span className="text-sm">Groq</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Using Groq API</p>
          </TooltipContent>
        </Tooltip>

        <Select
          value={selectedModel}
          onValueChange={onModelChange}
          disabled={isLoading || models.length === 0}
        >
          <SelectTrigger
            className={cn(
              "w-[180px] h-9",
              isLoading && "animate-pulse"
            )}
          >
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Models</SelectLabel>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </TooltipProvider>
  );
};

export default ModelSelector;
