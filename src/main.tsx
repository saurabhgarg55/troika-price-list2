import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>Window Error</h1><pre>${e.message}</pre><pre>${e.error?.stack}</pre></div>`;
});
window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>Unhandled Promise Rejection</h1><pre>${e.reason?.message || e.reason}</pre><pre>${e.reason?.stack}</pre></div>`;
});

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', padding: '20px'}}>
        <h1>React Render Error</h1>
        <pre>{this.state.error?.message}</pre>
        <pre>{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
