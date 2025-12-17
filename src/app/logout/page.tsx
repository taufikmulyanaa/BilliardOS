'use client';

import { useEffect } from 'react';

export default function LogoutPage() {
    useEffect(() => {
        const doLogout = async () => {
            // Call logout API
            await fetch('/api/auth/logout', { method: 'POST' });

            // Clear any localStorage
            localStorage.removeItem('__logging_out');

            // Hard redirect to login
            window.location.replace('/login');
        };

        doLogout();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p style={{ color: 'var(--text-muted)' }}>Logging out...</p>
            </div>
        </div>
    );
}
