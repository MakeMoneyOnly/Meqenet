'use client';

export function OfflineActions() {
  return (
    <div className="space-y-3">
      <button
        onClick={() => window.location.reload()}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
      >
        Try Again
      </button>

      <button
        onClick={() => window.history.back()}
        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
      >
        Go Back
      </button>
    </div>
  );
}
