import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Vite 청크/에셋 로드 실패 시(새 배포로 인한 해시 변경 및 캐시 불일치) 자동 새로고침 복구
window.addEventListener('vite:preloadError', (event) => {
  const reloadKey = 'chunk_reload_attempt';
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  // 10초 이내에 반복 새로고침 방지
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem(reloadKey, now.toString());
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
