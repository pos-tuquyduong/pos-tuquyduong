import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/**
 * A5: Modal quét QR mã khuyến mãi bằng camera.
 * Thuần client — không gọi API mới, không đụng luồng tiền.
 * Đọc được QR → gọi onResult(text) rồi tự đóng. Cha (Sales.jsx) tự quyết định
 * làm gì với text đọc được (đổ vào ô mã, gọi validateDiscountCode như cũ).
 */
export default function QrScanModal({ onResult, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const doneRef = useRef(false); // chặn bắn kết quả 2 lần nếu 2 frame liền đọc trúng
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          // Component đã bị đóng trong lúc chờ quyền camera → tắt ngay, đừng rò rỉ stream.
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.name === 'NotAllowedError'
              ? 'Chưa được cấp quyền camera. Vào cài đặt trình duyệt để bật quyền, hoặc nhập mã tay.'
              : 'Không mở được camera. Nhập mã tay bên dưới.'
          );
        }
      }
    }

    function tick() {
      if (cancelled || doneRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          doneRef.current = true;
          onResult(code.data);
          return; // không schedule frame kế, để cleanup lo phần dừng stream
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [onResult]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '0.75rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #eee',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quét mã QR</span>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '1.1rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
            }}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#dc2626', fontSize: '0.85rem' }}>
            {error}
          </div>
        ) : (
          <div style={{ position: 'relative', background: '#000' }}>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', display: 'block', maxHeight: '70vh' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '15%',
                border: '2px solid #22c55e',
                borderRadius: '8px',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
