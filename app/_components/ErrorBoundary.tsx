"use client";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can log error info here if needed
    // console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#e6d3b3] bg-[#3e2c1c] rounded-xl border border-[#7c5c3e]">
          <h2 className="text-2xl font-bold mb-4">Something went wrong in this section.</h2>
          <p className="mb-4">Please reload the page or contact support if the problem persists.</p>
          <pre className="bg-[#2a1810] text-[#a67c52] p-4 rounded-lg overflow-x-auto max-w-full text-left text-xs">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
