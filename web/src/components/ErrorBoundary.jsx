import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Error caught by ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 bg-white border border-[#E5E7EB] rounded-xl text-center space-y-4 shadow-sm">
          <h2 className="text-xl font-bold text-[#2F2F2F]">Application Interface Error</h2>
          <p className="text-xs text-[#666666]">
            {this.state.error?.message || 'A temporary rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="px-4 py-2 bg-[#8FAF5A] text-white rounded-lg text-xs font-bold hover:bg-[#6B8E23] transition-colors"
          >
            Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
