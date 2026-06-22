"use client"

import React, { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[ErrorBoundary] Caught error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error caught at:', errorInfo.componentStack)
    console.error('[ErrorBoundary] Full error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-6 max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
                <h2 className="text-lg font-bold text-red-900 dark:text-red-100">
                  Error Terjadi
                </h2>
              </div>
              <p className="text-sm text-red-700 dark:text-red-200 mb-4">
                {this.state.error?.message || 'Aplikasi mengalami error tidak terduga'}
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  // Reset entire app
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 font-semibold transition-colors"
              >
                Reload Aplikasi
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
