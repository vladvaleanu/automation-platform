
interface LoadingStateProps {
    /** Display variant */
    variant?: 'spinner' | 'skeleton';
    /** Text to display below spinner (only for spinner variant) */
    text?: string;
    /** Number of skeleton lines (only for skeleton variant) */
    lines?: number;
    /** Additional class for the wrapper */
    className?: string;
}

export function LoadingState({
    variant = 'spinner',
    text,
    lines = 3,
    className = '',
}: LoadingStateProps) {
    if (variant === 'skeleton') {
        return (
            <div className={`animate-pulse space-y-3 ${className}`}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div
                            className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                            style={{ width: `${Math.random() * 40 + 60}%` }}
                        />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            {text && (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {text}
                </p>
            )}
        </div>
    );
}
