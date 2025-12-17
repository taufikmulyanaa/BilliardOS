'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by checking for token in cookies
    const hasToken = document.cookie.includes('token=');

    if (hasToken) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="inline-block size-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"
          style={{ color: 'var(--accent-primary)' }}></div>
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  );
}
