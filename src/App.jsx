import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import NotebookExplorer from './components/NotebookExplorer';
import LoginView from './components/LoginView';
import { ShieldCheck } from 'lucide-react';

const ADMIN_EMAIL = 'finishor93@gmail.com';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.email === ADMIN_EMAIL) {
          setUser(currentUser);
          setUnauthorizedEmail(null);
        } else {
          // 비인가 계정 접근 차단
          setUnauthorizedEmail(currentUser.email);
          setUser(null);
          await signOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#0F172A',
          color: '#94A3B8',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}
        >
          <ShieldCheck size={28} color="#3B82F6" />
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0' }}>보안 인증 확인 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginView
        unauthorizedEmail={unauthorizedEmail}
        onClearUnauthorized={() => setUnauthorizedEmail(null)}
      />
    );
  }

  return <NotebookExplorer currentUser={user} onLogout={handleLogout} />;
}

