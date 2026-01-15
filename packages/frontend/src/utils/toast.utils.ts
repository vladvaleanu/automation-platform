/**
 * Toast Notification Utilities
 * Simple toast notification system without external dependencies
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

let toastContainer: HTMLElement | null = null;
let toastId = 0;

/**
 * Initialize toast container
 */
function getToastContainer(): HTMLElement {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Get toast styling based on type
 */
function getToastStyles(type: ToastType): string {
  const baseStyles = `
    pointer-events: auto;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
    font-size: 0.875rem;
    font-weight: 500;
  `;

  const typeStyles = {
    success: 'background-color: #10b981; color: white;',
    error: 'background-color: #ef4444; color: white;',
    warning: 'background-color: #f59e0b; color: white;',
    info: 'background-color: #3b82f6; color: white;',
  };

  return `${baseStyles}${typeStyles[type]}`;
}

/**
 * Get icon for toast type
 */
function getToastIcon(type: ToastType): string {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ⓘ',
  };
  return `<span style="font-size: 1.25rem; font-weight: bold;">${icons[type]}</span>`;
}

/**
 * Show a toast notification
 */
export function showToast(message: string, options: ToastOptions = {}): void {
  const {
    type = 'info',
    duration = 4000,
  } = options;

  const container = getToastContainer();
  const id = ++toastId;

  // Create toast element
  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.style.cssText = getToastStyles(type);
  toast.innerHTML = `
    ${getToastIcon(type)}
    <span style="flex: 1;">${message}</span>
    <button
      onclick="this.parentElement.remove()"
      style="
        background: none;
        border: none;
        color: currentColor;
        cursor: pointer;
        opacity: 0.7;
        font-size: 1.25rem;
        line-height: 1;
        padding: 0;
        margin-left: 0.5rem;
      "
    >×</button>
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  if (!document.head.querySelector('#toast-animations')) {
    style.id = 'toast-animations';
    document.head.appendChild(style);
  }

  container.appendChild(toast);

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        toast.remove();
        // Clean up container if empty
        if (container.children.length === 0) {
          container.remove();
          toastContainer = null;
        }
      }, 300);
    }, duration);
  }
}

/**
 * Show success toast
 */
export function showSuccess(message: string, duration?: number): void {
  showToast(message, { type: 'success', duration });
}

/**
 * Show error toast
 */
export function showError(message: string, duration?: number): void {
  showToast(message, { type: 'error', duration: duration || 6000 });
}

/**
 * Show warning toast
 */
export function showWarning(message: string, duration?: number): void {
  showToast(message, { type: 'warning', duration });
}

/**
 * Show info toast
 */
export function showInfo(message: string, duration?: number): void {
  showToast(message, { type: 'info', duration });
}
