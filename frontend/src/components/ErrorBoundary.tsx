import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="page" role="alert">
          <h1>Algo falló</h1>
          <p>{this.state.error?.message}</p>
          <button type="button" onClick={() => this.setState({ hasError: false, error: null })}>
            Reintentar
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
