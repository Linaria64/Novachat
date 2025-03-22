import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      const maxHeight = window.innerWidth < 768 ? 150 : 200; // Responsive max height
      const newHeight = Math.min(target.scrollHeight, maxHeight);
      target.style.height = `${newHeight}px`;
    };

    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-[60px] w-full rounded-xl bg-background/70 px-4 py-3 text-base",
          "placeholder:text-muted-foreground/70",
          // Enhanced focus styles
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background/90",
          // Animation and transition
          "resize-none transition-all duration-200 ease-out",
          // Shadow effects
          "shadow-inner hover:shadow-inner-lg",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Custom scrollbar
          "scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent",
          // Additional classes
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
