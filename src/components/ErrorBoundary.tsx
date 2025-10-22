import React from "react";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

type Props = { 
  children: React.ReactNode; 
  onReset?: () => void;
  fallbackTitle?: string;
};

type State = { 
  hasError: boolean; 
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Runtime error caught:", { error, info });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">
              {this.props.fallbackTitle || "Falha ao carregar"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "Ocorreu um erro inesperado. Tente recarregar a página."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Tentar novamente
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Recarregar página
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
