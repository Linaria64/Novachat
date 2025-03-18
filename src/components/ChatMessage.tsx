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
      }`}
    >
      <div
        className={`${
          isUser
            ? "bg-primary text-white rounded-t-xl rounded-bl-xl"
            : isSystem
              ? "bg-yellow-100 dark:bg-yellow-900/30 text-foreground rounded-t-xl rounded-br-xl shadow-md"
              : "bg-white dark:bg-gray-800 text-foreground rounded-t-xl rounded-br-xl shadow-md"
        } p-3 sm:p-4 max-w-[85%] sm:max-w-[75%]`}
      >
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={paragraph.trim() === "" ? "h-4" : "mb-2 text-sm sm:text-base"}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default ChatMessage;
