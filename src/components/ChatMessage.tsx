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
      className={`flex ${
        isUser ? "justify-end pl-10 sm:pl-20" : "justify-start pr-10 sm:pr-20"
      } mb-3`}
    >
      <div
        className={`${
          isUser
            ? "bg-blue-500 text-white rounded-2xl rounded-br-md"
            : isSystem
              ? "bg-gray-300 dark:bg-gray-700 text-foreground rounded-2xl rounded-bl-md"
              : "bg-gray-200 dark:bg-gray-700 text-foreground rounded-2xl rounded-bl-md"
        } px-4 py-2 max-w-[85%] sm:max-w-[75%] shadow-sm`}
      >
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={paragraph.trim() === "" ? "h-4" : "mb-1 text-sm sm:text-base"}
          >
            {paragraph}
          </p>
        ))}
        {isUser && (
          <span className="text-xs text-blue-100 block text-right mt-1">
            {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {!isUser && (
          <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
            {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
