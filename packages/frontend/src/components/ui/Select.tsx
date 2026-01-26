import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

export type SelectSize = 'sm' | 'md' | 'lg';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    /** Size variant */
    selectSize?: SelectSize;
    /** Show error styling */
    error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    className = '',
    selectSize = 'md',
    error = false,
    disabled,
    children,
    ...props
}, ref) => {
    const baseStyles = `
        w-full border rounded-lg transition-colors appearance-none
        bg-white dark:bg-gray-700
        text-gray-900 dark:text-white
        focus:outline-none focus:ring-2 focus:ring-offset-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-600
        pr-10
    `;

    const sizes = {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
    };

    const borderColors = error
        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';

    return (
        <div className="relative">
            <select
                ref={ref}
                disabled={disabled}
                className={`
                    ${baseStyles}
                    ${sizes[selectSize]}
                    ${borderColors}
                    ${className}
                `.trim()}
                aria-invalid={error ? true : undefined}
                {...props}
            >
                {children}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            </div>
        </div>
    );
});

Select.displayName = 'Select';
