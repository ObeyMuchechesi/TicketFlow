import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Legacy URL — the Gate Staff dashboard now lives at /staff
export default function CheckinHome() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          router.replace('/staff');
        } else {
          router.replace('/staff/login');
        }
      })
      .catch(() => router.replace('/staff/login'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fc', color: '#1a1d2e' }}>
      Redirecting to the Gate Staff dashboard…
    </div>
  );
}

CheckinHome.getLayout = (page) => page;
