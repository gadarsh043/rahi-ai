import { Component } from 'react';
import ErrorFallback from './ErrorFallback/ErrorFallback';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          onRetry={() => {
            this.setState({ hasError: false });
          }}
        />
      );
    }
    // eslint-disable-next-line react/prop-types
    return this.props.children;
  }
}

