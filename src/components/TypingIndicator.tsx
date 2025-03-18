const TypingIndicator = () => {
  return (
    <div className="flex justify-start pr-10 sm:pr-20">
      <div className="bg-white dark:bg-gray-800 rounded-t-xl rounded-br-xl shadow-md p-3 sm:p-4 flex items-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 opacity-75 typing-dot"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500 opacity-75 typing-dot"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500 opacity-75 typing-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
