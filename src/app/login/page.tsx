'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Gamepad2, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await login({ username, password });
        } catch (err: any) {
            setError(err.error || 'Login failed');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-base)' }}>
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full filter blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full filter blur-[150px] opacity-15 translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: 'var(--accent-brand)' }}></div>
            </div>

            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-8">
                    <div className="size-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3" style={{
                        backgroundColor: 'var(--accent-primary)',
                        boxShadow: '0 0 30px rgba(240, 112, 0, 0.4)'
                    }}>
                        <Gamepad2 size={40} style={{ color: 'var(--text-inverse)' }} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
                        Billiard<span style={{ color: 'var(--accent-primary)' }}>OS</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Sign in to manage your venue</p>
                </div>

                <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-6 shadow-2xl" style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)'
                }}>
                    {error && (
                        <div className="text-sm p-3 rounded-lg text-center" style={{
                            backgroundColor: 'var(--danger-light)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: 'var(--danger)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-lg px-4 py-3 outline-none transition-all"
                            style={{
                                backgroundColor: 'var(--bg-base)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)'
                            }}
                            placeholder="Enter your username"
                            required
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--accent-primary)';
                                e.target.style.boxShadow = '0 0 0 1px var(--accent-primary)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border-default)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg px-4 py-3 outline-none transition-all"
                            style={{
                                backgroundColor: 'var(--bg-base)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)'
                            }}
                            placeholder="••••••••"
                            required
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--accent-primary)';
                                e.target.style.boxShadow = '0 0 0 1px var(--accent-primary)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border-default)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--text-inverse)'
                        }}
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
                    </button>
                </form>

                <p className="text-center text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
                    &copy; 2025 BilliardOS Management System
                </p>
            </div>
        </div>
    );
}
