import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ModuleErrorFallback } from './ModuleErrorFallback';

// Batch M.1: a crash inside one module shows a friendly message instead of a blank page. Error
// boundaries can only be class components. The shell keys it by route, so moving to another screen clears it.
export class ModuleErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Assessments v2: screen crashed', error, info.componentStack);
  }

  render() {
    return this.state.failed ? <ModuleErrorFallback /> : this.props.children;
  }
}
