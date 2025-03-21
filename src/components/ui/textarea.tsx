import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    // Gestion auto-resize
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      const newHeight = Math.min(target.scrollHeight, 200); // Limite à 200px max
      target.style.height = `${newHeight}px`;
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          // Nouveaux styles pour améliorer l'apparence dans l'interface de chat
          "resize-none transition-all duration-200 ease-in-out",
          // Focus styles améliorés
          "focus:border-primary/20 focus:bg-background/5 focus:shadow-inner",
          className
        )}
        ref={ref}
        onInput={handleInput}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
