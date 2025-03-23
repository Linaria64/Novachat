import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ComponentProps, useState, memo, useMemo, useCallback, useEffect } from 'react';
import { motion } from "framer-motion";
import { Bot, User, ClipboardCopy, Check, ExternalLink, Info } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import rehypeRaw from "rehype-raw";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatMessageProps {
  message: Message;
  isGenerating?: boolean;
  isLastMessage?: boolean;
  showTimestamp?: boolean;
}

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const MAX_VISIBLE_LENGTH = 8000;
const LIMIT_WARNING_THRESHOLD = 7000;

export const ChatMessage = memo(({ message, isGenerating, isLastMessage, showTimestamp = false }: ChatMessageProps) => {
  const [showCopied, setShowCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  
  // Détecter si le message est trop long et pourrait causer des problèmes de performance
  const isMessageLong = message.content.length > MAX_VISIBLE_LENGTH;
  const isApproachingLimit = message.content.length > LIMIT_WARNING_THRESHOLD && !isMessageLong;
  const displayContent = isExpanded ? message.content : message.content.slice(0, MAX_VISIBLE_LENGTH);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, []);

  const markdownComponents = useMemo(() => ({
    pre(props: ComponentProps<'pre'>) {
      const { children, ...rest } = props;
      const codeContent = children?.toString() || '';
      
      return (
        <div className="relative group my-3 sm:my-4">
          <pre className="bg-gray-900/60 rounded-lg p-2 sm:p-4 overflow-x-auto border border-gray-700/30 text-xs sm:text-sm" {...rest}>
            {children}
          </pre>
          <button
            className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white p-1 sm:p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleCopyCode(codeContent)}
            aria-label="Copier le code"
          >
            {showCopied ? (
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
            ) : (
              <ClipboardCopy className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </button>
        </div>
      );
    },
    code(props: ComponentProps<'code'>) {
      const { children, ...rest } = props;
      return (
        <code className="bg-gray-800/70 px-1 sm:px-1.5 py-0.5 rounded font-mono text-purple-300 text-[10px] sm:text-xs" {...rest}>
          {children}
        </code>
      );
    },
    p(props: ComponentProps<'p'>) {
      const { children, ...rest } = props;
      return (
        <p className="text-xs sm:text-sm leading-relaxed my-1.5 sm:my-2" {...rest}>
          {children}
        </p>
      );
    },
    img(props: ComponentProps<'img'>) {
      const { src, alt, ...rest } = props;
      return (
        <div className="relative my-3 sm:my-4 overflow-hidden rounded-lg shadow-md">
          <img 
            src={src} 
            alt={alt} 
            className="rounded-lg border border-gray-700/50 max-w-full w-full transition-all duration-300 hover:brightness-110" 
            loading="lazy"
            {...rest} 
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            <a href={src as string} target="_blank" rel="noopener noreferrer" className="text-white text-[10px] sm:text-xs bg-black/60 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-0.5 sm:gap-1">
              <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Voir l'image</span>
            </a>
          </div>
        </div>
      );
    },
    a(props: ComponentProps<'a'>) {
      const { href, children, ...rest } = props;
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-400 hover:text-blue-300 hover:underline transition-colors flex items-center gap-0.5 sm:gap-1 inline-flex" 
          {...rest}
        >
          <span>{children}</span>
          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </a>
      );
    },
    table(props: ComponentProps<'table'>) {
      return (
        <div className="overflow-x-auto my-3 sm:my-4 rounded-lg border border-gray-700/50 bg-gray-900/40">
          <table className="min-w-full text-[10px] sm:text-xs" {...props} />
        </div>
      );
    },
    th: (props: ComponentProps<'th'>) => <th className="bg-gray-800/70 px-2 sm:px-4 py-1 sm:py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wider" {...props} />,
    td: (props: ComponentProps<'td'>) => <td className="border-t border-gray-800/40 px-2 sm:px-4 py-1 sm:py-2" {...props} />,
    ul: (props: ComponentProps<'ul'>) => <ul className="list-disc pl-4 sm:pl-5 my-1.5 sm:my-2 text-xs sm:text-sm space-y-0.5 sm:space-y-1" {...props} />,
    ol: (props: ComponentProps<'ol'>) => <ol className="list-decimal pl-4 sm:pl-5 my-1.5 sm:my-2 text-xs sm:text-sm space-y-0.5 sm:space-y-1" {...props} />,
    li: (props: ComponentProps<'li'>) => <li className="my-0.5 sm:my-1" {...props} />,
    h1: (props: ComponentProps<'h1'>) => <h1 className="text-base sm:text-xl font-bold my-2 sm:my-3 text-white" {...props} />,
    h2: (props: ComponentProps<'h2'>) => <h2 className="text-sm sm:text-lg font-bold my-2 sm:my-3 text-white" {...props} />,
    h3: (props: ComponentProps<'h3'>) => <h3 className="text-xs sm:text-md font-bold my-1.5 sm:my-2 text-white" {...props} />,
    h4: (props: ComponentProps<'h4'>) => <h4 className="text-xs sm:text-sm font-bold my-1.5 sm:my-2 text-white" {...props} />,
    blockquote: (props: ComponentProps<'blockquote'>) => <blockquote className="border-l-2 sm:border-l-4 border-gray-600 pl-2 sm:pl-4 my-2 sm:my-3 italic text-gray-300 text-xs sm:text-sm" {...props} />
  }), [handleCopyCode, showCopied]);

  const formattedTime = useMemo(() => {
    return message.timestamp.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }, [message.timestamp]);

  const messageClassName = useMemo(() => cn(
    "relative px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-sm",
    "max-w-[88%] xs:max-w-[85%] sm:max-w-[80%] md:max-w-[75%]",
    isUser 
      ? "bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/20 text-white" 
      : "bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 text-gray-100"
  ), [isUser]);

  const senderBadgeClass = useMemo(() => cn(
    "inline-flex items-center text-[10px] sm:text-xs mb-1 px-1.5 sm:px-2 py-0.5 rounded-full font-medium",
    isUser 
      ? "bg-blue-500/20 text-blue-300" 
      : "bg-indigo-500/20 text-indigo-300"
  ), [isUser]);

  // Effectuer le rendu du message avec un léger délai pour éviter les blocages d'interface
  useEffect(() => {
    if (!isRendered) {
      const timer = setTimeout(() => {
        setIsRendered(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isRendered]);
  
  // Gérer le clic pour afficher le message complet
  const handleExpandClick = () => {
    setIsExpanded(true);
  };

  return (
    <motion.div
      className={cn(
        "flex w-full mb-4 sm:mb-6 items-start",
        isUser ? "justify-end" : "justify-start",
        isLastMessage && isAssistant && !message.content && "animate-pulse"
      )}
      initial="hidden"
      animate="visible"
      variants={messageVariants}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 mr-2 sm:mr-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
        </div>
      )}

      {/* Message content */}
      <div className={messageClassName}>
        {/* Message sender badge */}
        <div className={senderBadgeClass}>
          {isUser ? (
            <>
              <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span>Vous</span>
            </>
          ) : (
            <>
              <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span>Assistant</span>
            </>
          )}
        </div>

        {/* Message content */}
        <div className="mt-1 sm:mt-1.5">
          {isAssistant && !message.content && isGenerating ? (
            <div className="flex items-center justify-start h-6 text-gray-400">
              <TypingIndicator />
            </div>
          ) : message.content ? (
            <>
              <div className="flex items-center mb-1 sm:mb-1.5">
                <span className="text-sm sm:text-base font-medium">
                  {isUser ? "Vous" : "Assistant"}
                </span>
                
                {showTimestamp && message.timestamp && (
                  <span className="ml-2 text-xs text-gray-400">
                    {formattedTime}
                  </span>
                )}
                
                {/* Afficher le modèle si disponible */}
                {isAssistant && message.model && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-2 px-1.5 py-0.5 rounded-md bg-gray-800 text-xs text-gray-400 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          <span>{message.model}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Modèle utilisé pour cette réponse</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              <div className="prose prose-invert prose-pre:my-2 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-md prose-pre:text-xs max-w-none">
                {isRendered ? (
                  <div className="chat-message-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={markdownComponents}
                    >
                      {displayContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700/40 rounded mb-2 w-4/5"></div>
                    <div className="h-4 bg-gray-700/40 rounded mb-2 w-3/5"></div>
                    <div className="h-4 bg-gray-700/40 rounded w-2/4"></div>
                  </div>
                )}
              </div>
              
              {/* Bouton pour afficher le message complet si trop long */}
              {isMessageLong && !isExpanded && (
                <button 
                  onClick={handleExpandClick}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Afficher le message complet
                </button>
              )}
              
              {isApproachingLimit && (
                <div className="text-yellow-500 text-xs mt-1">
                  Ce message est assez long. L'affichage pourrait être ralenti.
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 italic">
              Message vide
            </div>
          )}
        </div>
        
        {/* Message timestamp */}
        <div className="text-[8px] sm:text-[10px] text-gray-400 mt-1.5 sm:mt-2 text-right">
          {formattedTime}
        </div>
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="flex-shrink-0 ml-2 sm:ml-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  );
});
