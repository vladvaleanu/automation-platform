import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-5xl',
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm"
                    aria-hidden="true"
                    onClick={onClose}
                />

                {/* Modal Panel */}
                <div
                    className={`
            relative transform overflow-hidden rounded-lg 
            bg-white dark:bg-gray-800 
            text-left shadow-xl transition-all 
            sm:my-8 w-full ${sizes[size]}
            border border-gray-200 dark:border-gray-700
          `}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            {title && (
                                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                                    {title}
                                </h3>
                            )}
                            {showCloseButton && (
                                <button
                                    type="button"
                                    className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close</span>
                                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Body */}
                    <div className="px-6 py-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

export function ModalFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 ${className}`}>
            {children}
        </div>
    );
}
