/**
 * POS-2 (POS-ERRHANDLING-v1) — ErrorBoundary: lưới đỡ CUỐI CÙNG chống
 * trắng màn hình bán hàng.
 *
 * ⚠ GIỚI HẠN PHẢI NHỚ (checklist A3): React CHỈ bắt lỗi lúc VẼ và trong vòng
 * đời component. Nó KHÔNG bắt lỗi trong onClick, trong async/await, trong
 * setTimeout, hay Promise bị bỏ rơi. Vì vậy file này KHÔNG thay thế được việc
 * kiểm res.ok ở utils/api.js — nó chỉ giữ cho MỘT lỗi vẽ khỏi thổi bay cả app.
 *
 * Cố ý dùng style nội tuyến, không phụ thuộc index.css: nếu app vỡ vì lý do
 * liên quan tới CSS thì màn báo lỗi vẫn phải đọc được.
 */
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, stack: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(
      '[ErrorBoundary] Lỗi khi vẽ giao diện:',
      error,
      info && info.componentStack
    );
    this.setState({ stack: (info && info.componentStack) || null });
  }

  render() {
    const { error, stack } = this.state;
    if (!error) return this.props.children;

    const nhan = this.props.label || 'Giao diện';

    return (
      <div style={{ padding: '2rem 1.25rem', maxWidth: '640px', margin: '0 auto' }}>
        <div
          style={{
            border: '1px solid #fecaca',
            background: '#fef2f2',
            borderRadius: '12px',
            padding: '1.25rem'
          }}
        >
          <h2 style={{ margin: '0 0 .5rem', fontSize: '1.05rem', color: '#b91c1c' }}>
            {nhan} gặp lỗi
          </h2>

          <p style={{ margin: '0 0 .75rem', color: '#7f1d1d', lineHeight: 1.55 }}>
            Lỗi xảy ra khi vẽ giao diện. Dữ liệu đã lưu trên máy chủ không bị
            ảnh hưởng, nhưng thao tác đang làm dở có thể phải nhập lại.
          </p>

          <div
            style={{
              fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
              fontSize: '.8rem',
              color: '#991b1b',
              background: '#fff',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '.6rem .75rem',
              marginBottom: '1rem',
              wordBreak: 'break-word'
            }}
          >
            {error.message || String(error)}
          </div>

          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => this.setState({ error: null, stack: null })}
              style={{
                padding: '.55rem 1.1rem',
                borderRadius: '8px',
                border: '1px solid #b91c1c',
                background: '#b91c1c',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '.55rem 1.1rem',
                borderRadius: '8px',
                border: '1px solid #b91c1c',
                background: '#fff',
                color: '#b91c1c',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Tải lại trang
            </button>
          </div>

          {stack && (
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#7f1d1d', fontSize: '.85rem' }}>
                Chi tiết kỹ thuật (gửi cho kỹ thuật khi báo lỗi)
              </summary>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '.72rem',
                  color: '#7f1d1d',
                  marginTop: '.5rem',
                  maxHeight: '220px',
                  overflow: 'auto'
                }}
              >
                {stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
