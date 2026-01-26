import React, { InputHTMLAttributes, forwardRef } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Size variant */
    inputSize?: InputSize;
    /** Show error styling */
    error?: boolean;
    /** Icon to display on the left side */
    leftIcon?: React.ReactNode;
    /** Icon to display on the right side */
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    className = '',
    inputSize = 'md',
    error = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
}, ref) => {
    const baseStyles = `
        w-full border rounded-lg transition-colors
        bg-white dark:bg-gray-700
        text-gray-900 dark:text-white
        placeholder-gray-500 dark:placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-offset-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-600
    `;

    const sizes = {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
    };

    const borderColors = error
        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';

    const paddingWithIcons = leftIcon ? 'pl-10' : '';
    const paddingWithRightIcon = rightIcon ? 'pr-10' : '';

    return (
        <div className="relative">
            {leftIcon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    {leftIcon}
                </div>
            )}
            <input
                ref={ref}
                disabled={disabled}
                className={`
                    ${baseStyles}
                    ${sizes[inputSize]}
                    ${borderColors}
                    ${paddingWithIcons}
                    ${paddingWithRightIcon}
                    ${className}
                `.trim()}
                aria-invalid={error ? true : undefined}
                {...props}
            />
            {rightIcon && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    {rightIcon}
                </div>
            )}
        </div>
    );
});

Input.displayName = 'Input';
