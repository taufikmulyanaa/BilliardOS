'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: number;
    username: string;
    role: string;
    fullName: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
});

// Helper function to determine redirect path based on role
const getRedirectPath = (role: string): string => {
    if (role === 'MANAGER') return '/manager';
    return '/dashboard'; // ADMIN, CASHIER and default
};

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        // Return null user on error (401, etc)
        return { user: null };
    }
    return res.json();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { data, error, mutate } = useSWR('/api/auth/me', fetcher, {
        shouldRetryOnError: false,
        revalidateOnFocus: false,
    });

    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const hasCheckedLogout = useRef(false);

    useEffect(() => {
        if (data !== undefined || error) {
            setLoading(false);
        }
    }, [data, error]);

    useEffect(() => {
        // Check if we just logged out
        if (!hasCheckedLogout.current && typeof window !== 'undefined') {
            const loggedOut = localStorage.getItem('__logging_out');
            if (loggedOut) {
                localStorage.removeItem('__logging_out');
                hasCheckedLogout.current = true;
                // Don't do any redirects, we're on login page after logout
                return;
            }
            hasCheckedLogout.current = true;
        }

        // Only check if we've done the logout check
        if (!hasCheckedLogout.current) {
            return;
        }

        if (!loading && !data?.user && pathname !== '/login' && pathname !== '/logout') {
            router.push('/login');
        }
        if (!loading && data?.user && (pathname === '/login' || pathname === '/')) {
            router.push(getRedirectPath(data.user.role));
        }

        // Redirect Manager/Admin away from Cashier Dashboard
        if (!loading && data?.user && pathname === '/dashboard') {
            const path = getRedirectPath(data.user.role);
            if (path !== '/dashboard') {
                router.push(path);
            }
        }
    }, [data, loading, pathname, router]);

    const login = async (credentials: any) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (res.ok) {
            const responseData = await res.json();
            await mutate(); // Revalidate user
            router.push(getRedirectPath(responseData.user.role));
        } else {
            throw await res.json();
        }
    };

    const logout = async () => {
        try {
            // Set flag in localStorage before navigation
            if (typeof window !== 'undefined') {
                localStorage.setItem('__logging_out', 'true');
            }

            // Call logout API to clear cookie
            await fetch('/api/auth/logout', { method: 'POST' });

            // Clear SWR cache
            await mutate({ user: null }, { revalidate: false });

            // Use window.location for hard redirect (clears all state)
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            if (typeof window !== 'undefined') {
                localStorage.setItem('__logging_out', 'true');
            }
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user: data?.user || null, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
