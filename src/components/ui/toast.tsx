'use client'

import { toast as sonnerToast } from 'sonner'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  description?: string
  duration?: number
}

function toastFunction(type: ToastType) {
  return (message: string, options?: ToastOptions) => {
    sonnerToast[type](message, options)
  }
}

export const toast = {
  success: toastFunction('success'),
  error: toastFunction('error'),
  info: toastFunction('info'),
  warning: toastFunction('warning'),
  promise: sonnerToast.promise,
}
