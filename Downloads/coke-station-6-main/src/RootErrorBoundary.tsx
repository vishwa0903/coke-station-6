import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

// Last line of defense: if anything anywhere in the app throws during
// render (this specific QuotaExceededError bug, or anything else in the
// future), show a small recoverable screen instead of an unhandled error
// leaving the page blank/black. This does not fix the underlying error —
// it only prevents "crash to nothing" from ever being the visible result.
export default class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Coke Station crashed and was caught by the root error boundary:", error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center", background: "#0d0c11", color: "#f4eef2", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: 40 }}>🥤</div>
        <h1 style={{ fontSize: 20, margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: 340, margin: 0, color: "#a89fae", fontSize: 13, lineHeight: 1.5 }}>
          The app hit an unexpected error and stopped to avoid showing a broken screen. Reloading usually fixes this.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ minHeight: 44, padding: "0 20px", border: 0, borderRadius: 10, background: "#af1117", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Reload the app
        </button>
      </div>
    );
  }
}
