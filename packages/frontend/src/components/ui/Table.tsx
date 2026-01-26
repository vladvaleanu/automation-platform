import React from 'react';

// Table wrapper
interface TableProps {
    children: React.ReactNode;
    className?: string;
}

export function Table({ children, className = '' }: TableProps) {
    return (
        <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
            {children}
        </table>
    );
}

// Table head section
interface TableHeadProps {
    children: React.ReactNode;
    className?: string;
}

export function TableHead({ children, className = '' }: TableHeadProps) {
    return (
        <thead className={`bg-gray-50 dark:bg-gray-900 ${className}`}>
            {children}
        </thead>
    );
}

// Table header cell
interface TableHeaderProps {
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export function TableHeader({
    children,
    className = '',
    align = 'left',
}: TableHeaderProps) {
    const alignmentClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <th
            className={`
                px-6 py-3 text-xs font-medium uppercase tracking-wider
                text-gray-500 dark:text-gray-400
                ${alignmentClasses[align]}
                ${className}
            `}
        >
            {children}
        </th>
    );
}

// Table body section
interface TableBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function TableBody({ children, className = '' }: TableBodyProps) {
    return (
        <tbody className={`bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
            {children}
        </tbody>
    );
}

// Table row
interface TableRowProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export function TableRow({
    children,
    className = '',
    onClick,
    hoverable = true,
}: TableRowProps) {
    return (
        <tr
            className={`
                ${hoverable ? 'hover:bg-gray-50 dark:hover:bg-gray-900/30' : ''}
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </tr>
    );
}

// Table cell
interface TableCellProps {
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export function TableCell({
    children,
    className = '',
    align = 'left',
}: TableCellProps) {
    const alignmentClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <td
            className={`
                px-6 py-4 whitespace-nowrap text-sm
                text-gray-900 dark:text-white
                ${alignmentClasses[align]}
                ${className}
            `}
        >
            {children}
        </td>
    );
}
