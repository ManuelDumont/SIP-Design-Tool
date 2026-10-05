import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('sip_designer_theme');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-8 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Er is een onverwachte fout opgetreden</h2>
            <p className="text-sm text-slate-600 mb-6">
              De applicatie kon het scherm niet correct laden. Klik hieronder om de pagina opnieuw te initialiseren.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-slate-50 text-slate-700 p-3 rounded border text-left overflow-x-auto mb-6 max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 shadow transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Herlaad applicatie
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
