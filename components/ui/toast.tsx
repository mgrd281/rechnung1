'use client'

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import { Check, CircleX, X, Info, TriangleAlert, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastProps {
  id: string
  title?: string
  description?: string
  message?: string
  type: 'success' | 'error' | 'info' | 'warning' | 'loading'
  onClose: (id: string) => void
  duration?: number
  variant?: 'standard' | 'premium'
  action?: ToastAction
}

interface ToastContextType {
  showToast: (message: string, type?: ToastProps['type'], options?: ToastOptions) => string
  removeToast: (id: string) => void
  toasts: ToastProps[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function Toast({
  id,
  title,
  description,
  message,
  type,
  onClose,
  duration = 5000,
  variant = 'standard',
  action
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const remainingRef = useRef<number>(duration)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }, [id, onClose])

  const startTimer = useCallback(() => {
    if (type === 'loading') return // Loading toasts often stay until manually closed or replaced
    startTimeRef.current = Date.now()
    timerRef.current = setTimeout(handleClose, remainingRef.current)
  }, [handleClose, type])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      remainingRef.current -= Date.now() - startTimeRef.current
    }
  }, [])

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [startTimer])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Check className="h-4 w-4 text-emerald-500" />
          </div>
        )
      case 'error':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <CircleX className="h-4 w-4 text-red-500" />
          </div>
        )
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'warning':
        return <TriangleAlert className="h-5 w-5 text-amber-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  if (variant === 'premium') {
    return (
      <div
        role="status"
        aria-live="polite"
        onMouseEnter={clearTimer}
        onMouseLeave={startTimer}
        className={cn(
          "relative group w-[360px] sm:w-[420px] bg-[#0B0F19] border border-white/10 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 transform",
          isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
        )}
      >
        <div className="flex gap-4">
          {getIcon()}
          <div className="flex-1 min-w-0 pr-2">
            {title && <h4 className="text-sm font-bold text-white leading-tight mb-1">{title}</h4>}
            <p className="text-[13px] font-medium text-gray-400 leading-snug">{description || message}</p>
            {action && (
              <button
                onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                className="mt-3 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all"
              >
                {action.label}
              </button>
            )}
          </div>
          <button onClick={handleClose} className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const standardStyles = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-900 shadow-emerald-100/20',
    error: 'bg-red-50 border-red-100 text-red-900 shadow-red-100/20',
    info: 'bg-blue-50 border-blue-100 text-blue-900 shadow-blue-100/20',
    warning: 'bg-amber-50 border-amber-100 text-amber-900 shadow-amber-100/20',
    loading: 'bg-slate-50 border-slate-200 text-slate-900 shadow-slate-100/20'
  }

  return (
    <div
      className={cn(
        "flex items-center p-4 rounded-2xl border shadow-xl max-w-md bg-white transition-all duration-300",
        standardStyles[type] || standardStyles.info,
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
      )}
    >
      <div className="flex items-center">
        {getIcon()}
        <div className="ml-3">
          {title && <p className="text-xs font-black uppercase tracking-tight mb-0.5">{title}</p>}
          <p className="text-sm font-medium">{description || message}</p>
        </div>
      </div>
      <button onClick={handleClose} className="ml-6 p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'standard' | 'premium'
  duration?: number
  action?: ToastAction
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps>>([])

  const showToast = useCallback((message: string, type: ToastProps['type'] = 'info', options?: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      id,
      message,
      type,
      title: options?.title,
      description: options?.description,
      variant: options?.variant || 'standard',
      duration: options?.duration,
      action: options?.action,
      onClose: removeToast
    }
    setToasts(prev => [...prev.slice(-4), newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
