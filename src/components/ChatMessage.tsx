import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ComponentProps } from 'react';

interface ChatMessageProps {
  message: Message;
}

type MarkdownPreProps = ComponentProps<'pre'>;
type MarkdownCodeProps = ComponentProps<'code'>;
type MarkdownParagraphProps = ComponentProps<'p'>;

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex w-full max-w-3xl mx-auto py-2",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl transition-all shadow-md",
          message.role === "user"
            ? "bg-gray-900 text-white rounded-br-none shadow-[0_0_8px_rgba(59,130,246,0.5)] border border-blue-500/30"
            : "bg-gray-900 text-gray-100 rounded-bl-none shadow-[0_0_8px_rgba(124,58,237,0.3)] border border-purple-500/20"
        )}
      >
        <div className="prose prose-invert max-w-none">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre(props: MarkdownPreProps) {
                const { children, ...rest } = props;
                return (
                  <pre className="bg-black rounded-lg p-3 overflow-x-auto my-2 border border-gray-800" {...rest}>
                    {children}
                  </pre>
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
              }
            }}
          >
            {message.content}
          </Markdown>
        </div>
        <div className="text-xs mt-2 opacity-70">
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
