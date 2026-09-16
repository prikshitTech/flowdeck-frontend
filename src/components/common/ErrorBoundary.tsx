import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

import Button from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
  compact?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed', error, info.componentStack);
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className={
          this.props.compact
            ? 'flex flex-col items-start gap-2 p-4'
            : 'flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center'
        }
      >
        <FiAlertTriangle className="text-2xl text-amber-600" />
        <p className="font-medium">This part of the page failed to load.</p>
        <p className="max-w-md text-sm text-stone-500">{this.state.error.message}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={this.reset}>
            Try again
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    );
  }
}
