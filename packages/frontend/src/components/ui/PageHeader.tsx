import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    actions,
    children,
    className = '',
    icon
}: PageHeaderProps) {
    return (
        <div className={`mb-8 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="flex-shrink-0">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
            {children && (
                <div className="mt-6">
                    {children}
                </div>
            )}
        </div>
    );
}
