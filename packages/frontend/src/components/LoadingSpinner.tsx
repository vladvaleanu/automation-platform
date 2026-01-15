/**
 * Loading Spinner Component
 * Reusable loading indicator with various sizes and styles
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
    xl: 'h-16 w-16 border-4',
  };

  const spinnerElement = (
    <>
      <div
        className={`inline-block animate-spin rounded-full border-b-blue-600 dark:border-b-blue-400 border-gray-300 dark:border-gray-600 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-50">
        <div className="text-center">
          {spinnerElement}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        {spinnerElement}
      </div>
    </div>
  );
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block animate-spin rounded-full h-4 w-4 border-2 border-b-white border-white/30 ${className}`} />
  );
}

/**
 * Loading overlay for content areas
 */
export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-white/75 dark:bg-gray-900/75 flex items-center justify-center backdrop-blur-sm z-10">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-b-blue-600 dark:border-b-blue-400 border-gray-300 dark:border-gray-600" />
        {text && (
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">{text}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({
  lines = 3,
  className = ''
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}
