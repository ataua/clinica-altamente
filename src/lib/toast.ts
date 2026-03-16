import { toast as sonnerToast } from 'sonner'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  description?: string
  duration?: number
}

const toastFunctions: Record<ToastType, (message: string, options?: ToastOptions) => void> = {
  success: (message, options) => sonnerToast.success(message, options),
  error: (message, options) => sonnerToast.error(message, options),
  info: (message, options) => sonnerToast.info(message, options),
  warning: (message, options) => sonnerToast.warning(message, options),
}

export const toast = {
  success: (message: string, options?: ToastOptions) => toastFunctions.success(message, options),
  error: (message: string, options?: ToastOptions) => toastFunctions.error(message, options),
  info: (message: string, options?: ToastOptions) => toastFunctions.info(message, options),
  warning: (message: string, options?: ToastOptions) => toastFunctions.warning(message, options),
  promise: sonnerToast.promise,
}
