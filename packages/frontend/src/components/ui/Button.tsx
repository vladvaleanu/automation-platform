import React, { ButtonHTMLAttributes } from 'react';
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

/**
 * Inline loading spinner for buttons
 */
function ButtonSpinner({ className = '' }: { className?: string }) {
    return (
        <div className={`inline-block animate-spin rounded-full h-4 w-4 border-2 border-b-white border-white/30 ${className}`} />
    );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
}, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 border border-transparent',
        secondary: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-transparent',
        ghost: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 bg-transparent',
        outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-blue-500 bg-transparent',
        link: 'text-blue-600 dark:text-blue-400 hover:underline focus:ring-blue-500 p-0 h-auto bg-transparent shadow-none',
    };

    const sizes = {
        xs: 'px-2.5 py-1.5 text-xs',
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            ref={ref}
            disabled={isLoading || disabled}
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${variant !== 'link' ? sizes[size] : ''}
        ${className}
      `}
            {...props}
        >
            {isLoading && (
                <span className="mr-2">
                    <ButtonSpinner />
                </span>
            )}
            {!isLoading && leftIcon && (
                <span className={children ? "mr-2" : ""}>
                    {leftIcon}
                </span>
            )}
            {children}
            {!isLoading && rightIcon && (
                <span className={children ? "ml-2" : ""}>
                    {rightIcon}
                </span>
            )}
        </button>
    );
});

Button.displayName = 'Button';
