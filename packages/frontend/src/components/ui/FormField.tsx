import React from 'react';

interface FormFieldProps {
    /** Field label */
    label: string;
    /** Show required indicator (*) */
    required?: boolean;
    /** Error message to display */
    error?: string;
    /** Help text displayed below the input */
    helpText?: string;
    /** Unique ID for accessibility (links label to input) */
    htmlFor?: string;
    /** The form input element */
    children: React.ReactNode;
    /** Additional class for the wrapper */
    className?: string;
}

export function FormField({
    label,
    required = false,
    error,
    helpText,
    htmlFor,
    children,
    className = '',
}: FormFieldProps) {
    return (
        <div className={className}>
            <label
                htmlFor={htmlFor}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
            {helpText && !error && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {helpText}
                </p>
            )}
        </div>
    );
}
