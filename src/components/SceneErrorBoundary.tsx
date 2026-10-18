import { Component, type ReactNode } from 'react';

/** If anything in the 3D layer throws, switch to the non-WebGL stage. */
export class SceneErrorBoundary extends Component<{ children: ReactNode; onError: (reason: string) => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error instanceof Error ? error.message : 'Scene error');
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
