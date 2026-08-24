import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// POS-2 (POS-ERRHANDLING-v1) — lưới đỡ NGOÀI CÙNG. Bắt cả lỗi vẽ của
// AuthProvider / BrowserRouter / Layout, tức những chỗ mà lưới đỡ bên trong
// Layout không với tới được.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary label="Ứng dụng">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
