import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ComponentProps, useState, useEffect } from 'react';

interface ChatMessageProps {
  message: Message;
}

type MarkdownPreProps = ComponentProps<'pre'>;
type MarkdownCodeProps = ComponentProps<'code'>;
type MarkdownParagraphProps = ComponentProps<'p'>;
type MarkdownImageProps = ComponentProps<'img'>;

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Function to handle copy code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  useEffect(() => {
    // Add animation delay for staggered appearance
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "flex w-full max-w-3xl mx-auto py-2 transition-all",
        message.role === "user" ? "justify-end" : "justify-start",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        "transition-all duration-500"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl transition-all shadow-md group",
          message.role === "user"
            ? "bg-gray-900 text-white rounded-br-none shadow-[0_0_8px_rgba(59,130,246,0.5)] border border-blue-500/30 hover:shadow-[0_0_12px_rgba(59,130,246,0.6)]"
            : "bg-gray-900 text-gray-100 rounded-bl-none shadow-[0_0_8px_rgba(124,58,237,0.3)] border border-purple-500/20 hover:shadow-[0_0_12px_rgba(124,58,237,0.4)]"
        )}
      >
        <div className="prose prose-invert max-w-none">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre(props: MarkdownPreProps) {
                const { children, ...rest } = props;
                const codeContent = children?.toString() || '';
                
                return (
                  <div className="relative group/code">
                    <pre className="bg-black rounded-lg p-3 overflow-x-auto my-2 border border-gray-800" {...rest}>
                      {children}
                    </pre>
                    <button
                      className="absolute top-2 right-2 bg-gray-800 text-gray-300 hover:text-white p-1 rounded opacity-0 group-hover/code:opacity-100 transition-opacity"
                      onClick={() => handleCopyCode(codeContent)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                    {showCopied && (
                      <div className="absolute top-2 right-8 bg-gray-700 text-white text-xs px-2 py-1 rounded animate-fade-in">
                        Copié!
                      </div>
                    )}
                  </div>
                );
              },
              code(props: MarkdownCodeProps) {
                const { children, ...rest } = props;
                return (
                  <code className="bg-black px-1.5 py-0.5 rounded text-sm border border-gray-800" {...rest}>
                    {children}
                  </code>
                );
              },
              p(props: MarkdownParagraphProps) {
                const { children, ...rest } = props;
                return (
                  <p className="text-sm leading-relaxed mb-2 last:mb-0" {...rest}>
                    {children}
                  </p>
                );
              },
              img(props: MarkdownImageProps) {
                const { src, alt, ...rest } = props;
                return (
                  <div className="relative my-4 group/img">
                    <img 
                      src={src} 
                      alt={alt} 
                      className="rounded-lg border border-gray-700 max-w-full transition-all duration-300 hover:scale-[1.02]" 
                      {...rest} 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <a href={src as string} target="_blank" rel="noopener noreferrer" className="text-white text-sm">
                        Ouvrir l'image
                      </a>
                    </div>
                  </div>
                );
              }
            }}
          >
            {message.content}
          </Markdown>
        </div>
        <div className="text-xs mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
          {message.timestamp.toLocaleTimeString(undefined, { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })}
        </div>
      </div>
    </div>
  );
};
