const TypingIndicator = () => {
  return (
    <div className="flex justify-start pr-10 sm:pr-20 mb-3">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-md shadow-sm px-4 py-2 flex items-center">
        <div className="flex space-x-1 py-1">
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-400 opacity-75 typing-dot"></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-400 opacity-75 typing-dot"></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-400 opacity-75 typing-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
