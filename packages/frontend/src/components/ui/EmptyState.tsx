import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
    /** Icon to display (should be a 64x64 heroicon or similar) */
    icon?: React.ReactNode;
    /** Main title text */
    title: string;
    /** Description text below the title */
    description?: string;
    /** Primary action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Additional class for the wrapper */
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`text-center py-12 px-6 ${className}`}>
            {icon && (
                <div className="mx-auto mb-4 text-gray-300 dark:text-gray-600">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {title}
            </h3>
            {description && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-6">
                    <Button onClick={action.onClick}>
                        {action.label}
                    </Button>
                </div>
            )}
        </div>
    );
}
