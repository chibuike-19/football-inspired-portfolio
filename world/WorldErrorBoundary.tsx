"use client";

import { Component, type ReactNode } from "react";

interface Props {
  onError: (error: unknown) => void;
  children: ReactNode;
}

/** Any render error in the 3D tree falls back to Classic view instead of a blank page. */
export class WorldErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
