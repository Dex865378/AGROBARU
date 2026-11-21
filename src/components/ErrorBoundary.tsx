import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Último recurso de la interfaz: evita una pantalla en blanco si un componente
 * lanza un error inesperado. La sesión y los datos no se modifican.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[AgroBarú] Error de interfaz:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#090D0B] px-5 py-10 text-[#E5E5E5] flex items-center justify-center font-sans">
        <div className="w-full max-w-md border border-[#1E2E26] bg-[#111714] p-6 text-center space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#10B981]">
            AgroBarú · Protección de interfaz
          </div>
          <h1 className="font-display text-xl font-bold">No pudimos mostrar esta pantalla</h1>
          <p className="text-sm text-[#9E9E9E] leading-relaxed">
            Tus datos están guardados. Recarga la página para volver a intentarlo. Si el problema
            continúa, escríbenos desde el centro de soporte.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 min-h-10 bg-[#15803D] text-white font-bold text-sm px-4 py-2 hover:bg-[#10B981] transition-colors"
            >
              Recargar página
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/sitio')}
              className="flex-1 min-h-10 border border-[#1E2E26] text-[#E5E5E5] font-bold text-sm px-4 py-2 hover:border-[#10B981] transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}
