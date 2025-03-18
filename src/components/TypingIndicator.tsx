import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  inline?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ inline = false }) => {
  return (
    <div
      className={cn(
        "flex items-center",
        inline ? "inline-flex ml-1" : "my-4 mx-auto"
      )}
    >
      <div className="flex space-x-1.5">
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      {!inline && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>}
    </div>
  );
};

export default TypingIndicator;
