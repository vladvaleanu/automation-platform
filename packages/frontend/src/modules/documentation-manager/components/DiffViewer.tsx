
import { diffWords } from 'diff';
import { useMemo } from 'react';

interface DiffViewerProps {
    oldValue: string;
    newValue: string;
}

export function DiffViewer({ oldValue, newValue }: DiffViewerProps) {
    const diff = useMemo(() => {
        return diffWords(oldValue || '', newValue || '');
    }, [oldValue, newValue]);

    return (
        <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-wrap overflow-x-auto">
            {diff.map((part, index) => {
                const color = part.added
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : part.removed
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 line-through decoration-red-400 dark:decoration-red-600'
                        : 'text-gray-800 dark:text-gray-300';

                return (
                    <span key={index} className={`${color} px-0.5 rounded`}>
                        {part.value}
                    </span>
                );
            })}
        </div>
    );
}
