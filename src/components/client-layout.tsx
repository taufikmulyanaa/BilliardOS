'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import { AuthProvider } from '@/components/auth-provider';
import { ToastProvider } from '@/components/toast-provider';
import { ThemeProvider } from '@/components/theme-provider';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isManagerPage = pathname.startsWith('/manager');

    return (
        <ThemeProvider>
            <AuthProvider>
                <ToastProvider>
                    {isAuthPage || isManagerPage ? (
                        // Auth pages and Manager pages render children directly (Manager has its own layout)
                        <>{children}</>
                    ) : (
                        // App pages get the full layout with header
                        <div className="flex flex-col h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
                            <Header />
                            <main className="flex-1 overflow-hidden relative flex flex-col">
                                {children}
                            </main>
                        </div>
                    )}
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
