import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', color: '#f43f5e', fontFamily: 'monospace', background: '#090d16', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>[시스템 오류 복구 모드] 렌더링 중 오류가 발생했습니다.</h1>
          <p style={{ marginTop: '10px', color: '#cbd5e1' }}>오류 메시지: {this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            대시보드 새로고침 및 복구
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
