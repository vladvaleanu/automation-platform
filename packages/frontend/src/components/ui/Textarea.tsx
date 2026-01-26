import { TextareaHTMLAttributes, forwardRef } from 'react';

export type TextareaSize = 'sm' | 'md' | 'lg';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Size variant (affects padding and font size) */
    textareaSize?: TextareaSize;
    /** Show error styling */
    error?: boolean;
    /** Show character count */
    showCount?: boolean;
    /** Maximum character count (only shown if showCount is true) */
    maxCount?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
    className = '',
    textareaSize = 'md',
    error = false,
    showCount = false,
    maxCount,
    disabled,
    value,
    ...props
}, ref) => {
    const baseStyles = `
        w-full border rounded-lg transition-colors resize-y
        bg-white dark:bg-gray-700
        text-gray-900 dark:text-white
        placeholder-gray-500 dark:placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-offset-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-600
    `;

    const sizes = {
        sm: 'px-2.5 py-1.5 text-xs min-h-[60px]',
        md: 'px-3 py-2 text-sm min-h-[80px]',
        lg: 'px-4 py-3 text-base min-h-[120px]',
    };

    const borderColors = error
        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';

    const currentLength = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxCount && currentLength > maxCount;

    return (
        <div className="relative">
            <textarea
                ref={ref}
                disabled={disabled}
                value={value}
                className={`
                    ${baseStyles}
                    ${sizes[textareaSize]}
                    ${borderColors}
                    ${className}
                `.trim()}
                aria-invalid={error ? true : undefined}
                {...props}
            />
            {showCount && (
                <div className={`absolute bottom-2 right-2 text-xs ${isOverLimit
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-gray-400 dark:text-gray-500'
                    }`}>
                    {currentLength}{maxCount ? `/${maxCount}` : ''}
                </div>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';
