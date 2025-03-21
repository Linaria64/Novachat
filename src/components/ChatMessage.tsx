import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from "@/lib/utils"

const ChatMessage = ({
  role,
  content,
}: {
  role: "user" | "assistant" | "system";
  content: string;
}) => {
  // Split the content by newlines to preserve formatting
  const paragraphs = content.split("\n");

  const isUser = role === "user";
  const isSystem = role === "system";
  
  return (
    <div
      className={cn(
        "flex mb-4",
        isUser ? "justify-end pl-10 sm:pl-20" : "justify-start pr-10 sm:pr-20"
      )}
    >
      <div
        className={cn(
          "px-4 py-3 max-w-[85%] sm:max-w-[75%] shadow-sm",
          isUser
            ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl rounded-br-sm"
            : isSystem
              ? "bg-gray-300 dark:bg-gray-700 text-foreground rounded-2xl rounded-bl-sm"
              : "bg-gray-100 dark:bg-gray-800 text-foreground rounded-2xl rounded-bl-sm",
          !isUser && "prose prose-sm dark:prose-invert max-w-none"
        )}
      >
        {isUser ? (
          paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={paragraph.trim() === "" ? "h-4" : "mb-1 text-sm sm:text-base"}
            >
              {paragraph}
            </p>
          ))
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ node, className, children, ...props }) {
                  return (
                    <pre className="bg-gray-800 text-gray-100 rounded-md p-4 overflow-x-auto my-2 text-sm border border-gray-700" {...props}>
                      {children}
                    </pre>
                  );
                },
                code({ node, className, children, ...props }) {
                  return (
                    <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
                img({ node, src, alt, ...props }) {
                  return (
                    <a href={src} target="_blank" rel="noopener noreferrer" className="block">
                      <img 
                        src={src} 
                        alt={alt || "Image"} 
                        className="rounded-md shadow-md max-w-full my-2 border border-gray-200 dark:border-gray-700" 
                        {...props} 
                      />
                    </a>
                  );
                },
                a({ node, children, href, ...props }) {
                  return (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 dark:text-blue-400 hover:underline" 
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                table({ node, children, ...props }) {
                  return (
                    <div className="overflow-x-auto my-4 rounded-md border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props}>
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ node, children, ...props }) {
                  return (
                    <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-left text-xs font-medium uppercase tracking-wider" {...props}>
                      {children}
                    </th>
                  );
                },
                td({ node, children, ...props }) {
                  return (
                    <td className="px-4 py-2 whitespace-nowrap text-sm" {...props}>
                      {children}
                    </td>
                  );
                }
              }}
            >
              {content}
            </Markdown>
          </div>
        )}
        <div className="flex justify-end mt-1">
          <span className={cn(
            "text-xs",
            isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          )}>
            {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
