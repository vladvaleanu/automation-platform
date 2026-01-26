import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    onClick?: () => void;
    hoverable?: boolean;
}

export function Card({
    children,
    className = '',
    noPadding = false,
    onClick,
    hoverable = false,
    ...props
}: CardProps) {
    return (
        <div
            className={`
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700 
        rounded-lg shadow-sm 
        ${noPadding ? '' : 'p-6'} 
        ${hoverable || onClick ? 'transition-all hover:shadow-md cursor-pointer' : ''}
        ${className}
      `}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
            {children}
        </h3>
    );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`p-6 ${className}`}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 ${className}`}>
            {children}
        </div>
    );
}
