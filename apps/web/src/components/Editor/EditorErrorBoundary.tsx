import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Called when the user clicks "Try again" — parent should increment a key to remount the editor. */
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-4 p-8">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <div className="text-center max-w-md">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Editor crashed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message ?? 'An unexpected error occurred in the editor.'}
            </p>
            <button
              className="text-sm text-blue-600 dark:text-blue-400 underline"
              onClick={() => {
                // Clearing React error state alone is not enough — the OO iframe is
                // destroyed. Calling onReset() causes the parent to change the key on
                // this boundary, which fully unmounts + remounts OnlyOfficeEmbed.
                this.setState({ hasError: false, error: null })
                this.props.onReset?.()
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
