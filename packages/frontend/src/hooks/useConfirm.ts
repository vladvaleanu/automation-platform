/**
 * useConfirm Hook
 * Provides a programmatic way to show confirmation modals
 */

import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void | Promise<void>;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: () => {},
  });

  const confirm = useCallback((
    onConfirm: () => void | Promise<void>,
    options: ConfirmOptions
  ) => {
    setState({
      isOpen: true,
      isLoading: false,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'danger',
      ...options,
      onConfirm,
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await state.onConfirm();
      setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.onConfirm]);

  const handleClose = useCallback(() => {
    if (!state.isLoading) {
      setState(prev => ({ ...prev, isOpen: false }));
    }
  }, [state.isLoading]);

  return {
    confirm,
    confirmState: state,
    handleConfirm,
    handleClose,
  };
}
