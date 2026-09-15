import React, { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

const ADMIN_EMAIL = 'finishor93@gmail.com';

export default function LoginView({ unauthorizedEmail, onClearUnauthorized }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    if (onClearUnauthorized) onClearUnauthorized();

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user && user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setErrorMsg(`접근 권한이 없는 계정입니다 (${user.email}). 관리자 계정(${ADMIN_EMAIL})으로 로그인해 주세요.`);
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('로그인 창이 닫혔습니다. 다시 시도해 주세요.');
      } else {
        setErrorMsg(err.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0F172A',
        backgroundImage: 'radial-gradient(at 0% 0%, #1E293B 0px, transparent 50%), radial-gradient(at 100% 100%, #1E1B4B 0px, transparent 50%)',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          padding: '36px 30px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1px solid #BFDBFE'
          }}
        >
          <ShieldCheck size={36} color="#2563EB" />
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}
        >
          인사이트 메모
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: '#64748B',
            margin: '0 0 24px 0',
            lineHeight: 1.5
          }}
        >
          금융 정보 및 개인 데이터 보호를 위해<br />
          <b style={{ color: '#2563EB' }}>지정된 구글 관리자 계정</b>으로만 접근할 수 있습니다.
        </p>

        {(unauthorizedEmail || errorMsg) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: '#FEF2F2',
              borderRadius: '10px',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              fontSize: '12px',
              lineHeight: 1.5,
              textAlign: 'left',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>접근 권한 제한 안내</div>
              <div>{errorMsg || `로그인하신 계정(${unauthorizedEmail})은 권한이 없습니다. 등록된 관리자(${ADMIN_EMAIL}) 계정으로 로그인해 주세요.`}</div>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#475569',
            marginBottom: '28px'
          }}
        >
          <Lock size={12} color="#059669" />
          <span>보안 잠금: <b>{ADMIN_EMAIL}</b></span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '13px 18px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#1E293B',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.15s ease',
            opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#94A3B8';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }
          }}
        >
          {loading ? (
            <span>로그인 중...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                />
              </svg>
              <span>Google 계정으로 로그인</span>
            </>
          )}
        </button>

        <div
          style={{
            marginTop: '24px',
            fontSize: '11px',
            color: '#94A3B8',
            lineHeight: 1.5
          }}
        >
          🔒 안전한 Firebase Authentication 보안 프로토콜을 사용합니다.
        </div>
      </div>
    </div>
  );
}
