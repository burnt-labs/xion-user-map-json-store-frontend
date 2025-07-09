"use client";

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

export default function LoadingModal({ isOpen, message = "Connecting to wallet..." }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          
          {/* Message */}
          <p className="text-gray-700 dark:text-gray-300 text-center font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}