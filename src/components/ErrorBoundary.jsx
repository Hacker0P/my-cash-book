import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-rose-100">
            <AlertTriangle size={40} strokeWidth={1.5} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">
            The application encountered an unexpected error. We apologize for the inconvenience.
          </p>

          <button 
            onClick={this.handleReload}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-slate-900/20 hover:bg-slate-800"
          >
            <RefreshCw size={18} />
            Reload Application
          </button>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
             <div className="mt-12 p-4 bg-slate-100 rounded-xl text-left w-full max-w-md overflow-x-auto border border-slate-200">
                <p className="text-xs font-mono text-rose-600 font-bold mb-2">{this.state.error.toString()}</p>
                <pre className="text-[10px] text-slate-500 font-mono whitespace-pre-wrap">
                   {this.state.errorInfo?.componentStack}
                </pre>
             </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
